# How to use Kube-Monkey

1.  **Deploy Kube-Monkey**:
    ```bash
    kubectl apply -f deployment.yaml
    ```

2.  **Opt-in your applications**:
    Add the following labels to your application's **Deployment** (in `k8s/` or `infra/ansible` templates):

    ```yaml
    metadata:
      labels:
        kube-monkey/enabled: enabled
        kube-monkey/identifier: my-app-id
        kube-monkey/mtbf: "1"  # Mean time between failures (days). 1 = kill daily.
        kube-monkey/kill-mode: "fixed"
        kube-monkey/kill-value: "1"
    ```

    **Example for `server1`**:
    Edit `k8s/deployment-server1.yaml` to include these labels in the metadata.



