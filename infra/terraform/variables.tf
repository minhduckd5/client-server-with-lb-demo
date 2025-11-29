# VM Configuration Variables
variable "vm_domain" {
  description = "Domain name for VMs"
  type        = string
  default     = "k3s.local"
}

variable "vm_ssh_user" {
  description = "SSH username for VMs"
  type        = string
  default     = "vagrant"
}

variable "vm_ssh_private_key_path" {
  description = "Path to SSH private key"
  type        = string
  default     = "~/.vagrant.d/insecure_private_key"
}

# MetalLB Configuration
variable "metallb_ip_pool_start" {
  description = "MetalLB IP pool start address"
  type        = string
  default     = "192.168.100.240"
}

variable "metallb_ip_pool_end" {
  description = "MetalLB IP pool end address"
  type        = string
  default     = "192.168.100.250"
}

# Optional LB VM
variable "create_lb_vm" {
  description = "Create optional LB VM"
  type        = bool
  default     = false
}
