import logging
import os
import re
from typing import Any, Callable, Dict, List, Literal, Optional, Tuple

import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.base import get_db
from app.models.resource import Project, Resource
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)

LLM_PROVIDERS = ("openai", "gemini", "anthropic", "huggingface", "custom")
COPILOT_SYSTEM_PROMPT = (
    "You are Nebula Copilot, a cloud troubleshooting assistant for AWS, Azure, and GCP. "
    "Be practical and precise. Prefer safe actions. Avoid destructive recommendations."
)


class CopilotRequest(BaseModel):
    prompt: str = Field(min_length=2, max_length=4000)
    deployment_id: Optional[int] = None
    resource_id: Optional[int] = None
    provider: Literal["auto", "openai", "gemini", "anthropic", "huggingface", "custom"] = "auto"
    allow_fallback: bool = True


class CopilotFinding(BaseModel):
    severity: Literal["info", "warning", "error"]
    title: str
    evidence: Optional[str] = None
    recommendation: str


class CopilotAction(BaseModel):
    label: str
    action_type: Literal["navigate", "api"]
    description: str
    route: Optional[str] = None
    method: Optional[str] = None
    endpoint: Optional[str] = None
    body: Optional[Dict[str, Any]] = None
    requires_confirmation: bool = False


class CopilotResponse(BaseModel):
    answer: str
    findings: List[CopilotFinding]
    actions: List[CopilotAction]
    context: Dict[str, Any]


def _extract_logs(terraform_output: Any) -> str:
    if not isinstance(terraform_output, dict):
        return ""
    logs = terraform_output.get("logs")
    if isinstance(logs, str):
        return logs
    if isinstance(logs, list):
        return "\n".join(str(line) for line in logs)
    error = terraform_output.get("error")
    detail = terraform_output.get("detail")
    parts = [str(p) for p in [error, detail] if p]
    return "\n".join(parts)


def _truncate(value: str, limit: int = 320) -> str:
    clean = " ".join(value.split())
    if len(clean) <= limit:
        return clean
    return f"{clean[: limit - 3]}..."


def _pattern_findings(text: str) -> List[CopilotFinding]:
    checks: List[Tuple[str, str, str, str]] = [
        (
            r"accessdenied|unauthorizedoperation|not authorized|permission denied",
            "Cloud IAM Permission Issue",
            "error",
            "Verify cloud account roles/policies and re-run provisioning after updating permissions.",
        ),
        (
            r"invalidclienttokenid|expiredtoken|signaturedoesnotmatch|token",
            "Credential Authentication Failed",
            "error",
            "Reconnect the cloud account with valid credentials and trigger a fresh sync.",
        ),
        (
            r"bucketalreadyexists|already exists|name.*already.*taken",
            "Resource Name Conflict",
            "warning",
            "Use a globally unique resource name and retry the deployment.",
        ),
        (
            r"quota|limitexceeded|insufficient",
            "Provider Quota or Capacity Limit",
            "warning",
            "Use a smaller instance/function size or request a quota increase in the target region.",
        ),
        (
            r"init.*error|provider registry|terraform init|failed to install provider",
            "Terraform Initialization Issue",
            "error",
            "Re-run deployment after confirming provider connectivity and valid Terraform module configuration.",
        ),
        (
            r"ami-|image id|invalid image|could not find image|no image found",
            "Missing or Invalid Image/AMI",
            "error",
            "Update the module to use a valid AMI or use auto-discovery 'data' blocks to fetch the latest image.",
        ),
        (
            r"protocol.*email.*sns.*fifo|invalid parameter.*protocol.*email",
            "SNS FIFO Protocol Compatibility Error",
            "error",
            "SNS FIFO topics do not support the 'email' protocol. Create a Standard topic or use a Lambda/SQS relay.",
        ),
        (
            r"timeout|timed out|deadline exceeded|context deadline exceeded",
            "Operation Timeout",
            "warning",
            "Retry the action and consider reducing resource complexity or choosing a different region.",
        ),

    ]

    findings: List[CopilotFinding] = []
    scanned = text.lower()

    for pattern, title, severity, recommendation in checks:
        match = re.search(pattern, scanned)
        if not match:
            continue
        start = max(0, match.start() - 70)
        end = min(len(text), match.end() + 90)
        evidence = _truncate(text[start:end])
        findings.append(
            CopilotFinding(
                severity=severity,  # type: ignore[arg-type]
                title=title,
                evidence=evidence,
                recommendation=recommendation,
            )
        )

    return findings


def _request_timeout_seconds() -> int:
    raw = os.getenv("AI_HTTP_TIMEOUT_SECONDS", "18").strip()
    try:
        value = int(raw)
    except ValueError:
        return 18
    return max(5, min(120, value))


def _configured_provider_status() -> Dict[str, bool]:
    return {
        "openai": bool(os.getenv("OPENAI_API_KEY", "").strip()),
        "gemini": bool(os.getenv("GEMINI_API_KEY", "").strip()),
        "anthropic": bool(os.getenv("ANTHROPIC_API_KEY", "").strip()),
        "huggingface": bool(os.getenv("HUGGINGFACE_API_KEY", "").strip()),
        "custom": bool(os.getenv("CUSTOM_LLM_ENDPOINT", "").strip()),
    }


def _configured_providers(status: Optional[Dict[str, bool]] = None) -> List[str]:
    provider_status = status or _configured_provider_status()
    return [provider for provider in LLM_PROVIDERS if provider_status.get(provider)]


def _provider_order(status: Dict[str, bool]) -> List[str]:
    preferred = os.getenv("AI_PROVIDER", "").strip().lower()
    priority_env = os.getenv("AI_PROVIDER_PRIORITY", "").strip()
    if priority_env:
        priority = [item.strip().lower() for item in priority_env.split(",") if item.strip()]
    else:
        priority = list(LLM_PROVIDERS)

    filtered_priority = [item for item in priority if item in LLM_PROVIDERS]
    for provider in LLM_PROVIDERS:
        if provider not in filtered_priority:
            filtered_priority.append(provider)

    ordered = [provider for provider in filtered_priority if status.get(provider)]
    if preferred and preferred in ordered:
        ordered.remove(preferred)
        ordered.insert(0, preferred)
    return ordered


def _build_user_content(prompt: str, context: Dict[str, Any], findings: List[CopilotFinding]) -> str:
    findings_lines = [
        f"- [{finding.severity}] {finding.title}: {finding.recommendation}"
        for finding in findings
    ]
    findings_summary = "\n".join(findings_lines) if findings_lines else "- No deterministic findings."

    return (
        "User ask:\n"
        f"{prompt}\n\n"
        "Context:\n"
        f"{context}\n\n"
        "Initial findings:\n"
        f"{findings_summary}\n\n"
        "Respond with a concise cloud troubleshooting answer with concrete next steps."
    )


def _openai_completion(user_content: str, timeout: int) -> str:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": COPILOT_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.2,
        "max_tokens": 400,
    }

    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=timeout,
    )
    response.raise_for_status()
    data = response.json()
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    if isinstance(content, str) and content.strip():
        return content.strip()
    raise RuntimeError("OpenAI returned an empty response")


def _gemini_completion(user_content: str, timeout: int) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip() or "gemini-1.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "systemInstruction": {"parts": [{"text": COPILOT_SYSTEM_PROMPT}]},
        "contents": [{"parts": [{"text": user_content}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 400,
        },
    }

    response = requests.post(
        url,
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=timeout,
    )
    response.raise_for_status()
    data = response.json()
    candidates = data.get("candidates", [])
    if not candidates:
        block_reason = data.get("promptFeedback", {}).get("blockReason")
        if block_reason:
            raise RuntimeError(f"Gemini blocked prompt: {block_reason}")
        raise RuntimeError("Gemini returned no candidates")

    parts = candidates[0].get("content", {}).get("parts", [])
    output = " ".join(str(part.get("text", "")).strip() for part in parts if isinstance(part, dict)).strip()
    if output:
        return output
    raise RuntimeError("Gemini returned empty content")


def _anthropic_completion(user_content: str, timeout: int) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not configured")

    model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022").strip() or "claude-3-5-sonnet-20241022"
    payload = {
        "model": model,
        "system": COPILOT_SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": user_content}],
        "temperature": 0.2,
        "max_tokens": 400,
    }

    response = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json=payload,
        timeout=timeout,
    )
    response.raise_for_status()
    data = response.json()
    content_blocks = data.get("content", [])
    text_parts: List[str] = []
    for block in content_blocks:
        if isinstance(block, dict) and block.get("type") == "text":
            text_parts.append(str(block.get("text", "")).strip())
    output = "\n".join(part for part in text_parts if part).strip()
    if output:
        return output
    raise RuntimeError("Anthropic returned empty content")


def _huggingface_completion(user_content: str, timeout: int) -> str:
    api_key = os.getenv("HUGGINGFACE_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("HUGGINGFACE_API_KEY is not configured")

    model = os.getenv("HUGGINGFACE_MODEL", "HuggingFaceH4/zephyr-7b-beta").strip() or "HuggingFaceH4/zephyr-7b-beta"
    payload = {
        "inputs": f"{COPILOT_SYSTEM_PROMPT}\n\n{user_content}\n\nAnswer:",
        "parameters": {
            "max_new_tokens": 400,
            "temperature": 0.2,
            "return_full_text": False,
        },
    }

    response = requests.post(
        f"https://api-inference.huggingface.co/models/{model}",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=timeout,
    )
    response.raise_for_status()
    data = response.json()

    if isinstance(data, dict):
        if isinstance(data.get("error"), str):
            raise RuntimeError(data["error"])
        text = data.get("generated_text")
        if isinstance(text, str) and text.strip():
            return text.strip()

    if isinstance(data, list) and data:
        first = data[0]
        if isinstance(first, str) and first.strip():
            return first.strip()
        if isinstance(first, dict):
            text = first.get("generated_text")
            if isinstance(text, str) and text.strip():
                return text.strip()
        if isinstance(first, list) and first:
            nested = first[0]
            if isinstance(nested, dict):
                text = nested.get("generated_text")
                if isinstance(text, str) and text.strip():
                    return text.strip()

    raise RuntimeError("Hugging Face returned an unsupported response payload")


def _extract_common_text(data: Any) -> str:
    if isinstance(data, str) and data.strip():
        return data.strip()

    if isinstance(data, dict):
        for key in ("answer", "output", "text", "generated_text"):
            value = data.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

        choices = data.get("choices")
        if isinstance(choices, list) and choices:
            first = choices[0]
            if isinstance(first, dict):
                message = first.get("message")
                if isinstance(message, dict):
                    content = message.get("content")
                    if isinstance(content, str) and content.strip():
                        return content.strip()
                text_value = first.get("text")
                if isinstance(text_value, str) and text_value.strip():
                    return text_value.strip()

    if isinstance(data, list) and data:
        for item in data:
            extracted = _extract_common_text(item)
            if extracted:
                return extracted

    return ""


def _custom_completion(user_content: str, timeout: int) -> str:
    endpoint = os.getenv("CUSTOM_LLM_ENDPOINT", "").strip()
    if not endpoint:
        raise RuntimeError("CUSTOM_LLM_ENDPOINT is not configured")

    model = os.getenv("CUSTOM_LLM_MODEL", "ft-cloud-copilot").strip() or "ft-cloud-copilot"
    payload_mode = os.getenv("CUSTOM_LLM_FORMAT", "openai").strip().lower() or "openai"

    headers: Dict[str, str] = {"Content-Type": "application/json"}
    api_key = os.getenv("CUSTOM_LLM_API_KEY", "").strip()
    if api_key:
        api_key_header = os.getenv("CUSTOM_LLM_API_KEY_HEADER", "Authorization").strip() or "Authorization"
        if api_key_header.lower() == "authorization":
            auth_scheme = os.getenv("CUSTOM_LLM_AUTH_SCHEME", "Bearer").strip()
            headers[api_key_header] = f"{auth_scheme} {api_key}".strip() if auth_scheme else api_key
        else:
            headers[api_key_header] = api_key

    if payload_mode == "openai":
        payload: Dict[str, Any] = {
            "model": model,
            "messages": [
                {"role": "system", "content": COPILOT_SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.2,
            "max_tokens": 400,
        }
    elif payload_mode == "simple":
        payload = {
            "model": model,
            "system_prompt": COPILOT_SYSTEM_PROMPT,
            "prompt": user_content,
            "temperature": 0.2,
            "max_tokens": 400,
        }
    else:
        raise RuntimeError("CUSTOM_LLM_FORMAT must be 'openai' or 'simple'")

    response = requests.post(
        endpoint,
        headers=headers,
        json=payload,
        timeout=timeout,
    )
    response.raise_for_status()
    output = _extract_common_text(response.json())
    if output:
        return output
    raise RuntimeError("Custom model endpoint returned an empty/unsupported response")


def _llm_enrichment(
    prompt: str,
    context: Dict[str, Any],
    findings: List[CopilotFinding],
    preferred_provider: Optional[str] = None,
    allow_fallback: bool = True,
) -> Tuple[Optional[str], Optional[str]]:
    status = _configured_provider_status()
    if not _configured_providers(status):
        return None, None

    timeout = _request_timeout_seconds()
    user_content = _build_user_content(prompt, context, findings)
    providers = _provider_order(status)
    requested = (preferred_provider or "").strip().lower()
    if requested and requested in LLM_PROVIDERS:
        if allow_fallback:
            providers = [requested] + [provider for provider in providers if provider != requested]
        else:
            providers = [requested] if status.get(requested) else []

    if not providers:
        return None, None

    runners: Dict[str, Callable[[str, int], str]] = {
        "openai": _openai_completion,
        "gemini": _gemini_completion,
        "anthropic": _anthropic_completion,
        "huggingface": _huggingface_completion,
        "custom": _custom_completion,
    }

    for provider in providers:
        runner = runners.get(provider)
        if not runner:
            continue
        try:
            answer = runner(user_content, timeout)
            if answer.strip():
                return answer.strip(), provider
        except Exception as exc:
            logger.warning("Copilot provider %s failed: %s", provider, exc)

    return None, None


def _build_actions(
    selected_resource: Optional[Resource],
    selected_deployment: Optional[Resource],
) -> List[CopilotAction]:
    actions: List[CopilotAction] = [
        CopilotAction(
            label="Open Cloud Accounts",
            action_type="navigate",
            description="Review and update provider credentials.",
            route="/accounts",
        ),
        CopilotAction(
            label="Trigger Resource Sync",
            action_type="api",
            description="Refresh inventory and cloud status from provider APIs.",
            method="POST",
            endpoint="/dashboard/sync/trigger",
            requires_confirmation=False,
        ),
    ]

    target = selected_resource or selected_deployment
    if target:
        actions.append(
            CopilotAction(
                label="Open Deployment Logs",
                action_type="navigate",
                description="Inspect live Terraform logs for this resource.",
                route=f"/deployments/{target.id}",
            )
        )

    if target and target.type == "vm":
        status = (target.status or "").lower()
        if status in {"stopped", "inactive"}:
            actions.append(
                CopilotAction(
                    label="Start VM",
                    action_type="api",
                    description="Send a start request for the selected VM.",
                    method="POST",
                    endpoint=f"/resources/{target.id}/vm/start",
                    requires_confirmation=True,
                )
            )
        elif status in {"active", "running", "pending", "provisioning"}:
            actions.append(
                CopilotAction(
                    label="Stop VM",
                    action_type="api",
                    description="Send a stop request for the selected VM.",
                    method="POST",
                    endpoint=f"/resources/{target.id}/vm/stop",
                    requires_confirmation=True,
                )
            )

    return actions


def _default_answer(
    findings: List[CopilotFinding],
    selected_deployment: Optional[Resource],
) -> str:
    if findings:
        top = findings[0]
        return (
            f"I found a likely issue: {top.title}. "
            f"Recommended fix: {top.recommendation}"
        )

    if selected_deployment and (selected_deployment.status or "").lower() == "failed":
        return (
            "This deployment failed, but no specific signature matched automatically. "
            "Open the deployment logs, check provider credentials, region settings, and resource naming constraints."
        )

    return (
        "I did not find a critical error signature in the current context. "
        "Use deployment logs and provider-specific checks (IAM, quota, region, naming) to narrow down the issue."
    )


@router.get("/providers")
def get_configured_copilot_providers(
    current_user: User = Depends(get_current_user),
):
    _ = current_user  # keep auth required for assistant metadata
    status = _configured_provider_status()
    configured = _configured_providers(status)
    preferred = os.getenv("AI_PROVIDER", "").strip().lower()
    priority_env = os.getenv("AI_PROVIDER_PRIORITY", "").strip()
    priority = [item.strip().lower() for item in priority_env.split(",") if item.strip()] if priority_env else []
    active = preferred if preferred in configured else (configured[0] if configured else None)

    return {
        "active_provider": active,
        "preferred_provider": preferred or None,
        "provider_priority": priority,
        "available_providers": list(LLM_PROVIDERS),
        "configured_providers": configured,
        "provider_status": status,
        "models": {
            "openai": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            "gemini": os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
            "anthropic": os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022"),
            "huggingface": os.getenv("HUGGINGFACE_MODEL", "HuggingFaceH4/zephyr-7b-beta"),
            "custom": os.getenv("CUSTOM_LLM_MODEL", "ft-cloud-copilot"),
        },
    }


@router.post("/query", response_model=CopilotResponse)
def query_copilot(
    request: CopilotRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prompt = request.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    base_query = db.query(Resource).join(Project).filter(Project.user_id == current_user.id)

    selected_deployment = None
    if request.deployment_id:
        selected_deployment = base_query.filter(Resource.id == request.deployment_id).first()

    selected_resource = None
    if request.resource_id:
        selected_resource = base_query.filter(Resource.id == request.resource_id).first()

    recent_resources = (
        base_query.order_by(Resource.created_at.desc(), Resource.id.desc()).limit(8).all()
    )

    deployment_logs = _extract_logs(selected_deployment.terraform_output) if selected_deployment else ""
    signal_text = f"{prompt}\n{deployment_logs}".strip()
    findings = _pattern_findings(signal_text)

    context = {
        "selected_deployment": {
            "id": selected_deployment.id,
            "name": selected_deployment.name,
            "provider": selected_deployment.provider,
            "type": selected_deployment.type,
            "status": selected_deployment.status,
        }
        if selected_deployment
        else None,
        "selected_resource": {
            "id": selected_resource.id,
            "name": selected_resource.name,
            "provider": selected_resource.provider,
            "type": selected_resource.type,
            "status": selected_resource.status,
        }
        if selected_resource
        else None,
        "recent_resources": [
            {
                "id": item.id,
                "name": item.name,
                "provider": item.provider,
                "type": item.type,
                "status": item.status,
            }
            for item in recent_resources
        ],
    }

    answer = _default_answer(findings, selected_deployment)
    preferred_provider = None if request.provider == "auto" else request.provider
    enriched_answer, llm_provider = _llm_enrichment(
        prompt,
        context,
        findings,
        preferred_provider=preferred_provider,
        allow_fallback=request.allow_fallback,
    )
    if enriched_answer:
        answer = enriched_answer
    context["llm_provider"] = llm_provider
    context["configured_llm_providers"] = _configured_providers()
    context["requested_llm_provider"] = request.provider
    context["llm_fallback_enabled"] = request.allow_fallback

    actions = _build_actions(selected_resource, selected_deployment)

    return CopilotResponse(
        answer=answer,
        findings=findings,
        actions=actions,
        context=context,
    )
