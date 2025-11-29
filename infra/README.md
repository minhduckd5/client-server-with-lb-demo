# Infrastructure Automation with Vagrant and Ansible for K3s

This directory contains infrastructure automation code for provisioning and configuring a K3s cluster on VMware Workstation using Vagrant and Ansible.

> **📖 For a complete workflow walkthrough from start to finish, see [WORKFLOW.md](./WORKFLOW.md)**

## Architecture Overview

- **6 VMs**: 1 control plane, 2 workers, 1 ops/GitLab runner, 1 monitoring, 1 optional LB
- **K3s**: Lightweight Kubernetes distribution (includes CNI)
- **MetalLB**: L2 mode for LoadBalancer services
- **Nginx Reverse Proxy**: LoadBalancer service exposed via MetalLB for L4 load balancing
- **Ingress**: Nginx Ingress Controller (optional, for L7 routing)
- **Monitoring**: Prometheus + Grafana + node-exporter + kube-state-metrics
- **CI/CD**: GitLab pipeline for infrastructure lifecycle

## Directory Structure

```
infra/
├── vagrant/            # Vagrant configuration for VMware Workstation
│   ├── Vagrantfile     # VM definitions and provisioning
│   └── README.md       # Vagrant usage guide
├── terraform/          # Terraform for inventory generation
│   ├── main.tf         # Main configuration
│   ├── variables.tf    # Input variables
│   └── outputs.tf     # Output values (inventory generation)
├── ansible/            # Ansible playbooks
│   ├── bootstrap.yml   # OS setup and system configuration
│   ├── k3s-install.yml # K3s installation (control plane + workers)
│   ├── metallb.yml     # MetalLB deployment
│   ├── deploy-nginx-reverse-proxy.yml # Nginx reverse proxy with MetalLB
│   ├── ingress.yml     # Ingress controller deployment
│   ├── monitoring.yml   # Monitoring stack deployment
│   ├── inventory.ini.template # Inventory template
│   ├── group_vars/     # Group-specific variables
│   └── templates/       # Ansible templates
└── README.md           # This file
```

## Prerequisites

1. **VMware Workstation**
   - VMware Workstation Pro 12 or later
   - Licensed and running

2. **Local Tools**
   - Vagrant >= 2.2.0
   - Vagrant VMware Utility plugin: `vagrant plugin install vagrant-vmware-desktop`
   - Ansible >= 2.9
   - kubectl (optional, for local access)

3. **GitLab CI Variables** (if using GitLab CI)
   - `SSH_PRIVATE_KEY`: SSH private key for VM access
   - `SSH_USER`: SSH username (default: vagrant)
   - `METALLB_IP_POOL_START`: MetalLB IP pool start (e.g., 192.168.100.240)
   - `METALLB_IP_POOL_END`: MetalLB IP pool end (e.g., 192.168.100.250)
   - `CONTROL_PLANE_IP`: Control plane VM IP (192.168.100.10)

## Setup Instructions

### 1. Install Vagrant VMware Plugin

```bash
vagrant plugin install vagrant-vmware-desktop
```

### 2. Provision VMs with Vagrant

```bash
cd infra/vagrant
vagrant up
```

This will create 6 VMs:
- `k3s-control-plane` (192.168.100.10)
- `k3s-worker-1` (192.168.100.11)
- `k3s-worker-2` (192.168.100.12)
- `k3s-ops` (192.168.100.13)
- `k3s-monitoring` (192.168.100.14)
- `k3s-lb` (192.168.100.15) - optional, set `CREATE_LB_VM=true`

### 3. Generate Ansible Inventory

After VMs are up, generate the inventory:

```bash
cd infra/terraform
terraform init
terraform output -raw ansible_inventory > ../ansible/inventory.ini
```

Or manually create `infra/ansible/inventory.ini`:

```ini
[k3s_control]
k3s-control-plane ansible_host=192.168.100.10

[k3s_workers]
k3s-worker-1 ansible_host=192.168.100.11
k3s-worker-2 ansible_host=192.168.100.12

[k3s_nodes:children]
k3s_control
k3s_workers

[ops]
k3s-ops ansible_host=192.168.100.13

[monitoring]
k3s-monitoring ansible_host=192.168.100.14

[all:vars]
ansible_user=vagrant
ansible_ssh_private_key_file=~/.vagrant.d/insecure_private_key
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
```

### 4. Configure SSH Access

Vagrant uses the insecure private key by default. For production, configure SSH keys:

```bash
# Generate SSH key if needed
ssh-keygen -t rsa -b 4096 -f ~/.ssh/k3s_cluster

# Copy public key to VMs
ssh-copy-id -i ~/.ssh/k3s_cluster.pub vagrant@192.168.100.10
```

Update inventory with your SSH key path.

### 5. Run Ansible Playbooks

Bootstrap all nodes:

```bash
cd infra/ansible
ansible-playbook -i inventory.ini bootstrap.yml
```

Install K3s:

```bash
ansible-playbook -i inventory.ini k3s-install.yml
```

Deploy MetalLB:

```bash
ansible-playbook -i inventory.ini metallb.yml \
  --extra-vars "metallb_ip_pool_start=192.168.100.240 metallb_ip_pool_end=192.168.100.250"
```

Deploy Nginx Reverse Proxy with MetalLB LoadBalancer:

```bash
ansible-playbook -i inventory.ini deploy-nginx-reverse-proxy.yml
```

This will:
- Deploy the nginx reverse proxy deployment
- Create a LoadBalancer service that MetalLB will assign an external IP to
- Configure the reverse proxy to load balance across server1, server2, and server3 services

Deploy Ingress Controller (optional, for L7 routing):

```bash
ansible-playbook -i inventory.ini ingress.yml
```

Deploy Monitoring Stack:

```bash
ansible-playbook -i inventory.ini monitoring.yml
```

### 6. Verify K3s Cluster

SSH into control plane:

```bash
vagrant ssh k3s-control-plane
# or
ssh vagrant@192.168.100.10
```

Check cluster status:

```bash
sudo k3s kubectl get nodes
sudo k3s kubectl get pods --all-namespaces
```

Copy kubeconfig for local access:

```bash
scp vagrant@192.168.100.10:/etc/rancher/k3s/k3s.yaml ~/.kube/config-k3s
# Update server URL in config: replace 127.0.0.1 with 192.168.100.10
export KUBECONFIG=~/.kube/config-k3s
kubectl get nodes
```

## GitLab CI/CD Usage

### Configure GitLab CI Variables

In your GitLab project, go to Settings > CI/CD > Variables and add:

- `SSH_PRIVATE_KEY`: SSH private key (file type, protected)
- `SSH_USER`: SSH username (default: vagrant)
- `METALLB_IP_POOL_START`: MetalLB IP pool start
- `METALLB_IP_POOL_END`: MetalLB IP pool end
- `CONTROL_PLANE_IP`: Control plane IP (192.168.100.10)

### Pipeline Stages

1. **provision**: Provisions VMs with Vagrant (manual approval required)
2. **configure**: Runs Ansible playbooks to configure K3s cluster
3. **deploy**: Deploys application manifests
4. **smoke-test**: Runs basic health checks

### Running the Pipeline

1. Push code to `main` or `develop` branch
2. Manually approve `provision` stage to create VMs
3. `configure` stage runs automatically after provision
4. `deploy` and `smoke-test` stages run automatically

**Note**: Vagrant may not be available in GitLab CI runners. The pipeline will fall back to using Terraform to generate inventory if Vagrant is not available. For full automation, consider using self-hosted runners with Vagrant installed.

## MetalLB Configuration

MetalLB is configured in L2 mode, which requires:

1. **IP Pool**: Choose a free IP range on your VM network (e.g., 192.168.100.240-250)
2. **Network Access**: Ensure ARP responses are allowed on your network
3. **No Conflicts**: Verify the IP range is not used by other devices

The IP pool is configured in:
- Ansible group_vars: `metallb_ip_pool_start` and `metallb_ip_pool_end`
- GitLab CI variables: `METALLB_IP_POOL_START` and `METALLB_IP_POOL_END`

## Nginx Reverse Proxy with MetalLB

The nginx reverse proxy is deployed as a LoadBalancer service, which MetalLB will assign an external IP to. This provides:

- **External Access**: Direct access to the reverse proxy via the assigned LoadBalancer IP
- **Load Balancing**: Nginx distributes traffic across backend services (server1, server2, server3)
- **Session Affinity**: Configured for client IP-based session persistence
- **High Availability**: Can scale the nginx reverse proxy deployment for redundancy

### Accessing the Reverse Proxy

After deployment, get the LoadBalancer IP:

```bash
kubectl get svc -n loadbalancer nginx-service
```

Or from control plane:

```bash
ssh vagrant@192.168.100.10
sudo k3s kubectl get svc -n loadbalancer nginx-service
```

Access the application via the LoadBalancer IP:

```bash
curl http://<nginx-lb-ip>/
```

### Architecture Flow

```
Internet/Client
    ↓
MetalLB LoadBalancer IP (e.g., 192.168.100.240)
    ↓
Nginx Reverse Proxy Service (LoadBalancer)
    ↓
Nginx Reverse Proxy Pods
    ↓
Backend Services (ClusterIP)
    ├── server1-service:3001
    ├── server2-service:3002
    └── server3-service:3003
    ↓
Backend Pods (server1, server2, server3)
```

## Monitoring Access

After deployment, access monitoring tools:

- **Grafana**: http://<grafana-lb-ip>:3000 (admin/admin)
- **Prometheus**: http://<prometheus-lb-ip>:9090

Get the IPs with:

```bash
kubectl get svc -n monitoring
```

Or from control plane:

```bash
ssh vagrant@192.168.100.10
sudo k3s kubectl get svc -n monitoring
```

## K3s vs Standard Kubernetes

K3s is a lightweight Kubernetes distribution that:

- **Includes CNI**: Flannel is built-in, no separate CNI installation needed
- **Single Binary**: All components in one binary
- **Lower Resource Usage**: Optimized for edge and IoT
- **SQLite Default**: Uses SQLite instead of etcd (can use external etcd)
- **Simplified**: Fewer moving parts, easier to manage

## Troubleshooting

### Vagrant Issues

- **VMware plugin not found**: Install `vagrant-vmware-desktop` plugin
- **Network conflicts**: Adjust IP addresses in Vagrantfile
- **VM won't start**: Check VMware Workstation is running and licensed

### K3s Issues

- **K3s not starting**: Check logs: `sudo journalctl -u k3s`
- **Nodes not joining**: Verify token and control plane IP are correct
- **Pods pending**: Check node resources and CNI status

### Ansible Issues

- **SSH connection failed**: Verify SSH key and network connectivity
- **Playbook fails**: Check Ansible version >= 2.9
- **Permission denied**: Ensure SSH user has sudo access

### Network Issues

- **Can't reach VMs**: Check VMware Workstation network adapter settings
- **MetalLB not assigning IPs**: Verify IP pool range and network ARP configuration

## Cleanup

To destroy all VMs:

```bash
cd infra/vagrant
vagrant destroy
```

**Warning**: This will delete all VMs and associated resources.

## Additional Resources

- [Vagrant Documentation](https://www.vagrantup.com/docs)
- [Vagrant VMware Provider](https://www.vagrantup.com/docs/providers/vmware)
- [K3s Documentation](https://docs.k3s.io/)
- [Ansible Documentation](https://docs.ansible.com/)
- [MetalLB Documentation](https://metallb.universe.tf/)

## Support

For issues or questions, please check:
1. Vagrant status: `vagrant status`
2. K3s logs: `sudo journalctl -u k3s` on control plane
3. Ansible playbook output for configuration issues
4. Kubernetes cluster logs for runtime issues
