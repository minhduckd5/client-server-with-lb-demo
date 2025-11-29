#!/bin/bash
#
# This script prepares the WSL environment for running Ansible against
# Vagrant VMs provisioned on a Windows host. It locates the correct
# Vagrant SSH key on the Windows filesystem and copies it into the
# WSL native filesystem with the correct permissions.

set -e # Exit immediately if a command exits with a non-zero status.

# --- CONFIGURATION ---
# This script assumes your Windows username is 'A'.
# This was determined from the path: c:\Users\A\.cursor\
# If it's different, change the value of WIN_USER.
WIN_USER="A"
# ---

# Define potential key locations on the Windows host filesystem, accessible from WSL
KEY_SOURCE_1="/mnt/c/Users/${WIN_USER}/.ssh/id_rsa"
KEY_SOURCE_2="/mnt/c/Users/${WIN_USER}/.vagrant.d/insecure_private_key"

# Define the destination for the key inside the WSL native filesystem
KEY_DEST_DIR="$HOME/.ssh"
KEY_DEST_PATH="${KEY_DEST_DIR}/insecure_private_key"

echo "INFO: Preparing WSL environment for Ansible..."

# Determine which key to use based on the Vagrantfile's preference
if [ -f "$KEY_SOURCE_1" ]; then
    echo "INFO: Found priority SSH key at: ${KEY_SOURCE_1}"
    SOURCE_KEY_TO_USE="${KEY_SOURCE_1}"
elif [ -f "$KEY_SOURCE_2" ]; then
    echo "INFO: Found fallback Vagrant insecure key at: ${KEY_SOURCE_2}"
    SOURCE_KEY_TO_USE="${KEY_SOURCE_2}"
else
    echo "ERROR: Cannot find a suitable private key." >&2
    echo "       Please check the following paths on your Windows host:" >&2
    echo "       1. ${KEY_SOURCE_1}" >&2
    echo "       2. ${KEY_SOURCE_2}" >&2
    echo "       Ensure Vagrant has been provisioned and keys are present." >&2
    exit 1
fi

# Create the .ssh directory in WSL if it doesn't exist
echo "INFO: Ensuring destination directory exists at ${KEY_DEST_DIR}"
mkdir -p "${KEY_DEST_DIR}"

# Copy the key and set the correct permissions
echo "INFO: Copying key to ${KEY_DEST_PATH} and setting permissions..."
cp "${SOURCE_KEY_TO_USE}" "${KEY_DEST_PATH}"
chmod 600 "${KEY_DEST_PATH}"

echo "SUCCESS: Environment is prepared."
echo "         Ansible will now use the key at ${KEY_DEST_PATH}."
echo "         You can now run the bootstrap playbook."
