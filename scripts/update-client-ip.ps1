
# Script to automatically update client .env with the dynamic K8s LoadBalancer IP
$VagrantPath = "..\infra\vagrant"
$EnvFile = "..\client\.env"

Write-Host "Fetching Nginx LoadBalancer IP from Kubernetes..." -ForegroundColor Cyan

# Push-Location to ensure we are in the right directory for Vagrant
Push-Location $VagrantPath

try {
    # Fetch IP using Vagrant SSH + Kubectl
    # We use -c to run the command and trim any whitespace
    $NginxIP = vagrant ssh k3s-control-plane -c "kubectl get svc nginx-service -n loadbalancer -o jsonpath='{.status.loadBalancer.ingress[0].ip}'" 2>$null

    # Clean up the output (remove \r\n, spaces)
    $NginxIP = $NginxIP.Trim()

    if ([string]::IsNullOrWhiteSpace($NginxIP)) {
        Write-Error "Failed to retrieve IP. Is the cluster running?"
        exit 1
    }

    Write-Host "Found IP: $NginxIP" -ForegroundColor Green

    # Construct the new .env content
    $NewEnvContent = "VITE_API_URL=http://$NginxIP"

    # Go back to original location
    Pop-Location

    # Write to .env file
    Set-Content -Path $EnvFile -Value $NewEnvContent -Force
    Write-Host "Updated $EnvFile with VITE_API_URL=http://$NginxIP" -ForegroundColor Green

} catch {
    Write-Error "An error occurred: $_"
    Pop-Location
    exit 1
}

