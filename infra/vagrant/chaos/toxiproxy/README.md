# How to use Toxiproxy

Toxiproxy allows you to simulate network conditions like latency, bandwidth limits, and connection drops.

## Setup

1.  **Start the stack with Toxiproxy**:
    ```bash
    docker-compose -f ../../docker-compose.yml -f docker-compose.toxiproxy.yml up -d
    ```

2.  **Create the proxy**:
    You need to tell Toxiproxy to map its port 6379 to the actual Redis container.

    ```bash
    # Exec into the toxiproxy-cli container (or any container with curl/toxiproxy-cli)
    docker exec -it chaos-toxiproxy-cli-1 /toxiproxy-cli create redis -l 0.0.0.0:6379 -u redis:6379
    ```
    *Note: If `chaos-toxiproxy-cli-1` isn't the exact name, check `docker ps`.*

## Injecting Chaos

Once the proxy is created, you can add "toxics" (faults).

1.  **Add 1000ms latency**:
    ```bash
    docker exec -it chaos-toxiproxy-cli-1 /toxiproxy-cli toxic add redis -t latency -a latency=1000
    ```

2.  **Simulate connection down**:
    ```bash
    docker exec -it chaos-toxiproxy-cli-1 /toxiproxy-cli toxic add redis -t limit_data -a bytes=0
    ```

3.  **Reset**:
    ```bash
    docker exec -it chaos-toxiproxy-cli-1 /toxiproxy-cli toxic remove redis -n <toxic_name>
    # or just restart the toxiproxy container to clear state if not persistent
    ```



