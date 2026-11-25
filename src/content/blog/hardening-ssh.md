---
title: "Hardening SSH trên Linux server trong 10 phút"
description: "Tắt đăng nhập bằng mật khẩu, đổi cấu hình mặc định và thêm fail2ban để giảm bề mặt tấn công."
date: 2026-11-23
category: sysadmin
tags: [ssh, hardening, linux]
---

SSH là cửa chính của server, nên hãy khoá cho chặt.

## Cấu hình `sshd_config`

```bash
# /etc/ssh/sshd_config.d/99-hardening.conf
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
AllowUsers deploy
```

Kiểm tra cú pháp rồi reload:

```bash
sudo sshd -t && sudo systemctl reload ssh
```

## Fail2ban

```bash
sudo apt install fail2ban
sudo systemctl enable --now fail2ban
```

> ⚠️ Luôn giữ một phiên SSH đang mở khi thử cấu hình mới để tránh tự khoá mình.
