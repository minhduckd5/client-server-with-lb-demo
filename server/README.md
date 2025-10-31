# Backend Server – Usage with and without Load Balancer

This Node.js HTTP server exposes REST endpoints under `/api/*`. It can run standalone or behind the nginx reverse proxy/load balancer defined at the repository root.

## Endpoints

- GET `/api/health`
- GET `/api/products`
- GET `/api/products/:id`
- GET `/api/cart`
- POST `/api/cart`
- PUT `/api/cart/:id`
- DELETE `/api/cart/:id`
- DELETE `/api/cart`
- GET `/api/orders`
- POST `/api/orders`
- GET `/api/orders/:id`

## Run Standalone (no LB)

Prerequisites: Node 22+, pnpm

```bash
cd server
pnpm install

# Configure host/port (optional; defaults: 0.0.0.0:3001)
$env:SERVER_HOST='0.0.0.0'   # PowerShell on Windows
$env:SERVER_PORT='3001'

pnpm start
# Server listens on http://0.0.0.0:3001
```

Verify:

```bash
curl http://localhost:3001/api/health
```

## Run with nginx Load Balancer (docker-compose)

The load balancer runs three server instances and proxies them via nginx.

1) Create `.env` at the repository root (next to `docker-compose.yml`):

```env
SERVER_HOST_1=server1
SERVER_PORT_1=3001
SERVER_HOST_2=server2
SERVER_PORT_2=3002
SERVER_HOST_3=server3
SERVER_PORT_3=3003

NGINX_HOST=reverse-proxy
NGINX_PORT=8080
```

2) Start the stack from the repository root:

```bash
# docker compose up -d --build
docker compose --env-file .env up
```

3) Test the load balancer:

```bash
curl http://localhost:8080/api/health
# Re-run multiple times to observe responses from different backends
```

Implementation details:
- Docker image is built from `server/Dockerfile` and started with `pnpm start` (nodemon).
- Nginx upstream targets are configured in `reverse-proxy/default.conf.template` and use the env variables above.

## Environment Variables

- `SERVER_HOST` – Bind address for this server (default `0.0.0.0` in container; `0.0.0.0`/`localhost` locally)
- `SERVER_PORT` – Listener port for this server (defaults to `3001`)


