import subprocess
import os
from typing import Dict, Any

class TerraformRunner:
    def __init__(self, working_dir: str):
        self.working_dir = working_dir

    def run_command(self, command: str) -> str:
        """Runs a shell command in the working directory."""
        try:
            result = subprocess.run(
                command,
                cwd=self.working_dir,
                shell=True,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            return result.stdout
        except subprocess.CalledProcessError as e:
            return f"Error: {e.stderr}"

    def init(self):
        return self.run_command("terraform init")

    def plan(self):
        return self.run_command("terraform plan -out=tfplan")

    def apply(self):
        return self.run_command("terraform apply -auto-approve tfplan")

    def destroy(self):
        return self.run_command("terraform destroy -auto-approve")
