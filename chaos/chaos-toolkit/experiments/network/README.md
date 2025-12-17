# Network Layer Chaos Experiments

This directory contains Application Layer (HTTP) chaos experiments that target client-server communication **after** the Ingress/Reverse Proxy layer.

## 🎯 Purpose

Test application-level resilience mechanisms:
- **Client Retry Logic**: Does the client automatically retry failed requests?
- **Circuit Breaker**: Does the client implement circuit breaker patterns?
- **Load Balancer Health Checks**: Does the Load Balancer (nginx) remove slow/unhealthy pods from the pool?
- **Timeout Handling**: How does the system handle requests that exceed timeout thresholds?

## 📁 Experiments

### 1. HTTP Delay & Error Injection
**File:** `http-delay-error.json`

Combines two attack vectors:
- **50% of requests** receive a **5-second delay** (tests timeout/retry behavior)
- **10% of requests** receive a **500 Internal Server Error** (tests error handling)

**Target:** All nginx reverse proxy pods (`app=nginx-reverse-proxy`)
**Path:** `/api/*` (all API endpoints)
**Duration:** 60 seconds

**What to Observe:**
- Monitor client logs for retry attempts
- Check if nginx removes slow pods from upstream pool
- Verify if client implements exponential backoff
- Check if circuit breaker opens after repeated failures

```bash
chaos run experiments/network/http-delay-error.json
```

## 🔧 Technical Details

**Tool:** Chaos Mesh `HTTPChaos` CRD
- Uses eBPF to intercept HTTP traffic at the kernel level
- No sidecar injection required (runs transparently)
- Targets pods via label selectors

**Chaos Mesh HTTPChaos Structure:**
- `mode: all` - Affects all matching pods
- `target: Request` - Intercepts incoming HTTP requests
- `rules[]` - Array of rules with percentage-based matching
- `percentage` - Percentage of requests to affect (0-100)

## 📊 Expected Behavior

### Healthy System Should:
1. **Client Side:**
   - Implement retry logic with exponential backoff
   - Have timeout configuration > 5s or handle gracefully
   - Log retry attempts and failures

2. **Load Balancer (nginx):**
   - Detect slow upstream servers via `max_fails` and `fail_timeout`
   - Remove unhealthy pods from rotation
   - Log upstream errors

3. **System:**
   - Maintain availability despite 50% delayed requests
   - Handle 10% error rate without cascading failures
   - Recover quickly after chaos injection stops

### Red Flags:
- Client crashes or hangs
- No retry logic visible
- Load balancer doesn't remove slow pods
- Cascading failures across services




