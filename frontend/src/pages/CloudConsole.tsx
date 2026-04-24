import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import { normalizeLogText } from '../utils/terraformOutput';
import PageHero from '../components/ui/PageHero';
import ProviderIcon from '../components/ui/ProviderIcon';
import StatusBadge from '../components/ui/StatusBadge';
import {
  Terminal,
  RefreshCw,
  Server,
  HardDrive,
  Network,
  Layers3,
  ExternalLink,
  Bot,
  SendHorizontal,
  Wand2,
  Loader2,
  X,
} from 'lucide-react';

interface Deployment {
  id: number;
  resource_id: number;
  resource_name: string;
  provider: string;
  resource_type: string;
  status: string;
  project_id: number;
  started_at: string;
  completed_at?: string | null;
  duration_seconds?: number | null;
  has_logs: boolean;
  log_line_count: number;
}

interface DeploymentDetail extends Deployment {
  logs: string;
  configuration: Record<string, unknown>;
  terraform_output: Record<string, unknown>;
}

interface ResourceRecord {
  id: number;
  name: string;
  provider: string;
  type: string;
  status: string;
  project_id: number;
  created_at: string;
}

interface CopilotFinding {
  severity: 'info' | 'warning' | 'error';
  title: string;
  evidence?: string | null;
  recommendation: string;
}

interface CopilotAction {
  label: string;
  action_type: 'navigate' | 'api';
  description: string;
  route?: string | null;
  method?: string | null;
  endpoint?: string | null;
  body?: Record<string, unknown> | null;
  requires_confirmation?: boolean;
}

interface CopilotResponse {
  answer: string;
  findings: CopilotFinding[];
  actions: CopilotAction[];
}

type CopilotProvider = 'auto' | 'openai' | 'gemini' | 'anthropic' | 'huggingface' | 'custom';

interface CopilotProvidersResponse {
  active_provider: string | null;
  preferred_provider: string | null;
  provider_priority: string[];
  available_providers: string[];
  configured_providers: string[];
  provider_status: Record<string, boolean>;
  models: Record<string, string>;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  text: string;
  response?: CopilotResponse;
}

const asItemsArray = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const items = (payload as { items?: unknown[] }).items;
    if (Array.isArray(items)) return items;
  }
  return [];
};

const normalizeDeployment = (item: unknown): Deployment => {
  const value = (item ?? {}) as Record<string, unknown>;
  return {
    id: Number(value.id ?? 0),
    resource_id: Number(value.resource_id ?? value.id ?? 0),
    resource_name: String(value.resource_name ?? 'Unnamed resource'),
    provider: String(value.provider ?? '').toLowerCase(),
    resource_type: String(value.resource_type ?? 'resource'),
    status: String(value.status ?? 'pending').toLowerCase(),
    project_id: Number(value.project_id ?? 0),
    started_at: String(value.started_at ?? ''),
    completed_at: value.completed_at ? String(value.completed_at) : null,
    duration_seconds:
      typeof value.duration_seconds === 'number'
        ? value.duration_seconds
        : value.duration_seconds
          ? Number(value.duration_seconds)
          : null,
    has_logs: Boolean(value.has_logs),
    log_line_count: Number(value.log_line_count ?? 0),
  };
};

const normalizeDeploymentDetail = (item: unknown): DeploymentDetail => {
  const base = normalizeDeployment(item);
  const value = (item ?? {}) as Record<string, unknown>;
  const asObject = (data: unknown): Record<string, unknown> =>
    data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};

  return {
    ...base,
    logs: typeof value.logs === 'string' ? value.logs : '',
    configuration: asObject(value.configuration),
    terraform_output: asObject(value.terraform_output),
  };
};

const normalizeResource = (item: unknown): ResourceRecord => {
  const value = (item ?? {}) as Record<string, unknown>;
  return {
    id: Number(value.id ?? 0),
    name: String(value.name ?? 'Unnamed resource'),
    provider: String(value.provider ?? '').toLowerCase(),
    type: String(value.type ?? 'resource').toLowerCase(),
    status: String(value.status ?? 'pending').toLowerCase(),
    project_id: Number(value.project_id ?? 0),
    created_at: String(value.created_at ?? ''),
  };
};

const QUICK_PROMPTS = [
  'Why did my latest deployment fail?',
  'How can I fix credential issues quickly?',
  'What should I check before creating a VM?',
  'Suggest next steps for the selected logs.',
];

const PROVIDER_CHOICES = ['openai', 'gemini', 'anthropic', 'huggingface', 'custom'] as const;

const formatProviderLabel = (provider: string) =>
  provider === 'huggingface'
    ? 'Hugging Face'
    : provider === 'custom'
      ? 'Custom (Fine-tuned)'
      : provider.charAt(0).toUpperCase() + provider.slice(1);

const buildMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getErrorDetail = (error: unknown): string => {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
  ) {
    const detail = (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
  }
  return 'Request failed';
};

const CloudConsole: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDeploymentId, setSelectedDeploymentId] = React.useState<number | null>(null);
  const [isCopilotPanelOpen, setIsCopilotPanelOpen] = React.useState(true);
  const [copilotInput, setCopilotInput] = React.useState('');
  const [isCopilotLoading, setIsCopilotLoading] = React.useState(false);
  const [providerPreference, setProviderPreference] = React.useState<CopilotProvider>('auto');
  const [allowFallback, setAllowFallback] = React.useState(true);
  const [providerMeta, setProviderMeta] = React.useState<CopilotProvidersResponse | null>(null);
  const [copilotMessages, setCopilotMessages] = React.useState<ChatMessage[]>([
    {
      id: buildMessageId(),
      role: 'assistant',
      text: 'Cloud Copilot is ready. Ask me to debug failures, explain logs, or suggest safe next actions.',
    },
  ]);
  const copilotFeedRef = React.useRef<HTMLDivElement | null>(null);

  const {
    data: deployments,
    isLoading: deploymentsLoading,
    isError: deploymentsError,
    refetch: refetchDeployments,
  } = useQuery<Deployment[]>({
    queryKey: ['deployments', 'console'],
    queryFn: async () => {
      const response = await axios.get('/deployments/');
      return asItemsArray(response.data).map(normalizeDeployment);
    },
    refetchInterval: 5000,
  });

  const {
    data: resources,
    isLoading: resourcesLoading,
    isError: resourcesError,
    refetch: refetchResources,
  } = useQuery<ResourceRecord[]>({
    queryKey: ['resources', 'console'],
    queryFn: async () => {
      const response = await axios.get('/resources/?limit=500');
      return asItemsArray(response.data)
        .map(normalizeResource)
        .sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0));
    },
    refetchInterval: 7000,
  });

  const {
    data: deploymentDetail,
    isLoading: detailLoading,
    refetch: refetchDetail,
  } = useQuery<DeploymentDetail>({
    queryKey: ['deployments', 'detail', selectedDeploymentId, 'console'],
    enabled: selectedDeploymentId !== null,
    queryFn: async () => {
      if (selectedDeploymentId === null) {
        throw new Error('No deployment selected');
      }
      const response = await axios.get(`/deployments/${selectedDeploymentId}`);
      return normalizeDeploymentDetail(response.data);
    },
    refetchInterval: 4000,
  });

  React.useEffect(() => {
    if (!deployments || deployments.length === 0) return;
    if (!selectedDeploymentId || !deployments.some((item) => item.id === selectedDeploymentId)) {
      setSelectedDeploymentId(deployments[0].id);
    }
  }, [deployments, selectedDeploymentId]);

  React.useEffect(() => {
    let mounted = true;

    const loadProviders = async () => {
      try {
        const response = await axios.get<CopilotProvidersResponse>('/assistant/providers');
        if (mounted) {
          setProviderMeta(response.data);
        }
      } catch {
        if (mounted) {
          setProviderMeta(null);
        }
      }
    };

    void loadProviders();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshAll = () => {
    void refetchDeployments();
    void refetchResources();
    if (selectedDeploymentId !== null) {
      void refetchDetail();
    }
  };

  const appendMessage = React.useCallback((message: ChatMessage) => {
    setCopilotMessages((previous) => [...previous, message]);
  }, []);

  const askCopilot = React.useCallback(
    async (promptText: string) => {
      const prompt = promptText.trim();
      if (!prompt || isCopilotLoading) return;

      appendMessage({
        id: buildMessageId(),
        role: 'user',
        text: prompt,
      });
      setCopilotInput('');
      setIsCopilotLoading(true);

      try {
        const response = await axios.post<CopilotResponse>('/assistant/query', {
          prompt,
          deployment_id: selectedDeploymentId,
          resource_id: deploymentDetail?.resource_id ?? selectedDeploymentId,
          provider: providerPreference,
          allow_fallback: allowFallback,
        });
        appendMessage({
          id: buildMessageId(),
          role: 'assistant',
          text: response.data.answer,
          response: response.data,
        });
      } catch (error) {
        appendMessage({
          id: buildMessageId(),
          role: 'system',
          text: `Copilot request failed: ${getErrorDetail(error)}`,
        });
      } finally {
        setIsCopilotLoading(false);
      }
    },
    [allowFallback, appendMessage, deploymentDetail?.resource_id, isCopilotLoading, providerPreference, selectedDeploymentId]
  );

  const runCopilotAction = React.useCallback(
    async (action: CopilotAction) => {
      if (action.requires_confirmation) {
        const accepted = window.confirm(`Run action: ${action.label}?`);
        if (!accepted) return;
      }

      if (action.action_type === 'navigate' && action.route) {
        navigate(action.route);
        return;
      }

      if (action.action_type === 'api' && action.endpoint && action.method) {
        try {
          await axios.request({
            method: action.method,
            url: action.endpoint,
            data: action.body ?? undefined,
          });
          appendMessage({
            id: buildMessageId(),
            role: 'system',
            text: `Action succeeded: ${action.label}`,
          });
          void refetchDeployments();
          void refetchResources();
          if (selectedDeploymentId !== null) {
            void refetchDetail();
          }
          return;
        } catch (error) {
          appendMessage({
            id: buildMessageId(),
            role: 'system',
            text: `Action failed (${action.label}): ${getErrorDetail(error)}`,
          });
          return;
        }
      }

      appendMessage({
        id: buildMessageId(),
        role: 'system',
        text: `Action is not configured correctly: ${action.label}`,
      });
    },
    [appendMessage, navigate, refetchDeployments, refetchResources, refetchDetail, selectedDeploymentId]
  );

  const terminalCommand = (deployment: Deployment) =>
    `cloudorch provision --provider ${deployment.provider} --type ${deployment.resource_type} --name "${deployment.resource_name}" --project ${deployment.project_id}`;
  const formattedDetailLogs = React.useMemo(
    () => normalizeLogText(deploymentDetail?.logs ?? ''),
    [deploymentDetail?.logs]
  );

  const resourcesCount = resources?.length ?? 0;
  const vmCount = resources?.filter((item) => item.type === 'vm').length ?? 0;
  const storageCount = resources?.filter((item) => item.type === 'storage').length ?? 0;
  const networkCount =
    resources?.filter((item) => ['network', 'vpc', 'resource_group'].includes(item.type)).length ?? 0;
  const faasCount =
    resources?.filter((item) => ['faas', 'function', 'lambda'].includes(item.type)).length ?? 0;
  const providerOptions =
    providerMeta?.available_providers?.length
      ? providerMeta.available_providers
      : [...PROVIDER_CHOICES];
  const configuredProviders = providerMeta?.configured_providers ?? [];

  React.useEffect(() => {
    if (!copilotFeedRef.current) return;
    copilotFeedRef.current.scrollTop = copilotFeedRef.current.scrollHeight;
  }, [copilotMessages, isCopilotLoading]);

  return (
    <div className={`p-8 space-y-6 transition-[padding] duration-300 ${isCopilotPanelOpen ? 'lg:pr-[27rem]' : ''}`}>
      <PageHero
        id="cloud-console"
        tone="cyan"
        eyebrow="Live provisioning console"
        eyebrowIcon={<Terminal className="h-3.5 w-3.5" />}
        title="Cloud Console"
        titleIcon={<Terminal className="w-8 h-8 text-cyan-300" />}
        description="Live command-style view of provisioning jobs, logs, and created resource records."
        chips={[
          { label: `${deployments?.length ?? 0} deployments`, tone: 'cyan' },
          { label: `${resourcesCount} resources`, tone: 'blue' },
        ]}
        guide={{
          title: 'About Cloud Console',
          purpose: 'Cloud Console streams real provisioning jobs and resource records from the backend in a terminal-style interface.',
          actions: [
            'watch command history for each deployment',
            'open live logs from Terraform/orchestration output',
            'verify resources created across providers in real time',
          ],
        }}
        actions={
          <>
            <button
              onClick={refreshAll}
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/20 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${(deploymentsLoading || resourcesLoading) ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            <button
              onClick={() => setIsCopilotPanelOpen((value) => !value)}
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/20 transition-all"
            >
              <Bot className="w-4 h-4" />
              <span className="text-sm font-medium">{isCopilotPanelOpen ? 'Hide Copilot' : 'Open Copilot'}</span>
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Resources</p>
          <p className="text-2xl font-semibold text-white mt-1">{resourcesCount}</p>
        </div>
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Virtual Machines</p>
            <p className="text-xl font-semibold text-white mt-1">{vmCount}</p>
          </div>
          <Server className="w-5 h-5 text-blue-400" />
        </div>
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Storage</p>
            <p className="text-xl font-semibold text-white mt-1">{storageCount}</p>
          </div>
          <HardDrive className="w-5 h-5 text-purple-400" />
        </div>
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Networks</p>
            <p className="text-xl font-semibold text-white mt-1">{networkCount}</p>
          </div>
          <Network className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Functions</p>
            <p className="text-xl font-semibold text-white mt-1">{faasCount}</p>
          </div>
          <Layers3 className="w-5 h-5 text-amber-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 bg-[#0f0f11] border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800/50 bg-[#111319] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-gray-400 font-mono">command-history.terminal</span>
            </div>
            <Link
              to="/deployments"
              className="cursor-pointer text-xs text-cyan-300 hover:text-cyan-200 inline-flex items-center space-x-1"
            >
              <span>Open Deployments</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-3 max-h-[28rem] overflow-auto space-y-2 bg-[#0b0d12]">
            {deploymentsError ? (
              <p className="text-sm text-red-400 font-mono">Failed to load deployment commands.</p>
            ) : (deployments ?? []).length === 0 ? (
              <p className="text-sm text-gray-500 font-mono">No deployment commands yet. Create a resource to start.</p>
            ) : (
              (deployments ?? []).map((deployment) => (
                <button
                  key={deployment.id}
                  onClick={() => setSelectedDeploymentId(deployment.id)}
                  className={`cursor-pointer w-full text-left rounded-lg border p-3 transition-colors ${
                    selectedDeploymentId === deployment.id
                      ? 'border-cyan-500/40 bg-cyan-500/10'
                      : 'border-gray-800/60 hover:border-gray-700/80 hover:bg-gray-900/60'
                  }`}
                >
                  <p className="font-mono text-xs text-gray-500 mb-1">
                    [{deployment.started_at ? new Date(deployment.started_at).toLocaleTimeString() : '--:--:--'}]
                  </p>
                  <p className="font-mono text-sm text-cyan-300 break-all">
                    $ {terminalCommand(deployment)}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <StatusBadge status={deployment.status as any} size="sm" />
                    <span className="text-[11px] text-gray-500 font-mono">
                      {deployment.has_logs ? `${deployment.log_line_count} log lines` : 'no logs yet'}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="xl:col-span-3 bg-[#0f0f11] border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800/50 bg-[#111319] flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-3 text-xs text-gray-400 font-mono">
              {deploymentDetail ? `deployment-${deploymentDetail.id}.log` : 'live-output.log'}
            </span>
          </div>

          <div className="p-4 bg-[#0b0d12] font-mono text-sm text-green-200 max-h-[28rem] overflow-auto">
            {detailLoading ? (
              <p className="text-gray-500">Loading live output...</p>
            ) : deploymentDetail ? (
              <div className="space-y-3">
                <div className="text-gray-400">
                  <span className="text-cyan-300">$ deployment inspect --id {deploymentDetail.id}</span>
                  <div className="mt-2 flex items-center space-x-3">
                    <ProviderIcon provider={deploymentDetail.provider as any} size="sm" />
                    <span>{deploymentDetail.resource_name}</span>
                    <StatusBadge status={deploymentDetail.status as any} size="sm" />
                  </div>
                </div>
                <pre className="whitespace-pre-wrap break-all">
                  {formattedDetailLogs || 'No logs available yet. Provisioning output will appear here when available.'}
                </pre>
              </div>
            ) : (
              <p className="text-gray-500">Select a command on the left to see live output.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800/50 bg-[#111319] flex items-center space-x-2">
          <Layers3 className="w-4 h-4 text-cyan-300" />
          <span className="text-sm font-semibold text-white">Created Resources</span>
          <span className="text-xs text-gray-500">/resources API</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#111319] text-gray-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Provider</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
                <th className="text-left px-4 py-3 font-medium">Logs</th>
              </tr>
            </thead>
            <tbody>
              {resourcesError ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-red-400">
                    Failed to load resources
                  </td>
                </tr>
              ) : (resources ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No resources created yet
                  </td>
                </tr>
              ) : (
                (resources ?? []).slice(0, 50).map((resource) => (
                  <tr key={resource.id} className="border-t border-gray-800/50 hover:bg-gray-900/40 transition-colors">
                    <td className="px-4 py-3 text-gray-200">{resource.name}</td>
                    <td className="px-4 py-3">
                      <ProviderIcon provider={resource.provider as any} size="sm" showLabel />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                        resource.type === 'vm' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                        : resource.type === 'storage' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                        : resource.type === 'network' || resource.type === 'vpc' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                        : resource.type === 'faas' || resource.type === 'function' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                        : resource.type === 'sqs' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
                        : resource.type === 'sns' ? 'bg-pink-500/15 text-pink-300 border border-pink-500/20'
                        : 'bg-gray-500/15 text-gray-300 border border-gray-500/20'
                      }`}>
                        {resource.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={resource.status as any} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {resource.created_at ? new Date(resource.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/deployments/${resource.id}`}
                        className="cursor-pointer text-cyan-300 hover:text-cyan-200 text-xs inline-flex items-center space-x-1"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isCopilotPanelOpen && (
        <button
          onClick={() => setIsCopilotPanelOpen(true)}
          className="copilot-fab cursor-pointer fixed bottom-6 right-6 z-[70] inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
        >
          <Bot className="h-4 w-4" />
          <span>Open Copilot</span>
        </button>
      )}

      {isCopilotPanelOpen && (
        <div className="fixed inset-0 z-[70] pointer-events-none">
          <button
            type="button"
            aria-label="Close Copilot"
            onClick={() => setIsCopilotPanelOpen(false)}
            className="absolute inset-0 bg-black/55 lg:hidden pointer-events-auto"
          />

          <aside
            className="copilot-shell pointer-events-auto absolute right-0 top-0 flex h-full w-full max-w-[430px] flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="copilot-header px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-300" />
                <span className="text-sm font-semibold topbar-heading">Cloud Copilot</span>
              </div>
              <button
                onClick={() => setIsCopilotPanelOpen(false)}
                className="copilot-close-btn cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-md"
                title="Close copilot"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="copilot-context-bar px-4 py-2">
              {selectedDeploymentId ? (
                <p className="copilot-context-text text-xs">Context: deployment #{selectedDeploymentId}</p>
              ) : (
                <p className="copilot-context-empty text-xs">No deployment selected. Copilot will use general context.</p>
              )}
            </div>

            <div ref={copilotFeedRef} className="copilot-feed flex-1 overflow-auto p-4 space-y-3">
              {copilotMessages.map((message) => (
                <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={`copilot-msg max-w-[95%] px-3 py-2 ${
                      message.role === 'user'
                        ? 'copilot-msg-user'
                        : message.role === 'assistant'
                          ? 'copilot-msg-assistant'
                          : 'copilot-msg-system'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>

                    {message.response?.findings && message.response.findings.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="copilot-section-label text-[11px] uppercase tracking-wide">Findings</p>
                        {message.response.findings.map((finding, index) => (
                          <div key={`${message.id}-finding-${index}`} className="copilot-finding rounded-lg p-2">
                            <p
                              className={`text-xs font-semibold ${
                                finding.severity === 'error'
                                  ? 'text-red-300'
                                  : finding.severity === 'warning'
                                    ? 'text-yellow-300'
                                    : 'text-cyan-300'
                              }`}
                            >
                              {finding.title}
                            </p>
                            <p className="copilot-finding-text mt-1 text-xs">{finding.recommendation}</p>
                            {finding.evidence && (
                              <p className="copilot-evidence mt-1 text-[11px] font-mono">{finding.evidence}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {message.response?.actions && message.response.actions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="copilot-section-label text-[11px] uppercase tracking-wide">Suggested Actions</p>
                        <div className="flex flex-wrap gap-2">
                          {message.response.actions.map((action, index) => (
                            <button
                              key={`${message.id}-action-${index}`}
                              onClick={() => {
                                void runCopilotAction(action);
                              }}
                              className="copilot-action-btn cursor-pointer inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs"
                              title={action.description}
                            >
                              <Wand2 className="h-3 w-3" />
                              <span>{action.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isCopilotLoading && (
                <div className="flex justify-start">
                  <div className="copilot-loader rounded-xl px-3 py-2 text-sm inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
                    <span>Analyzing logs and context...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="copilot-footer px-4 py-3 space-y-3">
              <div className="copilot-provider-card rounded-lg p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="console-copilot-provider" className="copilot-field-label text-[11px] uppercase tracking-wide">
                    AI Provider
                  </label>
                  <select
                    id="console-copilot-provider"
                    value={providerPreference}
                    onChange={(event) => setProviderPreference(event.target.value as CopilotProvider)}
                    className="copilot-select rounded-md px-2 py-1 text-xs"
                  >
                    <option value="auto">Auto</option>
                    {providerOptions.map((provider) => (
                      <option key={provider} value={provider}>
                        {formatProviderLabel(provider)}
                        {providerMeta && !providerMeta.provider_status?.[provider] ? ' (not configured)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="inline-flex items-center gap-2 text-xs topbar-meta">
                  <input
                    type="checkbox"
                    checked={allowFallback}
                    onChange={(event) => setAllowFallback(event.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-600 bg-gray-900 text-blue-400 focus:ring-blue-500/40"
                  />
                  <span>Allow fallback if selected provider fails</span>
                </label>

                <p className="copilot-meta text-[11px]">
                  Configured providers: {configuredProviders.length > 0 ? configuredProviders.map(formatProviderLabel).join(', ') : 'none'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      void askCopilot(prompt);
                    }}
                    className="copilot-quick-btn cursor-pointer rounded-lg px-2.5 py-1.5 text-xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void askCopilot(copilotInput);
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={copilotInput}
                  onChange={(event) => setCopilotInput(event.target.value)}
                  placeholder="Ask Copilot to debug issues..."
                  className="copilot-input flex-1 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={isCopilotLoading || !copilotInput.trim()}
                  className="copilot-send-btn cursor-pointer inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <SendHorizontal className="h-4 w-4" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default CloudConsole;
