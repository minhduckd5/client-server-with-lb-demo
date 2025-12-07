# Chaos Toolkit Integration

The **Chaos Toolkit** acts as the orchestrator. Unlike tools like Pumba or Kube-Monkey (which are "daemons" that run autonomously), Chaos Toolkit runs defined **experiments**. It verifies a "Steady State" (is the system healthy?), applies a "Method" (inject fault), and then checks the steady state again.

## Integration with Other Tools

Chaos Toolkit doesn't replace the underlying technology but *drivers* it:
-   **vs Toxiproxy**: Chaos Toolkit uses the `chaostoolkit-toxiproxy` driver to tell the Toxiproxy container to add latency or cut connections.
-   **vs Kubernetes**: It uses `chaostoolkit-kubernetes` to kill pods (similar to what Kube-Monkey does, but in a controlled, measurable experiment).
-   **vs Docker**: It uses `chaostoolkit-docker` to stop/kill containers (similar to Pumba).

## Setup

1.  **Install Python & Dependencies**:
    ```bash
    cd chaos/chaos-toolkit
    pip install -r requirements.txt
    ```

2.  **Ensure Environment**:
    -   For **Kubernetes experiments**, ensure `~/.kube/config` is valid and accessible.
    -   For **Toxiproxy experiments**, ensure the Toxiproxy API is running and accessible (e.g., `http://localhost:8474`).

## Running Experiments

### 1. Kubernetes: Pod Deletion
This experiment checks if your app stays online (`http://localhost:80`) when a pod is killed.

```bash
chaos run experiments/k8s-pod-delete.json
```

### 2. Toxiproxy: High Latency
This experiment adds 2s latency to the Redis connection and checks if the Auth service still responds.

*Prerequisite: Ensure Toxiproxy is running (see `chaos/toxiproxy/README.md`).*

```bash
# You might need to set TOXIPROXY_URL if not localhost:8474
export TOXIPROXY_URL=http://localhost:8474
chaos run experiments/toxiproxy-latency.json
```



