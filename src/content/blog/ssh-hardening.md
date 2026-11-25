---
title: "Hardening SSH on a Linux server in 10 minutes"
description: "Disable password login, change risky defaults and add fail2ban to shrink the attack surface."
date: 2026-11-23
category: sysadmin
tags: [ssh, hardening, linux]
---

SSH is the front door of your server, so lock it down properly.

## Configure `sshd_config`

```bash
# /etc/ssh/sshd_config.d/99-hardening.conf
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
AllowUsers deploy
```

Check the syntax, then reload:

```bash
sudo sshd -t && sudo systemctl reload ssh
```

## Fail2ban

```bash
sudo apt install fail2ban
sudo systemctl enable --now fail2ban
```

> ⚠️ Always keep one SSH session open while testing a new configuration so you don't lock yourself out.
