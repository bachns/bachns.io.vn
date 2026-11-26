---
title: "10 useful Linux one-liners"
description: "Simple, practical Linux commands I use every day to check logs, disk space, ports, processes, and config files."
date: 2026-11-22
updated: 2026-11-26
category: linux
tags: [bash, tips, cli, linux]
draft: false
---

You do not need complex scripts for routine server checks. Most daily questions on a Linux box can be answered in seconds with a short pipeline of standard tools.

## 1. Top 10 IPs by request count

Extract the client IP column from an NGINX or Apache access log, count occurrences, and list the heaviest hitters first:

```bash
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -n 10
```

## 2. Find the largest directories

Check which subdirectories are eating up `/var` (or `/`), sorted from largest to smallest while staying on the same filesystem (`-x`):

```bash
sudo du -xhd 1 /var 2>/dev/null | sort -rh | head -n 10
```

## 3. Check listening ports

List all TCP (`-t`) and UDP (`-u`) listening (`-l`) sockets with numeric port numbers (`-n`) and the process (`-p`) bound to each port:

```bash
sudo ss -tulpn
```

## 4. Find which process owns a specific port

Quickly check what is already occupying port `8080` when a service refuses to start with `address already in use`:

```bash
sudo lsof -i :8080
```

## 5. Top 10 processes by memory usage

Print a clean snapshot of the processes using the most RAM (swap `-%mem` with `-%cpu` to sort by CPU instead):

```bash
ps aux --sort=-%mem | head -n 11
```

## 6. Follow a filtered service log in real time

Tail a `systemd` unit live and highlight matching lines immediately without output buffering delays:

```bash
sudo journalctl -fu sshd | grep --line-buffered "Failed"
```

## 7. View a config file without comments or blank lines

Strip `#` comment lines and empty lines so you only see the active directives in a long configuration file:

```bash
grep -Ev '^\s*(#|$)' /etc/ssh/sshd_config
```

## 8. Search for a text string across config files

Search recursively (`-r`) inside a directory and print matching file paths along with line numbers (`-n`):

```bash
sudo grep -rn "proxy_pass" /etc/nginx/
```

## 9. Delete log files older than 30 days

Clean up rotated `.log` files that have not been modified in more than 30 days:

```bash
find /var/log/app -type f -name "*.log" -mtime +30 -delete
```

> [!TIP]
> Run the exact same `find` command **without** `-delete` first to preview the list of files before removing anything.

## 10. Test if a remote TCP port is reachable

Verify firewall rules and service reachability to another host without needing `telnet`:

```bash
nc -zv 10.0.0.15 5432
```
