from app.core.celery_app import celery_app
from app.services.terraform_runner import TerraformRunner
import os
import json

@celery_app.task
def provision_resource_task(resource_id: str, provider: str, module_name: str, variables: dict):
    # In a real scenario, we'd fetch the resource from DB to get more context
    # and update its status. For MVP, we'll simulate the flow.
    
    # 1. Create a workspace for this job
    workspace_dir = f"/tmp/terraform_workspaces/{resource_id}"
    os.makedirs(workspace_dir, exist_ok=True)
    
    # 2. Write variables to tfvars file
    tfvars_path = os.path.join(workspace_dir, "terraform.tfvars.json")
    with open(tfvars_path, "w") as f:
        json.dump(variables, f)
        
    # 3. Mount/Copy module (Mocking this step: normally would copy from /terraform/modules)
    # For now, we assume the runner has access to mount points
    
    runner = TerraformRunner(workspace_dir)
    
    # 4. Execute Terraform
    init_out = runner.init()
    if "Error" in init_out:
        return {"status": "failed", "logs": init_out}
        
    apply_out = runner.apply()
    if "Error" in apply_out:
        return {"status": "failed", "logs": apply_out}
        
    return {"status": "success", "logs": apply_out}
