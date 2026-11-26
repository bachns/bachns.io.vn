---
title: "A basic security checklist for web applications"
description: "A short list of ways to protect your web app, based on the OWASP Top 10."
date: 2026-11-19
category: security
tags: [owasp, web, checklist]
---

## Login & sessions

- Use MFA and hash passwords with Argon2id.
- Set cookies with `HttpOnly; Secure; SameSite=Lax`.

## Input & output

- Use prepared statements to prevent SQL injection.
- Escape data before you show it on a page, to stop XSS.

## Recommended headers

```http
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```
