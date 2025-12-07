# How to use Muxy

Muxy is a chaos testing tool that simulates network failures. It acts as a proxy.

## Setup with Docker

1.  Create a `docker-compose.muxy.yml` (similar to Toxiproxy) or run it standalone.
2.  Muxy reads `config.yml` to determine proxies and chaos rules (middleware).

## Example Usage

To run Muxy locally against a Redis instance:

```bash
docker run --rm -v $(pwd)/config.yml:/config.yml \
  --link client-server-with-lb-demo-redis-1:redis \
  -p 6380:6380 \
  moul/muxy:latest \
  proxy --config /config.yml
```

Then point your application to `localhost:6380` instead of `localhost:6379`.

## Config Explanation

-   **Proxy**: Defines the listener (`:6380`) and the target (`redis:6379`).
-   **Middleware**: Defines the type of chaos (latency, HTTP error, etc.).
-   **Rules**: Applies middleware to a proxy with a certain probability (`p`).



