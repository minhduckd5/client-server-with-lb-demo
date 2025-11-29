# TCP Authentication Server

A TCP-based authentication server built with Go, Redis, and PostgreSQL. Handles user registration, login, session management, and token validation.

## Features

- User registration and authentication
- Session management with Redis
- Token-based authentication
- Connection tracking
- PostgreSQL integration for user data
- JSON message protocol over TCP

## Architecture

- **TCP Server**: Handles client connections and message routing
- **Redis**: Stores active sessions and session tokens
- **PostgreSQL**: Stores user accounts and session audit trail
- **Go**: High-performance server implementation

## Protocol

The server uses JSON messages over TCP, newline-delimited (`\n`).

### Request Format

```json
{"type":"register","username":"user","email":"user@example.com","password":"pass"}
{"type":"login","username":"user","password":"pass"}
{"type":"logout","token":"session_token"}
{"type":"validate","token":"session_token"}
{"type":"refresh","token":"session_token"}
```

### Response Format

Success:
```json
{"status":"success","data":{...}}
```

Error:
```json
{"status":"error","message":"error description"}
```

## Configuration

Environment variables:

- `TCP_AUTH_HOST` - Server bind address (default: 0.0.0.0)
- `TCP_AUTH_PORT` - Server port (default: 9090)
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port
- `REDIS_PASSWORD` - Redis password (optional)
- `PG_HOST` - PostgreSQL host
- `PG_PORT` - PostgreSQL port
- `PG_USER` - PostgreSQL user
- `PG_PASSWORD` - PostgreSQL password
- `PG_DATABASE` - PostgreSQL database name
- `SESSION_TTL` - Session TTL in seconds (default: 86400)

## Building

```bash
cd tcp-auth-server
go mod download
go build -o tcp-auth-server .
```

## Running

```bash
./tcp-auth-server
```

Or with Docker:

```bash
docker-compose up tcp-auth-server
```

## Testing

Use the test client:

```bash
cd cmd/client
go build -o client .
./client localhost:9090
```

Example commands:
```
register testuser test@example.com password123
login testuser password123
validate <token>
refresh <token>
logout <token>
```

## Integration

The HTTP servers can validate tokens by:
1. Querying Redis directly (shared Redis instance)
2. Sending validation requests to the TCP server
3. Both (Redis for performance, TCP for consistency)


