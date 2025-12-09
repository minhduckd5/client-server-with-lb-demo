# Complete Architecture Workflow

This document describes the complete workflow of the infrastructure automation from start to finish.

## Overview

The architecture uses **Vagrant** for VM provisioning on **VMware Workstation**, **Terraform** for inventory generation, **Ansible** for configuration management, **K3s** for Kubernetes orchestration, and **MetalLB** with **Nginx Reverse Proxy** for load balancing.

## Workflow Stages

### Stage 1: Infrastructure Provisioning

#### 1.1 Prerequisites Setup
```
Developer/CI System
    ↓
- Install VMware Workstation Pro
- Install Vagrant
- Install Vagrant VMware plugin: `vagrant plugin install vagrant-vmware-desktop`
- Install WSL (Windows Subsystem for Linux)
- Install Ansible (inside WSL)
- Install Terraform (optional, for inventory generation, inside WSL)
```

#### 1.2 VM Provisioning with Vagrant
```bash
# From a PowerShell or CMD terminal on your Windows host
cd infra/vagrant
vagrant up

# To include the optional load balancer, set the environment variable.
# For PowerShell: $env:CREATE_LB_VM="true"; vagrant up
# For CMD: set CREATE_LB_VM="true" && vagrant up
```

**What happens:**
1. Vagrant reads `Vagrantfile` configuration
2. Creates up to 6 VMs on VMware Workstation:
   - `k3s-control-plane` (192.168.1.200) - 2 vCPU, 4GB RAM
   - `k3s-worker-1` (192.168.1.201) - 2 vCPU, 4GB RAM
   - `k3s-worker-2` (192.168.1.202) - 2 vCPU, 4GB RAM
   - `k3s-ops` (192.168.1.203) - 2 vCPU, 4GB RAM
   - `k3s-monitoring` (192.168.1.204) - 2 vCPU, 4GB RAM
   - `k3s-lb` (192.168.1.205) - Optional, 1 vCPU, 2GB RAM

3. Each VM:
   - Clones from Ubuntu 24.04 base box
   - Configures static IP on the private network
   - Runs initial provisioning script (updates packages, installs basic tools)
   - Sets up SSH access with Vagrant insecure key

**Output:** Running VMs with network connectivity

#### 1.3 Prepare WSL Environment for Ansible
This step is crucial for users running Ansible from WSL against Vagrant on Windows. It copies the necessary SSH key from the Windows host into the WSL environment.

```bash
# From your WSL terminal
cd /path/to/client-server-with-lb-demo # Adjust path as needed

# cd /mnt/h/Project/client-server-with-lb-demo

chmod +x prepare_ansible_env.sh
./prepare_ansible_env.sh
```

**What happens:**
1. The script locates the Vagrant SSH key on your Windows filesystem.
2. It executes the following commands to copy the key into `~/.ssh/insecure_private_key` inside your WSL environment and set the correct permissions required by SSH.
   ```bash
   mkdir -p ~/.ssh && cp /path/to/key ~/.ssh/insecure_private_key
   chmod 600 ~/.ssh/insecure_private_key

   #mkdir -p ~/.ssh && cp /mnt/h/Project/client-server-with-lb-demo/infra/ansible/insecure_private_key ~/.ssh/insecure_private_key && chmod 600 ~/.ssh/insecure_private_key
   ```
**Output:** A properly permissioned SSH key is now available inside WSL.

---

### Stage 2: Inventory Generation

#### 2.1 Configure Optional VMs (Optional)
To include optional VMs like the load balancer in the inventory, create a variable definitions file.

1.  Create a file named `terraform.tfvars` inside the `infra/terraform` directory.
2.  Add the following content to set the `create_lb_vm` variable to `true`:
    ```hcl
    create_lb_vm = true
    ```

Terraform will automatically load this file in the next step.

#### 2.2 Generate Ansible Inventory
```bash
# From your WSL terminal at the project root
cd infra/terraform
terraform init
terraform apply -auto-approve
terraform output -raw ansible_inventory > 
../ansible/inventory.ini
```

**What happens:**
1. Terraform reads the `main.tf` configuration, which defines the VM IPs as local variables.
2. `terraform apply` executes the `local_file` resource, which generates the Ansible inventory file directly.
   ```ini
   [k3s_control]
   k3s-control-plane ansible_host=192.168.1.200
   
   [k3s_workers]
   k3s-worker-1 ansible_host=192.168.1.201
   k3s-worker-2 ansible_host=192.168.1.202
   ...
   ```

**Output:** `infra/ansible/inventory.ini` file with all VM connection details

---

### Stage 3: System Bootstrap

#### 3.1 Bootstrap All Nodes
```bash
# From your WSL terminal at the project root
ansible-playbook -i infra/ansible/inventory.ini infra/ansible/bootstrap.yml
```

**What happens on each VM:**
1. **System Configuration:**
   - Updates apt cache
   - Installs required packages (curl, wget, vim, net-tools, etc.)
   - Disables swap (required for Kubernetes)
   - Loads kernel modules (overlay, br_netfilter)
   - Configures sysctl parameters:
     - `net.bridge.bridge-nf-call-iptables = 1`
     - `net.bridge.bridge-nf-call-ip6tables = 1`
     - `net.ipv4.ip_forward = 1`

2. **Network Preparation:**
   - Ensures IP forwarding is enabled
   - Configures bridge networking for containers

**Output:** All nodes prepared for Kubernetes installation

---

### Stage 4: K3s Cluster Installation

#### 4.1 Install K3s Control Plane
```bash
ansible-playbook -i inventory.ini k3s-install.yml
```

**What happens:**

**On Control Plane (k3s-control-plane):**
1. Downloads and installs K3s server:
   ```bash
   curl -sfL https://get.k3s.io | sh -s - server --cluster-init
   ```
2. K3s automatically:
   - Installs containerd (container runtime)
   - Installs Flannel CNI (pod networking)
   - Starts API server on port 6443
   - Creates SQLite database (or etcd if configured)
   - Generates node token for worker joining
3. Creates kubeconfig at `/etc/rancher/k3s/k3s.yaml`
4. Copies kubeconfig to user home: `~/.kube/config`
5. Updates kubeconfig server URL to use VM IP instead of localhost

**On Worker Nodes (k3s-worker-1, k3s-worker-2):**
1. Retrieves join token from control plane
2. Downloads and installs K3s agent:
   ```bash
   curl -sfL https://get.k3s.io | K3S_URL=https://<control-plane-ip>:6443 K3S_TOKEN=<token> sh -s - agent


   Example:
   curl -sfL https://get.k3s.io | K3S_URL=https://192.168.1.200:6443 K3S_TOKEN=<token> sh -s - agent
   ```
3. K3s agent:
   - Connects to control plane
   - Registers node with cluster
   - Starts kubelet and kube-proxy
   - Joins Flannel network

**Output:** Fully functional K3s cluster with 1 control plane + 2 workers

**Verification:**
```bash
ssh vagrant@192.168.1.200
sudo k3s kubectl get nodes
# Should show 3 nodes: control-plane, worker-1, worker-2
```

---

### Stage 5: MetalLB Deployment

#### 5.1 Deploy MetalLB LoadBalancer
```bash
ansible-playbook -i infra/ansible/inventory.ini infra/ansible/metallb.yml \
  --extra-vars "metallb_ip_pool_start=192.168.1.240 metallb_ip_pool_end=192.168.1.250"
```

**What happens:**
1. **Namespace Creation:**
   - Creates `metallb-system` namespace

2. **MetalLB Installation:**
   - Applies MetalLB manifests from official repository
   - Deploys:
     - `metallb-controller` (manages IP assignments)
     - `metallb-speaker` DaemonSet (runs on each node, handles ARP)

3. **IP Pool Configuration:**
   - Creates ConfigMap with IP address pool:
     ```yaml
     address-pools:
     - name: default
       protocol: layer2
       addresses:
       - 192.168.1.240-192.168.1.250
     ```
   - MetalLB reserves this IP range for LoadBalancer services

4. **L2 Mode Setup:**
   - MetalLB uses ARP to advertise IPs on the network
   - Each speaker pod responds to ARP requests for assigned IPs

**Output:** MetalLB ready to assign external IPs to LoadBalancer services

**Verification:**
```bash
sudo k3s kubectl get pods -n metallb-system
sudo k3s kubectl get ipaddresspool -n metallb-system
```

---

### Stage 6: Ingress Controller Deployment

#### 6.1 Deploy Nginx Ingress Controller
```bash
ansible-playbook -i infra/ansible/inventory.ini infra/ansible/ingress.yml
```

**What happens:**
1. **Namespace Creation:**
   - Creates `ingress-nginx` namespace.
   - Generates and applies self-signed certificates for admission webhooks (required for validation).

2. **Ingress Controller Deployment:**
   - Deploys the Nginx Ingress Controller using Helm-based manifests.
   - Creates a `LoadBalancer` service for the controller.
   - MetalLB assigns an external IP to this service (typically distinct from the application load balancer if configured separately, or sharing the pool).

3. **Verification:**
   - Waits for the controller deployment rollout to complete.
   - Retrieves the assigned LoadBalancer IP.

**Output:** Ingress Controller ready to route external traffic based on Ingress rules.

---

### Stage 7: Image Build & Distribution (Local Dev)

#### 7.1 Build and Distribute Images
Before deploying the application, the container images must be built and available on all nodes.

```bash
ansible-playbook -i inventory.ini build-images.yml
```

**What happens:**
1. **Build (Control Plane):**
   - Installs Docker on `k3s-control-plane`
   - Builds `server:latest` from `/vagrant/server`
   - Exports image to `/vagrant/server-image.tar` (shared folder)

2. **Distribute (All Nodes):**
   - Ansible loops through all nodes (Control + Workers)
   - Imports the tarball into `containerd` using `k3s ctr images import`
   - Ensures `server:latest` is available locally on every node

**Note:** This is required because we are not using a central container registry (like Docker Hub) for this local setup.

---

### Stage 8: Nginx Reverse Proxy Deployment

#### 8.1 Deploy Nginx Reverse Proxy with MetalLB
```bash
ansible-playbook -i inventory.ini deploy-nginx-reverse-proxy.yml
```

**What happens:**

1. **Namespace Creation:**
   - Creates `loadbalancer` namespace

2. **ConfigMap Deployment:**
   - Deploys nginx configuration:
     ```nginx
     upstream backend {
         server server1-service:3001    max_fails=3 fail_timeout=5s    weight=5;
         server server2-service:3002    max_fails=3 fail_timeout=5s;
         server server3-service:3003    max_fails=3 fail_timeout=5s;
     }
     ```

3. **Backend Services (if not exists):**
   - Deploys ClusterIP services:
     - `server1-service:3001`
     - `server2-service:3002`
     - `server3-service:3003`

4. **Nginx Reverse Proxy Deployment:**
   - Deploys nginx pods with ConfigMap mounted
   - Pods listen on port 8080
   - Configured to proxy to backend services

5. **LoadBalancer Service Creation:**
   - Creates service with `type: LoadBalancer`
   - MetalLB detects the service
   - MetalLB assigns an IP from the pool (e.g., 192.168.1.240)
   - Service exposes:
     - Port 80 → Pod port 8080
     - Port 443 → Pod port 8443

**Output:** Nginx reverse proxy accessible via MetalLB-assigned IP

**Verification:**
```bash
sudo k3s kubectl get svc -n loadbalancer nginx-service
# EXTERNAL-IP should show an IP from the MetalLB pool
```

---

### Stage 9: Autoscaling & Resilience
#### 9.1 Deploy Autoscalers
```bash
ansible-playbook -i inventory.ini autoscale.yml
```

**What happens:**
1. **Horizontal Pod Autoscaler (HPA):**
   - Applies HPA policies for `nginx-reverse-proxy` and backend servers.
   - Scales pods based on CPU/Memory usage (e.g., target 60% CPU).

2. **Vertical Pod Autoscaler (VPA):**
   - Applies VPA policies (requires VPA CRDs).
   - Currently set to "Off" mode (recommendation only) to avoid conflicts.

3. **ReplicaSet Demo:**
   - Deploys a standalone ReplicaSet `manual-replicaset-demo` for testing manual scaling.

---

### Stage 10: Application Deployment

#### 10.1 Deploy Application Manifests
```bash
# Via GitLab CI or manually
kubectl apply -f k8s/
```

**What happens:**
1. **Backend Deployments:**
   - Deploys server1, server2, server3 pods
   - Each pod runs the application server
   - Pods are scheduled across worker nodes

2. **Service Discovery:**
   - ClusterIP services route traffic to backend pods
   - Nginx reverse proxy uses service names for upstream

3. **Redis Deployment:**
   - Deploys Redis for session storage
   - Accessible to TCP auth server

4. **TCP Auth Server:**
   - Deploys authentication server
   - Connects to Redis and PostgreSQL

**Output:** Full application stack running in Kubernetes

---

### Stage 11: Traffic Flow

#### 11.1 Complete Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT REQUEST FLOW                           │
└─────────────────────────────────────────────────────────────────┘

1. Client Request
   ↓
   http://192.168.1.240/  (MetalLB-assigned IP)

2. Network Layer (VMware Workstation Network)
   ↓
   ARP Resolution: "Who has 192.168.1.240?"
   MetalLB Speaker responds with VM MAC address
   ↓
   Traffic routed to VM hosting MetalLB speaker

3. MetalLB LoadBalancer Service
   ↓
   Service: nginx-service (type: LoadBalancer)
   Port: 80 → targetPort: 8080
   ↓
   Kubernetes Service Proxy routes to nginx pods

4. Nginx Reverse Proxy Pod
   ↓
   Receives request on port 8080
   Reads ConfigMap: /etc/nginx/conf.d/default.conf
   ↓
   Upstream configuration:
   - server1-service:3001 (weight=5)
   - server2-service:3002
   - server3-service:3003
   ↓
   Load balancing decision (weighted round-robin)

5. Backend Service (ClusterIP)
   ↓
   Example: server1-service:3001
   ↓
   Kubernetes Service Proxy routes to backend pods
   Selects pod based on service selector

6. Backend Pod
   ↓
   Application server processes request
   Returns response

7. Response Path (Reverse)
   ↓
   Backend Pod → Service → Nginx → LoadBalancer → Client
```

#### 11.2 Load Balancing Logic

**Nginx Reverse Proxy:**
- **Weighted Distribution:**
  - server1: 5 requests
  - server2: 1 request
  - server3: 1 request
  - Pattern repeats: 5:1:1 ratio

- **Health Checks:**
  - `max_fails=3`: Mark server down after 3 failures
  - `fail_timeout=5s`: Retry after 5 seconds

- **Session Affinity:**
  - Service configured with `sessionAffinity: ClientIP`
  - Same client IP routes to same backend (3-hour timeout)

**Kubernetes Service:**
- Round-robin distribution across healthy pods
- Automatic failover if pod becomes unhealthy

---

### Stage 12: Monitoring and Observability

#### 12.1 Monitoring Stack Deployment
```bash
ansible-playbook -i inventory.ini monitoring.yml
```

**What happens:**
1. **Prometheus:**
   - Scrapes metrics from:
     - Node exporter (node metrics)
     - Kube-state-metrics (K8s object metrics)
     - Application pods (if instrumented)
   - Stores time-series data
   - Exposed via LoadBalancer service (MetalLB IP)

2. **Grafana:**
   - Connects to Prometheus as data source
   - Pre-configured dashboards for:
     - Node metrics
     - Pod metrics
     - Service metrics
   - Exposed via LoadBalancer service (MetalLB IP)

3. **Node Exporter:**
   - DaemonSet running on all nodes
   - Exports system metrics (CPU, memory, disk, network)

4. **Kube-State-Metrics:**
   - Exports Kubernetes object states
   - Pod status, node conditions, etc.

**Access:**
- Grafana: `http://<grafana-lb-ip>:3000` (admin/admin)
- Prometheus: `http://<prometheus-lb-ip>:9090`

---

### Stage 13: GitLab CI/CD Pipeline

#### 13.1 Automated Workflow

The project uses a structured CI/CD pipeline (simulated via Ansible or executed by GitLab Runner) that mirrors production deployment steps.

**Pipeline Stages:**

1.  **provision** (Manual Trigger)
    *   **Goal:** Spin up infrastructure.
    *   **Tasks:**
        *   Provisions VMs with Vagrant.
        *   Generates Ansible inventory (`inventory.ini`) using Terraform.

2.  **configure** (Automatic)
    *   **Goal:** Bootstrap and configure the cluster.
    *   **Tasks:**
        *   `bootstrap.yml`: Prepares nodes (sysctl, swap off).
        *   `k3s-install.yml`: Installs K3s control plane and workers.
        *   `metallb.yml`: Deploys MetalLB and configures IP pools.
        *   `ingress.yml`: Deploys Nginx Ingress Controller.
        *   `monitoring.yml`: Sets up Prometheus and Grafana.

3.  **deploy** (Automatic)
    *   **Goal:** Deploy application workload.
    *   **Tasks:**
        *   `deploy-nginx-reverse-proxy.yml`: Deploys the custom Nginx LoadBalancer.
        *   `autoscale.yml`: Configures HPA and ReplicaSets for resilience.
        *   **App Deployment:** Applies `k8s/` manifests (Servers, Redis, TCP Auth).

4.  **smoke-test** (Automatic)
    *   **Goal:** Verify system health.
    *   **Tasks:**
        *   Validates LoadBalancer IP assignment.
        *   Checks endpoint availability (HTTP 200 OK).
        *   Verifies HPA target health.

---

## Complete Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    VMWARE WORKSTATION                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Private Network (192.168.1.0/24)            │   │
│  │                                                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ k3s-control  │  │ k3s-worker-1 │  │ k3s-worker-2 │  │   │
│  │  │   (200)      │  │    (201)     │  │    (202)     │  │   │
│  │  │              │  │              │  │              │  │   │
│  │  │ K3s Server   │  │ K3s Agent    │  │ K3s Agent    │  │   │
│  │  │ API:6443     │  │              │  │              │  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │   │
│  │         │                  │                  │          │   │
│  │         └──────────────────┼──────────────────┘          │   │
│  │                            │                              │   │
│  │                    ┌───────▼────────┐                    │   │
│  │                    │  K3s Cluster   │                    │   │
│  │                    │  (Flannel CNI) │                    │   │
│  │                    └───────┬────────┘                    │   │
│  │                            │                              │   │
│  │  ┌─────────────────────────┼──────────────────────────┐  │   │
│  │  │                    Kubernetes Pods                  │  │   │
│  │  │                                                      │  │   │
│  │  │  ┌──────────────┐  ┌──────────────┐               │  │   │
│  │  │  │ MetalLB      │  │ Nginx Reverse│               │  │   │
│  │  │  │ Controller   │  │ Proxy        │               │  │   │
│  │  │  │ + Speakers   │  │ (LoadBalancer│               │  │   │
│  │  │  └──────────────┘  │  Service)     │               │  │   │
│  │  │                    └───────┬───────┘               │  │   │
│  │  │                            │                        │  │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │  │   │
│  │  │  │ Server1  │  │ Server2  │  │ Server3  │        │  │   │
│  │  │  │ Pod      │  │ Pod      │  │ Pod      │        │  │   │
│  │  │  └──────────┘  └──────────┘  └──────────┘        │  │   │
│  │  │                                                      │  │   │
│  │  │  ┌──────────┐  ┌──────────┐                       │  │   │
│  │  │  │ Prometheus│  │ Grafana  │                       │  │   │
│  │  │  └──────────┘  └──────────┘                       │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
         │
         │ MetalLB LoadBalancer IPs (240-250)
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL ACCESS                              │
│                                                                   │
│  Client → 192.168.1.240 (Nginx Reverse Proxy)                  │
│         → 192.168.1.241 (Grafana)                              │
│         → 192.168.1.242 (Prometheus)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Components Summary

| Component               | Purpose                    | Technology                   |
| ----------------------- | -------------------------- | ---------------------------- |
| **VM Provisioning**     | Create VMs                 | Vagrant + VMware Workstation |
| **Orchestration**       | Container orchestration    | K3s (Kubernetes)             |
| **CNI**                 | Pod networking             | Flannel (built into K3s)     |
| **Load Balancing (L4)** | External IP assignment     | MetalLB (L2 mode)            |
| **Reverse Proxy**       | Application load balancing | Nginx                        |
| **Service Discovery**   | Internal routing           | Kubernetes Services          |
| **Monitoring**          | Metrics & dashboards       | Prometheus + Grafana         |
| **Configuration**       | Infrastructure as Code     | Ansible                      |
| **Autoscaling**         | HPA & VPA                  | Kubernetes Autoscaling       |
| **CI/CD**               | Automation                 | GitLab CI                    |

---

## Typical Deployment Timeline

1. **VM Provisioning:** ~10-15 minutes (up to 6 VMs)
2. **Bootstrap:** ~2-3 minutes (all nodes)
3. **K3s Installation:** ~3-5 minutes (cluster setup)
4. **MetalLB Deployment:** ~1-2 minutes
5. **Nginx Reverse Proxy:** ~1-2 minutes
6. **Autoscale & ReplicaSet:** ~1 minute
7. **Application Deployment:** ~2-3 minutes
8. **Monitoring Stack:** ~2-3 minutes

**Total:** ~25-35 minutes for complete infrastructure setup

---

## Troubleshooting Workflow

If something fails, check in this order:

1. **VMs Running?**
   ```bash
   vagrant status
   ```

2. **Network Connectivity?**
   ```bash
   ping 192.168.1.200
   ```

3. **K3s Cluster Healthy?**
   ```bash
   ssh vagrant@192.168.1.200
   sudo k3s kubectl get nodes
   ```

4. **MetalLB Working?**
   ```bash
   sudo k3s kubectl get pods -n metallb-system
   sudo k3s kubectl get svc -n loadbalancer
   ```

5. **Nginx Reverse Proxy?**
   ```bash
   sudo k3s kubectl get pods -n loadbalancer
   sudo k3s kubectl logs -n loadbalancer -l app=nginx-reverse-proxy
   ```

This workflow provides a complete, automated infrastructure setup from bare VMs to a fully functional, load-balanced application stack.
