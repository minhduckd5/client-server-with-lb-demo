# Kubernetes Deployment for Load Balancer on VMware (k3s)

This directory contains Kubernetes manifests to deploy the nginx load balancer with 3 backend server instances on a k3s cluster running in a VMware VM.

## Prerequisites

- VMware VM with Ubuntu 20.04+ or similar Linux distribution
- Docker installed on the VM
- k3s installed (see setup instructions below)
- kubectl configured to access the k3s cluster
- PostgreSQL database accessible (either on host or external)

## k3s Installation on VMware VM

### Single-Node Setup (Recommended for Development)

1. **SSH into your VMware VM**

2. **Install k3s**:
   ```bash
   curl -sfL https://get.k3s.io | sh -
   ```

3. **Verify installation**:
   ```bash
   sudo k3s kubectl get nodes
   ```

4. **Configure kubectl** (on your local machine or VM):
   ```bash
   # Copy kubeconfig from VM
   mkdir -p ~/.kube
   scp user@vm-ip:/etc/rancher/k3s/k3s.yaml ~/.kube/config
   
   # Update server address in config
   sed -i 's/127.0.0.1/<VM_IP_ADDRESS>/g' ~/.kube/config
   ```

### Multi-Node Setup (Optional - Commented)

For a multi-node cluster:

1. **On master node**:
   ```bash
   curl -sfL https://get.k3s.io | K3S_TOKEN=<your-token> sh -s - server
   ```

2. **On worker nodes**:
   ```bash
   curl -sfL https://get.k3s.io | K3S_TOKEN=<your-token> K3S_URL=https://<master-ip>:6443 sh -s - agent
   ```

3. **Configure node affinity** in deployments if needed:
   ```yaml
   spec:
     template:
       spec:
         affinity:
           nodeAffinity:
             requiredDuringSchedulingIgnoredDuringExecution:
               nodeSelectorTerms:
               - matchExpressions:
                 - key: node-role.kubernetes.io/master
                   operator: In
                   values:
                   - "true"
   ```

## Building and Loading Docker Images

Since k3s uses containerd, you need to build and load images into the k3s runtime.

### Option 1: Build on VM and Load into k3s

1. **Build server images**:
   ```bash
   cd /path/to/project/server
   docker build -t server1:latest .
   docker build -t server2:latest .
   docker build -t server3:latest .
   ```

2. **Build nginx reverse proxy image** (if custom):
   ```bash
   cd /path/to/project/reverse-proxy
   docker build -t reverse-proxy:latest .
   ```

3. **Build TCP auth server image** (if using full stack):
   ```bash
   cd /path/to/project/tcp-auth-server
   docker build -t tcp-auth-server:latest .
   ```

4. **Import images into k3s**:
   ```bash
   # Save images
   docker save server1:latest -o server1.tar
   docker save server2:latest -o server2.tar
   docker save server3:latest -o server3.tar
   
   # Import into k3s
   sudo k3s ctr images import server1.tar
   sudo k3s ctr images import server2.tar
   sudo k3s ctr images import server3.tar
   ```

### Option 2: Use Local Registry

1. **Deploy local registry**:
   ```bash
   docker run -d -p 5000:5000 --name registry registry:2
   ```

2. **Tag and push images**:
   ```bash
   docker tag server1:latest localhost:5000/server1:latest
   docker push localhost:5000/server1:latest
   ```

3. **Update image references** in deployment files to use `localhost:5000/` prefix

### Option 3: Use Docker Hub or Other Registry

1. **Tag and push to registry**:
   ```bash
   docker tag server1:latest your-registry.com/server1:latest
   docker push your-registry.com/server1:latest
   ```

2. **Update image references** in deployment files
3. **Create image pull secrets** if registry requires authentication

## Configuration

### 1. Update Secrets

Edit `secret-app.yaml` with your actual PostgreSQL password:

```yaml
stringData:
  PG_PASSWORD: "your_actual_password"
```

### 2. Update ConfigMap (if needed)

Edit `configmap-app.yaml` if your PostgreSQL settings differ:

```yaml
data:
  PG_PORT: "5432"
  PG_USER: "postgres"
  PG_DATABASE: "ShoppingCS-LB"
```

### 3. PostgreSQL Access

The deployments use `host.docker.internal` to access PostgreSQL on the host. For k3s:

- **Option A**: Use host network mode (not recommended for production)
- **Option B**: Deploy PostgreSQL in Kubernetes (recommended)
- **Option C**: Use external PostgreSQL service with proper network configuration

To use host PostgreSQL, you may need to update the `PG_HOST` environment variable in deployments to use the VM's IP address or configure proper networking.

## Deployment

### Deploy Load Balancer Stack (Default)

1. **Apply all manifests**:
   ```bash
   kubectl apply -f k8s/
   ```

   Or using kustomize:
   ```bash
   kubectl apply -k k8s/
   ```

2. **Verify deployments**:
   ```bash
   kubectl get pods -n loadbalancer
   kubectl get services -n loadbalancer
   ```

3. **Check logs**:
   ```bash
   kubectl logs -n loadbalancer deployment/server1
   kubectl logs -n loadbalancer deployment/nginx-reverse-proxy
   ```

### Deploy Full Stack (Including Redis and TCP Auth Server)

1. **Uncomment Redis and TCP Auth Server sections** in:
   - `k8s/kustomization.yaml`
   - `k8s/configmap-app.yaml` (for Redis/TCP auth config)
   - `k8s/secret-app.yaml` (for Redis password if needed)

2. **Uncomment the manifests** in:
   - `k8s/redis-deployment.yaml`
   - `k8s/tcp-auth-server-deployment.yaml`

3. **Apply**:
   ```bash
   kubectl apply -k k8s/
   ```

## Accessing the Application

### NodePort Service (Default)

The nginx service is exposed as NodePort on port 30080:

```bash
# From VM
curl http://localhost:30080/api/health

# From external machine
curl http://<VM_IP>:30080/api/health
```

### LoadBalancer Service

If you have MetalLB or a cloud provider configured:

1. **Update `service-nginx.yaml`**:
   ```yaml
   type: LoadBalancer
   ```

2. **Get external IP**:
   ```bash
   kubectl get svc -n loadbalancer nginx-service
   ```

3. **Access via external IP**:
   ```bash
   curl http://<EXTERNAL_IP>:8080/api/health
   ```

## Troubleshooting

### Pods Not Starting

1. **Check pod status**:
   ```bash
   kubectl describe pod <pod-name> -n loadbalancer
   ```

2. **Check image pull errors**:
   ```bash
   kubectl get events -n loadbalancer --sort-by='.lastTimestamp'
   ```

3. **Verify images are loaded**:
   ```bash
   sudo k3s ctr images list | grep server
   ```

### Connection Issues

1. **Test service connectivity**:
   ```bash
   kubectl run -it --rm debug --image=busybox --restart=Never -n loadbalancer -- sh
   # Inside pod:
   wget -O- http://server1-service:3001/api/health
   ```

2. **Check nginx configuration**:
   ```bash
   kubectl exec -n loadbalancer deployment/nginx-reverse-proxy -- cat /etc/nginx/conf.d/default.conf
   ```

### PostgreSQL Connection Issues

If `host.docker.internal` doesn't work in k3s:

1. **Find VM IP**:
   ```bash
   hostname -I
   ```

2. **Update deployments** to use VM IP or configure proper networking

3. **Alternative**: Deploy PostgreSQL in Kubernetes using a StatefulSet

## Scaling

To scale server instances:

```bash
kubectl scale deployment server1 -n loadbalancer --replicas=2
kubectl scale deployment server2 -n loadbalancer --replicas=2
kubectl scale deployment server3 -n loadbalancer --replicas=2
```

## Cleanup

To remove all resources:

```bash
kubectl delete -k k8s/
# Or
kubectl delete namespace loadbalancer
```

## Storage Considerations

### Single-Node (Default)

k3s uses `local-path` storage class by default, which is suitable for single-node setups.

### Multi-Node

For multi-node clusters, consider:
- NFS volumes
- Ceph/Rook
- Cloud storage classes
- Longhorn (lightweight distributed storage for k3s)

## Network Policies (Optional)

To restrict traffic between pods, create NetworkPolicy resources:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-nginx-to-servers
  namespace: loadbalancer
spec:
  podSelector:
    matchLabels:
      app: nginx-reverse-proxy
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: server1
    - podSelector:
        matchLabels:
          app: server2
    - podSelector:
        matchLabels:
          app: server3
```

## Monitoring (Optional)

Consider adding:
- Prometheus for metrics
- Grafana for visualization
- k3s built-in metrics server (usually enabled by default)

## Security Notes

1. **Secrets**: Never commit actual passwords to git. Use sealed-secrets or external secret management.
2. **Image Security**: Scan images for vulnerabilities before deployment.
3. **Network Policies**: Implement network policies to restrict pod-to-pod communication.
4. **RBAC**: Configure proper RBAC for production deployments.


