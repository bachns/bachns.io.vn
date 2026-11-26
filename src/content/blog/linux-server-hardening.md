---
title: "Hardening a Linux server in 10 minutes"
description: "A practical first-boot security baseline for Debian/Ubuntu and RHEL/Rocky Linux: SSH key-only access, default-deny firewalls, SELinux/AppArmor, automatic patches, Fail2ban, and sysctl tuning."
date: 2026-11-23
updated: 2026-11-26
category: security
tags: [hardening, linux, ssh, firewall, selinux, sysadmin]
draft: false
---

A freshly provisioned cloud VM or bare-metal Linux host starts attracting automated SSH brute-force and port scans within seconds of getting a public IP. Before deploying any workload, spending ten minutes on a repeatable security baseline eliminates the vast majority of opportunistic compromises.

## 1. Create a Non-Root Admin User and Lock `root`

Avoid logging in directly as `root` for daily administration. Create a dedicated admin account, grant `sudo` privileges, install an **Ed25519** SSH public key, and lock password login on `root`:

```bash
# Debian / Ubuntu
sudo adduser ops
sudo usermod -aG sudo ops

# RHEL / Rocky Linux
sudo useradd -m -s /bin/bash ops
sudo passwd ops
sudo usermod -aG wheel ops
```

Install your SSH public key with strict permissions (`0700` on `~/.ssh`, `0600` on `authorized_keys`) and lock the `root` password:

```bash
sudo install -d -m 0700 -o ops -g ops /home/ops/.ssh
sudo install -m 0600 -o ops -g ops /path/to/id_ed25519.pub /home/ops/.ssh/authorized_keys
sudo passwd -l root
```

## 2. Harden OpenSSH (`sshd_config.d`)

Place overrides in `/etc/ssh/sshd_config.d/99-hardening.conf` instead of editing `/etc/ssh/sshd_config` directly so package upgrades never trigger interactive merge prompts:

```bash
# /etc/ssh/sshd_config.d/99-hardening.conf
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
AuthenticationMethods publickey
MaxAuthTries 3
LoginGraceTime 20
X11Forwarding no
AllowTcpForwarding no
AllowUsers ops
```

Validate the configuration syntax first, then reload the SSH daemon:

```bash
# Debian / Ubuntu
sudo sshd -t && sudo systemctl reload ssh

# RHEL / Rocky Linux
sudo sshd -t && sudo systemctl reload sshd
```

> [!WARNING]
> Always keep your current SSH session open in one terminal tab and test logging in as `ops` from a **new** terminal window before closing it, so a typo or missing key never locks you out.

## 3. Enforce a Default-Deny Host Firewall

Expose only the exact ports the host needs to serve.

On **Debian / Ubuntu (`ufw`)**:

```bash
sudo apt-get update && sudo apt-get install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw limit 22/tcp comment 'SSH rate-limited'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw --force enable
sudo ufw status verbose
```

On **RHEL / Rocky Linux (`firewalld`)**:

```bash
sudo systemctl enable --now firewalld
sudo firewall-cmd --permanent --zone=public --remove-service=cockpit
sudo firewall-cmd --permanent --zone=public --add-service=ssh
sudo firewall-cmd --permanent --zone=public --add-service=https
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

## 4. Enable Unattended Security Patches

Unpatched userland daemons and kernel vulnerabilities remain a top initial-access vector. Automate security-only updates so critical CVEs get patched promptly.

On **Debian / Ubuntu**:

```bash
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
systemctl status unattended-upgrades --no-pager
```

On **RHEL / Rocky Linux**:

```bash
sudo dnf install -y dnf-automatic
sudo sed -i 's/^upgrade_type.*/upgrade_type = security/' /etc/dnf/automatic.conf
sudo sed -i 's/^apply_updates.*/apply_updates = yes/' /etc/dnf/automatic.conf
sudo systemctl enable --now dnf-automatic.timer
```

## 5. Block Scanners with Fail2ban

Even with password authentication disabled, banning aggressive scanners cuts log noise and connection slot churn. Drop a local jail configuration into `/etc/fail2ban/jail.d/sshd.local`:

```ini
[sshd]
enabled  = true
backend  = systemd
maxretry = 3
findtime = 10m
bantime  = 1h
```

Enable the service and verify the jail is active:

```bash
# On RHEL / Rocky Linux, enable EPEL first: sudo dnf install -y epel-release
sudo apt-get install -y fail2ban   # or: sudo dnf install -y fail2ban
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd
```

## 6. Keep SELinux (or AppArmor) in Enforcing Mode

Disabling Mandatory Access Control is one of the most common mistakes on Enterprise Linux servers. Even if a public-facing daemon (like NGINX, PHP-FPM, or a container runtime) is exploited, **SELinux** confines the process to its own domain (`httpd_t`, `sshd_t`, `container_t`) and blocks lateral movement.

On **RHEL / Rocky Linux (`SELinux`)**, verify `Enforcing` mode is active both at runtime and across reboots:

```bash
getenforce                  # Should output: Enforcing
sestatus
sudo setenforce 1
sudo sed -i 's/^SELINUX=.*/SELINUX=enforcing/' /etc/selinux/config
```

Instead of running `setenforce 0` when a service hits a permission denial, fix the specific label, boolean, or port rule:

```bash
# 1. Restore default file contexts after moving files into /var/www or /etc
sudo restorecon -Rv /var/www/html

# 2. Allow NGINX / Apache to connect to upstream backend ports
sudo setsebool -P httpd_can_network_connect 1

# 3. Allow sshd on a non-standard port (requires policycoreutils-python-utils)
sudo semanage port -a -t ssh_port_t -p tcp 2222

# 4. Inspect recent SELinux AVC denials
sudo ausearch -m AVC -ts recent
```

On **Debian / Ubuntu (`AppArmor`)**, ensure AppArmor is running and profiles are enforced:

```bash
sudo systemctl enable --now apparmor
sudo aa-status
```

## 7. Kernel and Network Stack Baseline (`sysctl`)

Tighten spoof protection, disable ICMP redirects, enable SYN cookies, and restrict unprivileged access to kernel pointers and `dmesg` buffers:

```ini
# /etc/sysctl.d/99-hardening.conf
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
kernel.kptr_restrict = 2
kernel.dmesg_restrict = 1
fs.protected_hardlinks = 1
fs.protected_symlinks = 1
```

Load the settings immediately without rebooting:

```bash
sudo sysctl --system
```

> [!TIP]
> If the server will run Kubernetes, Docker bridge routing, or act as a VPN gateway, leave `net.ipv4.ip_forward = 1` managed in a separate drop-in file (such as `98-k8s.conf`) rather than hardcoding `ip_forward = 0` in your base profile.

## 8. Audit Listening Services and Time Sync

Finish with a quick check for unexpected listening sockets and accurate NTP clock synchronization (essential for TLS validation, TOTP MFA, and correlating security logs):

```bash
# 1. Confirm no unexpected daemons are bound to 0.0.0.0 or [::]
sudo ss -tulpn

# 2. Verify NTP clock synchronization
timedatectl status
```

If an unnecessary service (such as `rpcbind`, `cups`, or `avahi-daemon`) is listening on a server image, mask and stop it right away with `sudo systemctl disable --now <service>`.
