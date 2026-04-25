import os
import shutil
import json
import logging
from celery import shared_task
from app.db.base import SessionLocal
from app.models.resource import Resource
from app.services.terraform_runner import TerraformRunner

logger = logging.getLogger(__name__)

@shared_task(name="provision_resource_task")
def provision_resource_task(resource_id: str, provider: str, module_name: str, variables: dict):
    """
    Background task to provision cloud resources using Terraform.
    """
    db = SessionLocal()
    try:
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            logger.error(f"Resource {resource_id} not found")
            return

        # Update status
        resource.status = "provisioning"
        db.commit()

        # Workspace directory for this run
        # Note: In a production environment, this should be a robust temp directory or persistent volume
        base_dir = os.path.abspath(os.path.join(os.getcwd(), "terraform_runs"))
        os.makedirs(base_dir, exist_ok=True)
        run_dir = os.path.join(base_dir, f"run_{resource_id}")

        if os.path.exists(run_dir):
            shutil.rmtree(run_dir)
        os.makedirs(run_dir)

        # Copy Terraform module files
        module_src = os.path.abspath(os.path.join(os.getcwd(), "terraform", "modules", module_name))
        if not os.path.exists(module_src):
            raise Exception(f"Terraform module {module_name} not found at {module_src}")

        for item in os.listdir(module_src):
            s = os.path.join(module_src, item)
            d = os.path.join(run_dir, item)
            if os.path.isdir(s):
                shutil.copytree(s, d)
            else:
                shutil.copy2(s, d)

        # Create terraform.tfvars.json
        with open(os.path.join(run_dir, "terraform.tfvars.json"), "w") as f:
            json.dump(variables, f)

        # Execute Terraform
        runner = TerraformRunner(run_dir)
        
        # 1. Init
        init_output = runner.init()
        logger.info(f"Terraform Init [{resource_id}]: {init_output[:200]}...")

        # 2. Apply
        apply_output = runner.apply()
        logger.info(f"Terraform Apply [{resource_id}]: {apply_output[:200]}...")

        # 3. Capture Output
        output_json_str = runner.output()
        output_data = {}
        try:
            if output_json_str and not output_json_str.strip().startswith("Error"):
                output_data = json.loads(output_json_str)
        except Exception as e:
            logger.warning(f"Failed to parse terraform output for {resource_id}: {e}")

        # Update resource record
        resource.status = "active"
        # Store stdout and parsed JSON output
        resource.terraform_output = {
            "stdout": apply_output,
            "data": output_data
        }
        
        # Extract some common fields if they exist in output
        # (Assuming the terraform modules define these outputs)
        if output_data:
            if "public_ip" in output_data:
                resource.public_ip = output_data["public_ip"].get("value")
            if "private_ip" in output_data:
                resource.private_ip = output_data["private_ip"].get("value")
            if "instance_id" in output_data:
                resource.cloud_resource_id = output_data["instance_id"].get("value")
            elif "id" in output_data:
                resource.cloud_resource_id = output_data["id"].get("value")

        logger.info(f"Successfully provisioned resource {resource_id}")

    except Exception as e:
        logger.exception(f"Error provisioning resource {resource_id}")
        if 'resource' in locals() and resource:
            resource.status = "failed"
            resource.terraform_output = {
                "error": str(e),
                "detail": "Failed during background execution. Check worker logs."
            }
    finally:
        db.add(resource)
        db.commit()
        db.close()
