---
title: "10 lệnh một dòng hữu ích trên Linux"
description: "Những one-liner mình dùng hằng ngày để xử lý log, file và mạng."
date: 2026-11-22
category: linux
tags: [bash, tips, cli]
---

## 1. Top 10 IP truy cập nhiều nhất

```bash
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head
```

## 2. Tìm file lớn

```bash
du -ah / 2>/dev/null | sort -rh | head -20
```

## 3. Cổng đang lắng nghe

```bash
ss -tulpn
```

## 4. Giám sát log realtime có lọc

```bash
journalctl -fu ssh | grep --line-buffered "Failed"
```
