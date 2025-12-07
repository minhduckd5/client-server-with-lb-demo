# Chaos Engineering Tools

This directory contains configurations and instructions for testing the system's resilience using various Chaos Engineering tools.

## Tools Included

1.  **Kube-Monkey**: Chaos Monkey for Kubernetes. Kills pods randomly to test recovery.
2.  **Pumba**: Chaos testing for Docker containers. Can kill, stop, or introduce network delays to containers.
3.  **Toxiproxy**: A TCP proxy to simulate network and system conditions (latency, connection refused, etc.) between specific services.
4.  **Muxy**: Simulating real-world distributed system failures.
5.  **Chaos Monkey**: (Note) The original tool by Netflix is typically for cloud VM instances (AWS EC2). For Kubernetes, **Kube-Monkey** is the standard equivalent. For Docker, **Pumba** is recommended.

## Prerequisites

-   **Kubernetes Cluster** (for Kube-Monkey)
-   **Docker & Docker Compose** (for Pumba, Toxiproxy)



