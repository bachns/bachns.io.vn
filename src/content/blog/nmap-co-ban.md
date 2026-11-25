---
title: "Nmap cơ bản: quét cổng và nhận diện dịch vụ"
description: "Các lệnh Nmap thường dùng khi khảo sát hệ thống trong lab của riêng bạn."
date: 2026-11-24
category: hacking
tags: [nmap, recon, pentest]
---

Nmap là công cụ không thể thiếu ở giai đoạn **reconnaissance**.

## Quét nhanh

```bash
nmap -T4 -F 192.168.56.101
```

## Quét toàn bộ cổng và nhận diện phiên bản

```bash
nmap -p- -sV -sC -oA scan_full 192.168.56.101
```

| Cờ | Ý nghĩa |
|----|---------|
| `-p-` | Quét 65535 cổng |
| `-sV` | Nhận diện phiên bản dịch vụ |
| `-sC` | Chạy script mặc định |
| `-oA` | Xuất mọi định dạng |

> Chỉ quét các máy bạn sở hữu hoặc có sự cho phép.
