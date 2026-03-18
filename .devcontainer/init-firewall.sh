#!/bin/bash
set -euo pipefail  # Exit on error, undefined vars, and pipeline failures
IFS=$'\n\t'       # Stricter word splitting

# Firewall is disabled - all traffic is allowed
echo "Firewall is disabled - all network traffic is allowed"

# Set default policies to ACCEPT (allow all traffic)
iptables -P INPUT ACCEPT
iptables -P FORWARD ACCEPT
iptables -P OUTPUT ACCEPT

# Flush any existing rules to ensure clean state
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
iptables -t mangle -F
iptables -t mangle -X

echo "Firewall disabled successfully - all network connections are allowed"
