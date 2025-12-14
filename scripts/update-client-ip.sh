#!/bin/bash

# Script to automatically update client .env with the dynamic K8s LoadBalancer IP

# Resolve absolute paths based on the script location
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
VAGRANT_DIR="$SCRIPT_DIR/../infra/vagrant"
ENV_FILE="$SCRIPT_DIR/../client/.env"

echo -e "\033[0;36mFetching Nginx LoadBalancer IP from Kubernetes...\033[0m"

# Store current directory to return later (optional since we run in subshell or script context)
pushd "$VAGRANT_DIR" > /dev/null || { echo "Error: Could not find Vagrant directory at $VAGRANT_DIR"; exit 1; }

# Fetch IP using Vagrant SSH + Kubectl
# 2>/dev/null suppresses Vagrant's "Connection to 127.0.0.1 closed." messages
NGINX_IP=$(vagrant ssh k3s-control-plane -c "kubectl get svc nginx-service -n loadbalancer -o jsonpath='{.status.loadBalancer.ingress[0].ip}'" 2>/dev/null)

# Clean up output (trim whitespace/newlines)
NGINX_IP=$(echo "$NGINX_IP" | tr -d '[:space:]')

if [ -z "$NGINX_IP" ]; then
    echo -e "\033[0;31mError: Failed to retrieve IP. Is the cluster running?\033[0m"
    popd > /dev/null
    exit 1
fi

echo -e "\033[0;32mFound IP: $NGINX_IP\033[0m"

# Return to original directory
popd > /dev/null

# Write to .env file
echo "VITE_API_URL=http://$NGINX_IP" > "$ENV_FILE"
echo -e "\033[0;32mUpdated .env with VITE_API_URL=http://$NGINX_IP\033[0m"

