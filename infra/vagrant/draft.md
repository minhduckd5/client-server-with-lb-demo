# MODIFY: Configure VM paths, network settings, and base box
# Vagrantfile for VMware Workstation
# This provisions 6 VMs for K3s cluster

Vagrant.configure("2") do |config|
  # Common configuration for all VMs
  # config.vm.provider "vmware_workstation" do |v|
    # v.gui = false
    # v.enable_vmrun = true
  # end

  # Base box configuration (Ubuntu 22.04)
  config.vm.box = "gutehall/ubuntu24-04"
  config.vm.box_version = "2024.11.21"

  # SSH configuration
  config.ssh.insert_key = false
  config.ssh.private_key_path = ["~/.ssh/id_rsa", "~/.vagrant.d/insecure_private_key"]
  config.ssh.forward_agent = true
  # MODIFIED: Increase connection timeout for bridged network DHCP assignment
  config.ssh.connect_timeout = 300

  # Control Plane VM
  config.vm.define "k3s-control-plane" do |control|
    control.vm.hostname = "k3s-control-plane"
    # MODIFIED: Use bridged networking - VMs get LAN IPs directly, no port forwarding needed
    # MODIFIED: Assign static bridged IP 192.168.1.200
    control.vm.network "public_network",
                       ip: "192.168.1.200",
                       bridge: ENV.fetch("VAGRANT_BRIDGE", "VMnet8"),
                       auto_config: true
    # MODIFIED: Explicitly disable port forwarding for bridged networking
    control.vm.network "forwarded_port", guest: 22, host: 2222, id: "ssh", disabled: true
    
    control.vm.provider "vmware_workstation" do |v|
      v.vmx["numvcpus"] = "2"
      v.vmx["memsize"] = "4096"
      v.vmx["displayName"] = "k3s-control-plane"
      # MODIFIED: Preserve PCI slot numbers to prevent networking conflicts
      v.vmx["ethernet0.pcislotnumber"] = "160"
      v.vmx["ethernet1.pcislotnumber"] = "224"
    end
  end

  # Worker Node 1
  config.vm.define "k3s-worker-1" do |worker1|
    worker1.vm.hostname = "k3s-worker-1"
    # MODIFIED: Use bridged networking - VMs get LAN IPs directly, no port forwarding needed
    # MODIFIED: Assign static bridged IP 192.168.1.201
    worker1.vm.network "public_network",
                       ip: "192.168.1.201",
                       bridge: ENV.fetch("VAGRANT_BRIDGE", "VMnet8"),
                       auto_config: true
    # MODIFIED: Explicitly disable port forwarding for bridged networking
    worker1.vm.network "forwarded_port", guest: 22, host: 2223, id: "ssh", disabled: true
    
    worker1.vm.provider "vmware_workstation" do |v|
      v.vmx["numvcpus"] = "2"
      v.vmx["memsize"] = "4096"
      v.vmx["displayName"] = "k3s-worker-1"
      # MODIFIED: Preserve PCI slot numbers to prevent networking conflicts
      v.vmx["ethernet0.pcislotnumber"] = "160"
      v.vmx["ethernet1.pcislotnumber"] = "224"
    end
  end

  # Worker Node 2
  config.vm.define "k3s-worker-2" do |worker2|
    worker2.vm.hostname = "k3s-worker-2"
    # MODIFIED: Use bridged networking - VMs get LAN IPs directly, no port forwarding needed
    # MODIFIED: Assign static bridged IP 192.168.1.202
    worker2.vm.network "public_network",
                      bridge: ENV.fetch("VAGRANT_BRIDGE", "VMnet8"),
                      ip: "192.168.1.202",
                      auto_config: true
    # MODIFIED: Explicitly disable port forwarding for bridged networking
    worker2.vm.network "forwarded_port", guest: 22, host: 2224, id: "ssh", disabled: true
    
    worker2.vm.provider "vmware_workstation" do |v|
      v.vmx["numvcpus"] = "2"
      v.vmx["memsize"] = "4096"
      v.vmx["displayName"] = "k3s-worker-2"
      # MODIFIED: Preserve PCI slot numbers to prevent networking conflicts
      v.vmx["ethernet0.pcislotnumber"] = "160"
      v.vmx["ethernet1.pcislotnumber"] = "224"
    end
  end

  # Ops/GitLab Runner VM
  config.vm.define "k3s-ops" do |ops|
    ops.vm.hostname = "k3s-ops"
    # MODIFIED: Use bridged networking - VMs get LAN IPs directly, no port forwarding needed
    # MODIFIED: Assign static bridged IP 192.168.1.203
    ops.vm.network "public_network",
                       bridge: ENV.fetch("VAGRANT_BRIDGE", "VMnet8"),
                       ip: "192.168.1.203",
                       auto_config: true
    # MODIFIED: Explicitly disable port forwarding for bridged networking
    ops.vm.network "forwarded_port", guest: 22, host: 2225, id: "ssh", disabled: true
    
    ops.vm.provider "vmware_workstation" do |v|
      v.vmx["numvcpus"] = "2"
      v.vmx["memsize"] = "4096"
      v.vmx["displayName"] = "k3s-ops"
      # MODIFIED: Preserve PCI slot numbers to prevent networking conflicts
      v.vmx["ethernet0.pcislotnumber"] = "160"
      v.vmx["ethernet1.pcislotnumber"] = "224"
    end
  end

  # Monitoring VM
  config.vm.define "k3s-monitoring" do |monitoring|
    monitoring.vm.hostname = "k3s-monitoring"
    # MODIFIED: Use bridged networking - VMs get LAN IPs directly, no port forwarding needed
    # MODIFIED: Assign static bridged IP 192.168.1.204
    monitoring.vm.network "public_network",
                       ip: "192.168.1.204",
                       bridge: ENV.fetch("VAGRANT_BRIDGE", "VMnet8"),
                       auto_config: true
    # MODIFIED: Explicitly disable port forwarding for bridged networking
    monitoring.vm.network "forwarded_port", guest: 22, host: 2226, id: "ssh", disabled: true
    
    monitoring.vm.provider "vmware_workstation" do |v|
      v.vmx["numvcpus"] = "2"
      v.vmx["memsize"] = "4096"
      v.vmx["displayName"] = "k3s-monitoring"
      # MODIFIED: Preserve PCI slot numbers to prevent networking conflicts
      v.vmx["ethernet0.pcislotnumber"] = "160"
      v.vmx["ethernet1.pcislotnumber"] = "224"
    end
  end

  # Optional LB VM
  if ENV["CREATE_LB_VM"] == "true"
    config.vm.define "k3s-lb" do |lb|
      lb.vm.hostname = "k3s-lb"
      # MODIFIED: Use bridged networking - VMs get LAN IPs directly, no port forwarding needed
      # MODIFIED: Assign static bridged IP 192.168.1.205
      lb.vm.network "public_network",
                       ip: "192.168.1.205",
                       bridge: ENV.fetch("VAGRANT_BRIDGE", "VMnet8"),
                       auto_config: true
      # MODIFIED: Explicitly disable port forwarding for bridged networking
      lb.vm.network "forwarded_port", guest: 22, host: 2227, id: "ssh", disabled: true
      
      lb.vm.provider "vmware_workstation" do |v|
        v.vmx["numvcpus"] = "1"
        v.vmx["memsize"] = "2048"
        v.vmx["displayName"] = "k3s-lb"
        # MODIFIED: Preserve PCI slot numbers to prevent networking conflicts
        v.vmx["ethernet0.pcislotnumber"] = "160"
        v.vmx["ethernet1.pcislotnumber"] = "224"
      end
    end
  end

  # Provision all VMs with initial setup
  config.vm.provision "shell", inline: <<-SHELL
    # MODIFIED: Optimized provisioning - skip full upgrade for faster setup
    export DEBIAN_FRONTEND=noninteractive
    
    # Update package lists only (skip upgrade for speed)
    sudo apt-get update -qq
    
    # Install openssh-server FIRST to ensure SSH is available
    sudo apt-get install -y -qq openssh-server
    
    # Install remaining basic packages in one command
    sudo apt-get install -y -qq curl wget vim net-tools
    
    # Configure SSH
    sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    sudo sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
    sudo systemctl restart sshd
    
    # Optional: Run upgrade only if explicitly requested (takes 10-15 min)
    if [ "$UPGRADE_VMS" = "true" ]; then
      echo "Running full system upgrade (this may take 10-15 minutes)..."
      sudo apt-get upgrade -y
    fi
  SHELL
end

