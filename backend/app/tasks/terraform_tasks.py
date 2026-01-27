from app.core.celery_app import celery_app
from app.services.terraform_runner import TerraformRunner
from app.db.base import SessionLocal
from app.models.resource import Resource
import os
import json

@celery_app.task
def provision_resource_task(resource_id: str, provider: str, module_name: str, variables: dict):
    print(f"--- [DEBUG] Starting Task: {resource_id} {provider} {module_name} ---")
    logs = ""
    # For debugging key consensus (safe)
    sk = os.getenv("SECRET_KEY", "MISSING")
    logs += f"[Debug] Using SECRET_KEY starting with: {sk[:4]}...\n"
    db = SessionLocal()
    resource = db.query(Resource).filter(Resource.id == int(resource_id)).first()
    
    if not resource:
        print("--- [DEBUG] Resource not found! ---")
        db.close()
        return {"status": "failed", "error": "Resource not found"}

    try:
        # Update status to provisioning
        resource.status = "provisioning"
        db.commit()

        # 1. Create a workspace
        # Use a cross-platform temp directory or a dedicated local folder
        import tempfile
        base_work_dir = os.path.join(tempfile.gettempdir(), "nebula_terraform")
        workspace_dir = os.path.join(base_work_dir, str(resource_id))
        os.makedirs(workspace_dir, exist_ok=True)
        
        # --- COPY MODULE FILES ---
        import shutil
        # Assuming we are running from 'backend' dir or similar locally
        # Use flexible path finding
        current_dir = os.getcwd()
        # Look for terraform/modules relative to current_dir
        # Standard structure: d:\SEM-8\multi-cloud\backend (cwd) -> d:\SEM-8\multi-cloud\terraform
        possible_paths = [
            os.path.join(current_dir, "..", "terraform", "modules", module_name),
            os.path.join(current_dir, "terraform", "modules", module_name),
            f"/app/terraform/modules/{module_name}" # Docker fallback
        ]
        
        module_source = None
        for p in possible_paths:
            if os.path.exists(p):
                module_source = p
                break
                
        if module_source:
             # Copy all files from module directory to workspace
             for item in os.listdir(module_source):
                s = os.path.join(module_source, item)
                d = os.path.join(workspace_dir, item)
                if os.path.isfile(s):
                    shutil.copy2(s, d)
                elif os.path.isdir(s):
                    shutil.copytree(s, d, dirs_exist_ok=True)
        else:
             logs += f"[Error] Module not found. Searched in: {possible_paths}\n"
             resource.status = "failed"
             resource.terraform_output = {"logs": logs}
             db.commit()
             return {"status": "failed", "logs": logs}

        # 2. Write variables
        tfvars_path = os.path.join(workspace_dir, "terraform.tfvars.json")
        with open(tfvars_path, "w") as f:
            json.dump(variables, f)
            
        # 3. Initialize Runner
        runner = TerraformRunner(workspace_dir)
        
        # --- Credential Injection ---
        from app.models.credential import CloudCredential
        from app.core.security import decrypt_data
        
        env_vars = {}
        
        # Find the LATEST credential for this user & provider
        cred = db.query(CloudCredential).filter(
            CloudCredential.user_id == resource.project.user_id,
            CloudCredential.provider == provider
        ).order_by(CloudCredential.id.desc()).first()

        if cred:
             try:
                decrypted_json = decrypt_data(cred.encrypted_data)
                cred_data = json.loads(decrypted_json)
                
                if provider == "aws":
                    env_vars["AWS_ACCESS_KEY_ID"] = cred_data.get("access_key")
                    env_vars["AWS_SECRET_ACCESS_KEY"] = cred_data.get("secret_key")
                    env_vars["AWS_DEFAULT_REGION"] = cred_data.get("region", "us-east-1")
                elif provider == "azure":
                    env_vars["ARM_CLIENT_ID"] = cred_data.get("client_id")
                    env_vars["ARM_CLIENT_SECRET"] = cred_data.get("client_secret")
                    env_vars["ARM_SUBSCRIPTION_ID"] = cred_data.get("subscription_id")
                    env_vars["ARM_TENANT_ID"] = cred_data.get("tenant_id")
                # Add GCP handling here...
                
                # Verify we actually got the essential keys
                if provider == "aws" and not env_vars.get("AWS_ACCESS_KEY_ID"):
                     raise ValueError("AWS Access Key missing in decrypted data")
                     
             except Exception as e:
                 import traceback
                 logs += f"\n[Error] Failed to decrypt credentials: {type(e).__name__}: {str(e)}\n"
                 # logs += f"{traceback.format_exc()}\n" # Uncomment for deep debug
                 resource.status = "failed"
                 resource.terraform_output = {"logs": logs}
                 db.commit()
                 return {"status": "failed", "logs": logs}
        else:
             logs += f"\n[Error] No credentials found for {provider}. Cannot proceed.\n"
             resource.status = "failed"
             resource.terraform_output = {"logs": logs}
             db.commit()
             return {"status": "failed", "logs": logs}

        # 4. Execute Terraform
        
        # Init
        init_out = runner.init(env_vars)
        logs += f"--- INIT ---\n{init_out}\n"
        
        if "Error" in init_out:
            resource.status = "failed"
            resource.terraform_output = {"logs": logs}
            db.commit()
            return {"status": "failed", "logs": logs}
            
        # Plan
        plan_out = runner.plan(env_vars)
        logs += f"\n--- PLAN ---\n{plan_out}\n"
        
        if "Error" in plan_out:
            resource.status = "failed"
            resource.terraform_output = {"logs": logs}
            db.commit()
            return {"status": "failed", "logs": logs}

        # Apply
        apply_out = runner.apply(env_vars)
        logs += f"\n--- APPLY ---\n{apply_out}\n"
        
        if "Error" in apply_out:
            resource.status = "failed"
        else:
            resource.status = "active"
            
        # Save logs and simple output parsing
        output_data = {"logs": logs}
        
        # Try to parse actual outputs if successful (mocked here)
        if resource.status == "active":
             # In a real app, we would use `terraform output -json` here
             # output_data["ip"] = runner.output(env_vars)...
             pass
        
        resource.terraform_output = output_data
        db.commit()
        
        return {"status": resource.status, "logs": logs}
        
    except Exception as e:
        print(f"--- [DEBUG] EXCEPTION: {e} ---")
        resource.status = "failed"
        resource.terraform_output = {"logs": str(e)}
        db.commit()
        raise e
    finally:
        db.close()
