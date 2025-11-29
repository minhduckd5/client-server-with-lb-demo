# VM IP Addresses
output "control_plane_ip" {
  description = "Control plane VM IP address"
  value       = local.vm_ips.control_plane
}

output "worker_ips" {
  description = "Worker VM IP addresses"
  value       = [local.vm_ips.worker_1, local.vm_ips.worker_2]
}

output "ops_ip" {
  description = "Ops/GitLab Runner VM IP address"
  value       = local.vm_ips.ops
}

output "monitoring_ip" {
  description = "Monitoring VM IP address"
  value       = local.vm_ips.monitoring
}

output "lb_ip" {
  description = "LB VM IP address (if created)"
  value       = local.vm_ips.lb
}

# All VM IPs (for Ansible inventory generation)
output "all_vm_ips" {
  description = "All VM IP addresses"
  value = {
    control_plane = local.vm_ips.control_plane
    workers       = [local.vm_ips.worker_1, local.vm_ips.worker_2]
    ops           = local.vm_ips.ops
    monitoring    = local.vm_ips.monitoring
    lb            = local.vm_ips.lb
  }
}

# SSH Connection Info
output "ssh_user" {
  description = "SSH username for VMs"
  value       = var.vm_ssh_user
}

output "ssh_connection_info" {
  description = "SSH connection information for all VMs"
  value = {
    control_plane = "${var.vm_ssh_user}@${local.vm_ips.control_plane}"
    workers       = ["${var.vm_ssh_user}@${local.vm_ips.worker_1}", "${var.vm_ssh_user}@${local.vm_ips.worker_2}"]
    ops           = "${var.vm_ssh_user}@${local.vm_ips.ops}"
    monitoring    = "${var.vm_ssh_user}@${local.vm_ips.monitoring}"
    lb            = var.create_lb_vm ? "${var.vm_ssh_user}@${local.vm_ips.lb}" : null
  }
}

# MetalLB Configuration
output "metallb_ip_pool" {
  description = "MetalLB IP pool range"
  value       = "${var.metallb_ip_pool_start}-${var.metallb_ip_pool_end}"
}

# K3s Kubeconfig path
output "kubeconfig_path" {
  description = "Path to kubeconfig file (on control plane)"
  value       = "/home/${var.vm_ssh_user}/.kube/config"
}


# Ansible Inventory (formatted for easy consumption)
output "ansible_inventory" {
  description = "Ansible inventory in INI format"
  value = <<-EOT
    [k3s_control]
    k3s-control-plane ansible_host=${local.vm_ips.control_plane}

    [k3s_workers]
    k3s-worker-1 ansible_host=${local.vm_ips.worker_1}
    k3s-worker-2 ansible_host=${local.vm_ips.worker_2}

    [k3s_nodes:children]
    k3s_control
    k3s_workers

    [ops]
    k3s-ops ansible_host=${local.vm_ips.ops}

    [monitoring]
    k3s-monitoring ansible_host=${local.vm_ips.monitoring}
    ${var.create_lb_vm ? "[lb]\nk3s-lb ansible_host=${local.vm_ips.lb}" : ""}

    [all:vars]
    ansible_user=${var.vm_ssh_user}
    # ansible_ssh_private_key_file=${var.vm_ssh_private_key_path}
    ansible_ssh_private_key_file=~/.ssh/insecure_private_key
    ansible_ssh_common_args='-o StrictHostKeyChecking=no'
  EOT
}

