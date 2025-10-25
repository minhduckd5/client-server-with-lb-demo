# This script uses a numerical range and pipes it to a loop.
1..100 | ForEach-Object {
    # Execute the curl command
    curl http://localhost:9000/
    
    # Write-Host "" outputs a newline, equivalent to the original intent.
    Write-Host ""
    
    # Alternative using PowerShell's native web client:
    # Invoke-WebRequest -Uri http://localhost:8080/
}