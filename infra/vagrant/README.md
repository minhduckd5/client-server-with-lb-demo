# Vagrant Configuration for VMware Workstation

This directory contains Vagrant configuration for provisioning VMs on VMware Workstation.

## Prerequisites

1. **VMware Workstation Pro** (version 12 or later)
2. **Vagrant** (version 2.2.0 or later)
3. **Vagrant VMware Utility** plugin:
   ```bash
   vagrant plugin install vagrant-vmware-desktop
   ```

## VM Configuration

The Vagrantfile provisions 6 VMs:

- **k3s-control-plane**: Control plane node (192.168.100.10)
- **k3s-worker-1**: Worker node 1 (192.168.100.11)
- **k3s-worker-2**: Worker node 2 (192.168.100.12)
- **k3s-ops**: Ops/GitLab Runner VM (192.168.100.13)
- **k3s-monitoring**: Monitoring VM (192.168.100.14)
- **k3s-lb**: Optional LB VM (192.168.100.15) - set CREATE_LB_VM=true

## Usage

### Start all VMs

```bash
cd infra/vagrant
vagrant up
```

### Start specific VM

```bash
vagrant up k3s-control-plane
```

### Stop all VMs

```bash
vagrant halt
```

### Destroy all VMs

```bash
vagrant destroy
```

### SSH into a VM

```bash
vagrant ssh k3s-control-plane
```

### Generate Ansible inventory

After VMs are up, generate inventory:

```bash
vagrant ssh-config > ../ansible/vagrant-ssh-config
cd ../ansible
python3 generate-inventory.py
```

## Network Configuration

VMs use private network with static IPs in the 192.168.100.0/24 range. Adjust IPs in the Vagrantfile if needed.

## Troubleshooting

- **VMware plugin not found**: Install `vagrant-vmware-desktop` plugin
- **Network conflicts**: Adjust IP addresses in Vagrantfile
- **VM won't start**: Check VMware Workstation is running and licensed

