---
title: "Hàm băm, mã hoá, ký số: đừng nhầm lẫn nữa"
description: "Phân biệt ba khái niệm nền tảng của mật mã học và khi nào dùng cái nào."
date: 2026-11-20
category: mat-ma
tags: [hash, aes, rsa, co-ban]
---

| Khái niệm | Mục đích | Có đảo ngược? | Ví dụ |
|---|---|---|---|
| Hàm băm | Toàn vẹn | Không | SHA-256, BLAKE3 |
| Mã hoá đối xứng | Bí mật | Có (cùng khoá) | AES-GCM, ChaCha20 |
| Mã hoá bất đối xứng | Trao khoá, ký số | Có (cặp khoá) | RSA, Ed25519 |

## Lưu mật khẩu

Không dùng SHA-256 trần. Hãy dùng hàm băm chậm có salt: **Argon2id**, scrypt hoặc bcrypt.

```python
from argon2 import PasswordHasher
ph = PasswordHasher()
h = ph.hash("matkhau")
ph.verify(h, "matkhau")
```
