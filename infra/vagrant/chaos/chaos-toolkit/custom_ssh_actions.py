import subprocess
import logging
from chaoslib.exceptions import ActivityFailed

def run_stress_ng(host: str, username: str, key_path: str, cmd: str):
    """
    Executes a command via SSH without requiring chaostoolkit-ssh.
    """
    ssh_command = [
        "ssh",
        "-o", "StrictHostKeyChecking=no",
        "-i", key_path,
        f"{username}@{host}",
        cmd
    ]
    
    try:
        logging.info(f"Connecting to {host} to run: {cmd}")
        result = subprocess.run(
            ssh_command,
            capture_output=True,
            text=True,
            timeout=40  # slightly longer than the stress timeout
        )
        
        if result.returncode != 0:
            logging.error(f"SSH command failed: {result.stderr}")
            raise ActivityFailed(f"SSH execution failed: {result.stderr}")
            
        logging.info(f"Output: {result.stdout}")
        return result.stdout
        
    except subprocess.TimeoutExpired:
        logging.info("Command timed out as expected (stress-ng ran)")
    except Exception as e:
        raise ActivityFailed(f"SSH operation failed: {str(e)}")


