---
title: "Writing a multithreaded port scanner in Python"
description: "Build a simple TCP port scanner with socket and ThreadPoolExecutor."
date: 2026-11-21
category: programming
tags: [python, socket, tools]
---

```python
import socket
from concurrent.futures import ThreadPoolExecutor

def check(host: str, port: int) -> int | None:
    with socket.socket() as s:
        s.settimeout(0.5)
        return port if s.connect_ex((host, port)) == 0 else None

def scan(host: str, ports=range(1, 1025)):
    with ThreadPoolExecutor(max_workers=200) as ex:
        return [p for p in ex.map(lambda p: check(host, p), ports) if p]

if __name__ == "__main__":
    print(scan("127.0.0.1"))
```

This is meant for learning and for checking hosts you own or administer.
