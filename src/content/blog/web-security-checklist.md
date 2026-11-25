---
title: "A basic security checklist for web applications"
description: "A quick list of defensive measures based on the OWASP Top 10."
date: 2026-11-19
category: security
tags: [owasp, web, checklist]
---

## Authentication & sessions

- Use MFA and hash passwords with Argon2id.
- Set cookies with `HttpOnly; Secure; SameSite=Lax`.

## Input & output

- Use prepared statements to prevent SQL injection.
- Escape output by context to prevent XSS.

## Recommended headers

```http
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```
