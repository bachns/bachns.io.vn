---
title: "Checklist bảo mật cơ bản cho ứng dụng web"
description: "Danh sách nhanh các biện pháp phòng thủ dựa trên OWASP Top 10."
date: 2026-11-19
category: bao-mat
tags: [owasp, web, checklist]
---

## Xác thực & phiên

- Dùng MFA, băm mật khẩu bằng Argon2id.
- Cookie đặt `HttpOnly; Secure; SameSite=Lax`.

## Đầu vào & đầu ra

- Dùng prepared statement chống SQL injection.
- Escape đầu ra theo ngữ cảnh để chống XSS.

## Header khuyến nghị

```http
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```
