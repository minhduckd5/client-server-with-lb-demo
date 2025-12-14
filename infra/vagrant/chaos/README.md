# Chaos Engineering Stack

This directory contains the orchestrated Chaos Engineering stack for the Client-Server Load Balancing Demo. The stack follows a **layered approach**, using specific tools for different levels of the infrastructure.

## 🏗️ Architecture & Tool Selection

We use a consolidated stack to ensure precise control and comprehensive coverage:

| Layer | Tool | Role | Location |
| :--- | :--- | :--- | :--- |
| **Orchestrator** | **Chaos Toolkit** | **Control Plane**. Reads experiments and coordinates attacks across all other tools. | `k3s-monitoring` VM |
| **Kubernetes** | **Chaos Mesh** | **Platform Attacks**. Handles Pod kills, Network failures (MetalLB), and Stress tests inside K8s. | K3s Cluster |
| **Infrastructure** | **Stress-ng** | **Hardware Stress**. Burn CPU/Memory on Worker Nodes via SSH. | Worker VMs |
| **App Network** | **Toxiproxy** | **Precision Network**. High-fidelity latency/bandwidth simulation for Client-Server tests. | Sidecars / Docker |
| **Docker Legacy**| **Pumba** | **Legacy Support**. Targeted specifically for standalone Docker scenarios. | Docker Host |

> **Note:** Deprecated tools (Muxy, Kube-Monkey) have been removed in favor of this modern cloud-native stack.

## 🌐 Chaos Workflow by Environment

### 1. Kubernetes Environment (Modern Stack)
In the primary Kubernetes cluster, the workflow involves **Chaos Toolkit** as the conductor and **Chaos Mesh** as the executor.

**Goal:** Test Microservices, MetalLB failover, and Ingress stability.

1.  **Define Experiment (JSON):** You write a Chaos Toolkit experiment (e.g., `pod-kill.json`).
2.  **Orchestration:** `chaos run experiment.json` is executed on the **Monitoring VM**.
3.  **Execution (Chaos Mesh):**
    *   Chaos Toolkit talks to the Kubernetes API.
    *   It creates a Chaos Mesh CRD (e.g., `PodChaos` or `NetworkChaos`).
    *   **Chaos Mesh Controller** picks up the CRD and injects the fault (e.g., killing a Pod or corrupting network packets via eBPF).
4.  **Validation:** Chaos Toolkit probes the system (e.g., checks HTTP 200 OK) to verify if the service survived the fault.

### 2. Docker Environment (Legacy/Standalone)
For scenarios running pure Docker (e.g., the Nginx Load Balancer setup without K8s), we use **Pumba**.

**Goal:** Test Nginx LB timeouts and backend server resilience.

1.  **Define Experiment:** You create a Chaos Toolkit experiment configured with the `chaostoolkit-docker` driver.
2.  **Orchestration:** `chaos run experiment.json` runs on the host or monitoring node.
3.  **Execution (Pumba):**
    *   Chaos Toolkit commands Pumba (running as a privileged container) to attach to the target container.
    *   **Pumba** modifies the Linux Kernel Traffic Control (`tc`) settings of the target container's network namespace to introduce latency (e.g., 3000ms delay).
4.  **Validation:** Probes check if Nginx successfully fails over to a healthy backend or if the user experiences a timeout.

---

## 🚀 Getting Started

### 1. Deployment
The entire stack is deployed via Ansible. This installs Chaos Mesh on the cluster and Chaos Toolkit on the monitoring node.

```bash
# Deploy Infrastructure & Chaos Mesh
ansible-playbook -i infra/ansible/inventory.ini infra/ansible/install-chaos-mesh.yml

# Deploy Chaos Toolkit & Sync Experiments
ansible-playbook -i infra/ansible/inventory.ini infra/ansible/deploy-chaos.yml
```

### 2. Running Experiments
Experiments are run from the **Monitoring VM** (`k3s-monitoring`).

1.  SSH into the monitoring machine:
    ```bash
    cd infra/vagrant
    vagrant ssh k3s-monitoring
    ```

2.  Navigate to the workspace:
    ```bash
    cd ~/chaos
    ```

3.  Run the Master Experiment:
    ```bash
    # Activates the Layered Attack (Stress CPU + Kill Pod)
    chaos run chaos-toolkit/experiments/layered-attack.json
    ```

## 📂 Directory Structure

*   `chaos-toolkit/`: The brain of the operation. Contains JSON experiment definitions and the master `requirements.txt`.
*   `toxiproxy/`: Configuration for network simulation scenarios.
*   `pumba/`: Legacy Docker-native chaos definitions.
*   `chaos-mesh/`: (Managed via Helm) Definitions for Kubernetes CRDs are generated at runtime.
