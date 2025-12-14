# Chaos Toolkit Orchestration

This directory contains the experiment definitions and custom drivers for the Chaos Engineering stack. Chaos Toolkit serves as the **Control Plane**, orchestrating attacks across Kubernetes, infrastructure, and network layers.

## 🛠️ Components

| File/Dir | Description |
| :--- | :--- |
| `experiments/` | JSON files defining the chaos scenarios (Hypothesis -> Method -> Rollback). |
| `custom_ssh_actions.py` | A custom Python module to execute SSH commands (e.g., `stress-ng`) without external dependencies. |
| `requirements.txt` | Python dependencies installed on the Monitoring VM. |

## 🧪 Experiments

### 1. Layered Attack (Kubernetes + Chaos Mesh)
**File:** `experiments/layered-attack.json`

A sophisticated scenario that attacks the system on two fronts simultaneously:
*   **Infrastructure Stress:** Uses **Chaos Mesh** `StressChaos` to inject a CPU stressor sidecar into `server2` pods. This creates resource contention.
*   **Availability Test:** Uses **Chaos Toolkit** to terminate pods from `server1`, `server2`, and `server3` in parallel.

**Goal:** Verify that the system remains responsive (Steady State Probe) despite high load and loss of replicas.

```bash
chaos run experiments/layered-attack.json
```

### 2. Infrastructure Node Stress (SSH + Stress-ng)
**File:** `experiments/ssh-node-stress.json`

A brute-force infrastructure attack targeting the OS level directly.
*   **Mechanism:** Uses the custom `custom_ssh_actions.py` driver.
*   **Action:** SSHs into a Worker Node (`192.168.1.201`) and executes `stress-ng` to burn 2 CPU cores for 30 seconds.

**Goal:** Test if the Kubernetes Scheduler (and other workloads on the node) can handle a noisy neighbor at the OS level.

```bash
# Ensure PYTHONPATH is set (done automatically by ansible deploy)
export PYTHONPATH=$PYTHONPATH:/home/vagrant/chaos/chaos-toolkit
chaos run experiments/ssh-node-stress.json
```

### 3. Legacy Experiments
*   `k8s-pod-delete.json`: Simple pod termination test.
*   `toxiproxy-latency.json`: Network latency injection for legacy/docker apps.

## ⚙️ Configuration

The environment is automatically provisioned by Ansible (`infra/ansible/deploy-chaos.yml`):
*   **Location:** `/home/vagrant/chaos/chaos-toolkit` on `k3s-monitoring` VM.
*   **Kubeconfig:** synced from Control Plane to `~/.kube/config`.
*   **Dependencies:** `chaosk8s`, `chaostoolkit-toxiproxy` installed via pip.
*   **Custom Modules:** `PYTHONPATH` configured in `.bashrc`.
