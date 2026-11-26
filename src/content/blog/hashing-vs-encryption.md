---
title: "Hashing, encryption, signing: stop mixing them up"
description: "How to tell three basic cryptography ideas apart, and when to use each."
date: 2026-11-20
category: cryptography
tags: [hash, aes, rsa, basics]
---

| Concept | Purpose | Reversible? | Examples |
|---|---|---|---|
| Hash function | Integrity | No | SHA-256, BLAKE3 |
| Symmetric encryption | Confidentiality | Yes (same key) | AES-GCM, ChaCha20 |
| Asymmetric cryptography | Key exchange, signatures | Yes (key pair) | RSA, Ed25519 |

## Storing passwords

Don't use plain SHA-256. Use a slow, salted hash: **Argon2id**, scrypt or bcrypt.

```python
from argon2 import PasswordHasher
ph = PasswordHasher()
h = ph.hash("password")
ph.verify(h, "password")
```
