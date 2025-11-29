# MODIFY: This file now uses Vagrant for VM provisioning
# Terraform is used for generating outputs and managing inventory
# VMs are provisioned via Vagrant (see infra/vagrant/Vagrantfile)

terraform {
  required_version = ">= 1.5.0"
  
  # MODIFY: configure backend (local for now, can be changed to remote)
  backend "local" {
    path = "terraform.tfstate"
  }

  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.1"
    }
  }
}

# Local values for VM configuration
locals {
  vm_ips = {
    control_plane = "192.168.1.200"
    worker_1      = "192.168.1.201"
    worker_2      = "192.168.1.202"
    ops           = "192.168.1.203"
    monitoring    = "192.168.1.204"
    lb            = var.create_lb_vm ? "192.168.1.205" : null
  }
  
  vm_names = {
    control_plane = "k3s-control-plane"
    worker_1      = "k3s-worker-1"
    worker_2      = "k3s-worker-2"
    ops           = "k3s-ops"
    monitoring    = "k3s-monitoring"
    lb            = "k3s-lb"
  }
}

# Null resource to trigger Vagrant provisioning
resource "null_resource" "vagrant_up" {
  triggers = {
    vagrantfile_hash = filemd5("${path.module}/../vagrant/Vagrantfile")
  }

  provisioner "local-exec" {
    command = <<-EOT
      cd ${path.module}/../vagrant
      CREATE_LB_VM=${var.create_lb_vm} vagrant up --provider=vmware_workstation
      # vagrant up --provider=vmware_workstation
    EOT
  }

  provisioner "local-exec" {
    when    = destroy
    command = <<-EOT
      cd ${path.module}/../vagrant
      vagrant destroy -f
    EOT
  }
}

# # --- START MODIFICATION ---
# # Added local_file resource to generate Ansible inventory
# # --- END MODIFICATION ---
# resource "local_file" "ansible_inventory" {
#   content = <<-EOT
#     [k3s_control]
#     k3s-control-plane ansible_host=${local.vm_ips.control_plane}

#     [k3s_workers]
#     k3s-worker-1 ansible_host=${local.vm_ips.worker_1}
#     k3s-worker-2 ansible_host=${local.vm_ips.worker_2}

#     [k3s_nodes:children]
#     k3s_control
#     k3s_workers

#     [ops]
#     k3s-ops ansible_host=${local.vm_ips.ops}

#     [monitoring]
#     k3s-monitoring ansible_host=${local.vm_ips.monitoring}
#     ${var.create_lb_vm ? "[lb]\nk3s-lb ansible_host=${local.vm_ips.lb}" : ""}

#     [all:vars]
#     ansible_user=${var.vm_ssh_user}
#     ansible_ssh_private_key_file=${var.vm_ssh_private_key_path}
#     ansible_ssh_common_args='-o StrictHostKeyChecking=no'
#   EOT

#   filename = "${path.module}/../ansible/inventory.ini"

#   depends_on = [null_resource.vagrant_up]
# }
