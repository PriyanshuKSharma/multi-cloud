from app.core.celery_app import celery_app
from app.services.terraform_runner import TerraformRunner
from app.db.base import SessionLocal
from app.models.resource import Resource
import os
import json

@celery_app.task
def provision_resource_task(resource_id: str, provider: str, module_name: str, variables: dict):
    db = SessionLocal()
    resource = db.query(Resource).filter(Resource.id == int(resource_id)).first()
    
    if not resource:
        db.close()
        return {"status": "failed", "error": "Resource not found"}

    try:
        # Update status to provisioning
        resource.status = "provisioning"
        db.commit()

        # 1. Create a workspace
        workspace_dir = f"/tmp/terraform_workspaces/{resource_id}"
        os.makedirs(workspace_dir, exist_ok=True)
        
        # 2. Write variables
        tfvars_path = os.path.join(workspace_dir, "terraform.tfvars.json")
        with open(tfvars_path, "w") as f:
            json.dump(variables, f)
            
        # 3. Initialize Runner
        runner = TerraformRunner(workspace_dir)
        
        # 4. Execute Terraform
        logs = ""
        
        # Init
        init_out = runner.init()
        logs += f"--- INIT ---\n{init_out}\n"
        
        if "Error" in init_out:
            resource.status = "failed"
            resource.terraform_output = {"logs": logs}
            db.commit()
            return {"status": "failed", "logs": logs}
            
        # Apply
        apply_out = runner.apply()
        logs += f"\n--- APPLY ---\n{apply_out}\n"
        
        if "Error" in apply_out:
            resource.status = "failed"
        else:
            resource.status = "active"
            
        # Save logs and simple output parsing (mocking IP for validation)
        output_data = {"logs": logs}
        # Try to parse actual outputs if successful (mocked here)
        if resource.status == "active":
             output_data["ip"] = "10.0.0.101" # Mock
        
        resource.terraform_output = output_data
        db.commit()
        
        return {"status": resource.status, "logs": logs}
        
    except Exception as e:
        resource.status = "failed"
        resource.terraform_output = {"logs": str(e)}
        db.commit()
        raise e
    finally:
        db.close()
