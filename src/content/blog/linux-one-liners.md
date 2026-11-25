---
title: "10 useful Linux one-liners"
description: "One-liners I use every day to handle logs, files and networking."
date: 2026-11-22
category: linux
tags: [bash, tips, cli]
---

## 1. Top 10 IPs by request count

```bash
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head
```

## 2. Find large files

```bash
du -ah / 2>/dev/null | sort -rh | head -20
```

## 3. Listening ports

```bash
ss -tulpn
```

## 4. Follow a filtered log in real time

```bash
journalctl -fu ssh | grep --line-buffered "Failed"
```
