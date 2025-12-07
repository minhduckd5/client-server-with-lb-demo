# How to use Pumba

Pumba allows you to kill, stop, or pause Docker containers to test resilience.

## Running Pumba

1.  Start your main stack:
    ```bash
    docker-compose up -d
    ```

2.  Start Pumba to kill random servers periodically:
    ```bash
    docker-compose -f ../../docker-compose.yml -f docker-compose.chaos.yml up -d
    ```

    *Note: You might need to adjust the regex in `docker-compose.chaos.yml` to match your actual container names (check `docker ps`).*

## Other Commands

-   **Network Emulation (Delay)**:
    Add network latency to a container:
    ```bash
    docker run -it --rm -v /var/run/docker.sock:/var/run/docker.sock gaiaadm/pumba netem --duration 5m delay --time 3000 server1
    ```



