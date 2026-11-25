---
title: "Nmap basics: port scanning and service detection"
description: "Commonly used Nmap commands for surveying systems in your own lab."
date: 2026-11-24
category: hacking
tags: [nmap, recon, pentest]
---

Nmap is an essential tool in the **reconnaissance** phase.

## Quick scan

```bash
nmap -T4 -F 192.168.56.101
```

## Scan all ports and detect versions

```bash
nmap -p- -sV -sC -oA scan_full 192.168.56.101
```

| Flag | Meaning |
|------|---------|
| `-p-` | Scan all 65535 ports |
| `-sV` | Detect service versions |
| `-sC` | Run default scripts |
| `-oA` | Output in all formats |

> Only scan machines you own or have permission to test.
