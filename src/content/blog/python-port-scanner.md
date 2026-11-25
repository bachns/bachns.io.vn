---
title: "Viết port scanner đa luồng bằng Python"
description: "Xây dựng một TCP port scanner đơn giản với socket và ThreadPoolExecutor."
date: 2026-11-21
category: lap-trinh
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

Cách này chạy ổn cho mục đích học; với quét thật hãy dùng `nmap` hoặc `masscan`.
