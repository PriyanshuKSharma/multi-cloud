import subprocess
import os
from typing import Dict, Any

class TerraformRunner:
    def __init__(self, working_dir: str):
        self.working_dir = working_dir

    def run_command(self, command: str, env_vars: Dict[str, str] = None) -> str:
        """Runs a shell command in the working directory."""
        
        # Merge system env with custom env_vars
        env = os.environ.copy()
        if env_vars:
            env.update(env_vars)

        try:
            result = subprocess.run(
                command,
                cwd=self.working_dir,
                shell=True,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                env=env # Pass the merged environment
            )
            return result.stdout
        except subprocess.CalledProcessError as e:
            return f"Error: {e.stderr}"

    def init(self, env_vars: Dict[str, str] = None):
        return self.run_command("terraform init", env_vars)

    def plan(self, env_vars: Dict[str, str] = None):
        return self.run_command("terraform plan -out=tfplan", env_vars)

    def apply(self, env_vars: Dict[str, str] = None):
        # Prefer applying with the plan file if it exists, otherwise do a direct auto-approve apply
        if os.path.exists(os.path.join(self.working_dir, "tfplan")):
            return self.run_command("terraform apply -auto-approve tfplan", env_vars)
        return self.run_command("terraform apply -auto-approve", env_vars)

    def destroy(self, env_vars: Dict[str, str] = None):
        return self.run_command("terraform destroy -auto-approve", env_vars)
