---
title: "Adding Trusted Root CA Certificates (Trust Anchors) on Linux"
description: "How to properly install, verify, and remove custom Root CA certificates across RHEL/Rocky/Oracle Linux, Debian/Ubuntu, Alpine, SUSE, Arch, and language-specific runtimes."
date: 2026-11-26
category: sysadmin
tags: [pki, tls, linux, openssl, ca-certificates]
draft: false
---

When operating internal infrastructure - such as private PKI hierarchies, HashiCorp Vault PKI, EJBCA, Harbor registries, or internal HTTPS endpoints - disabling TLS verification (`curl -k`, `GIT_SSL_NO_VERIFY=true`, `NODE_TLS_REJECT_UNAUTHORIZED=0`) turns encryption into theater and exposes traffic to active MITM attacks.

The right fix is to add your organization's **Root CA certificate** as a system-wide **trust anchor** so standard TLS clients trust certificates chained to your CA automatically.

## 1. Inspect & Normalize the Certificate First

Linux trust store utilities expect **PEM-encoded X.509** certificates (Base64 ASCII blocks starting with `-----BEGIN CERTIFICATE-----`), containing **one CA certificate per file**.

Before copying anything into `/etc` or `/usr/local`, inspect the file to confirm it is valid PEM and actually a CA certificate (`CA:TRUE`):

```bash
openssl x509 -in rootcag2.crt -noout -subject -issuer -dates -ext basicConstraints
```

Expected output for a Root CA:

```text
subject=C = VN, O = Example Corp, CN = Example Root CA G2
issuer=C = VN, O = Example Corp, CN = Example Root CA G2
notBefore=Jan  1 00:00:00 2025 GMT
notAfter=Jan  1 00:00:00 2035 GMT
X509v3 Basic Constraints: critical
    CA:TRUE
```

If `openssl` fails with `unable to load certificate`, your file is likely binary **DER** (`.cer` / `.der`). Convert it to PEM first:

```bash
openssl x509 -inform DER -in rootcag2.cer -out rootcag2.crt
```

> [!WARNING]
> **Permissions matter:** Always install anchor files with mode `0644` (`root:root`). Copying a certificate created under a restrictive `umask` (like `0077`) leaves it `0600`, causing non-root services (`nginx`, `prometheus`, `systemd` dynamic users) to fail TLS verification with mysterious permission or unknown-CA errors. Using `install -m 0644` instead of `cp` avoids this pitfall completely.

## 2. Quick Reference by Distribution

| Distribution Family | Trust Anchor Directory | File Rule | Update Command | Compiled System Bundle |
|---|---|---|---|---|
| **RHEL, Rocky, Alma, CentOS, Oracle, Fedora** | `/etc/pki/ca-trust/source/anchors/` | `.crt` or `.pem` | `sudo update-ca-trust` | `/etc/pki/tls/certs/ca-bundle.crt` |
| **Debian, Ubuntu** | `/usr/local/share/ca-certificates/` | Must end in `.crt` | `sudo update-ca-certificates` | `/etc/ssl/certs/ca-certificates.crt` |
| **Alpine Linux** | `/usr/local/share/ca-certificates/` | Must end in `.crt` | `sudo update-ca-certificates` | `/etc/ssl/certs/ca-certificates.crt` |
| **SUSE / openSUSE (SLES)** | `/etc/pki/trust/anchors/` | `.crt` or `.pem` | `sudo update-ca-certificates` | `/var/lib/ca-certificates/ca-bundle.pem` |
| **Arch Linux** | `/etc/ca-certificates/trust-source/anchors/` | `.crt` | `sudo trust extract-compat` | `/etc/ca-certificates/extracted/tls-ca-bundle.pem` |

## 3. Installing the Trust Anchor

### Rocky Linux, RHEL, AlmaLinux, CentOS & Oracle Linux

Enterprise Linux distributions use `p11-kit` and `update-ca-trust` to generate unified bundles for OpenSSL, GnuTLS, NSS, and system OpenJDK:

```bash
sudo dnf install -y ca-certificates
sudo install -o root -g root -m 0644 rootcag2.crt /etc/pki/ca-trust/source/anchors/rootcag2.crt
sudo update-ca-trust
```

Alternatively, `p11-kit` provides a native CLI that writes directly to the anchor store and rebuilds trust bundles in one step:

```bash
sudo trust anchor --store rootcag2.crt
```

### Debian & Ubuntu

On Debian-based systems, `update-ca-certificates` scans `/usr/local/share/ca-certificates/`. Note two strict rules:

1. The filename **must end with `.crt`** (files ending in `.pem` or `.cer` are silently ignored).
2. Each `.crt` file should contain **a single certificate** (if you have a Root + Intermediate chain, split them into two separate `.crt` files).

```bash
sudo apt-get update && sudo apt-get install -y ca-certificates
sudo install -o root -g root -m 0644 rootcag2.crt /usr/local/share/ca-certificates/rootcag2.crt
sudo update-ca-certificates
```

Verify the command output reports **`1 added`**:

```text
Updating certificates in /etc/ssl/certs...
1 added, 0 removed; done.
```

### Alpine Linux (Containers & Minimal VMs)

Minimal Alpine container images often ship without full `ca-certificates` utilities installed:

```dockerfile
FROM alpine:3.21
RUN apk add --no-cache ca-certificates
COPY rootcag2.crt /usr/local/share/ca-certificates/rootcag2.crt
RUN chmod 0644 /usr/local/share/ca-certificates/rootcag2.crt && update-ca-certificates
```

### SUSE / openSUSE & Arch Linux

On **SLES / openSUSE**:

```bash
sudo install -o root -g root -m 0644 rootcag2.crt /etc/pki/trust/anchors/rootcag2.crt
sudo update-ca-certificates
```

On **Arch Linux**:

```bash
sudo trust anchor --store rootcag2.crt
# Or manually:
sudo install -o root -g root -m 0644 rootcag2.crt /etc/ca-certificates/trust-source/anchors/rootcag2.crt
sudo trust extract-compat
```

## 4. Verifying Trust End-to-End

First, confirm the CA is registered in the system trust store:

```bash
# On systems with p11-kit (RHEL, Fedora, Arch, modern Ubuntu/Debian)
trust list | grep -A2 -i "Example Root CA"

# Or check the compiled OpenSSL bundle directly
openssl crl2pkcs7 -nocrl -certfile /etc/ssl/certs/ca-certificates.crt \
  | openssl pkcs7 -print_certs -noout | grep -i "Example Root CA"
```

Next, test an actual TLS handshake against an internal endpoint signed by your CA:

```bash
openssl s_client -connect internal.example.com:443 -servername internal.example.com </dev/null
```

Look for `Verify return code: 0 (ok)` at the bottom of the output, then confirm with `curl`:

```bash
curl -Iv https://internal.example.com
```

> [!TIP]
> If `openssl s_client` returns `unable to verify the first certificate` (`code 20` or `21`) even after adding the Root CA, the remote server is likely **missing its Intermediate CA certificate** in its TLS chain (`fullchain.pem`). Fix the server configuration so it sends `leaf + intermediate`, rather than pinning intermediates on every client.

## 5. Runtimes That Ignore the OS Trust Store

Updating the OS trust bundle covers OpenSSL, GnuTLS, `curl`, `wget`, `git`, Go (`crypto/tls`), and systemd. However, several application runtimes bundle their own CA stores by default:

### Java (JVM `cacerts`)

System OpenJDK packages on RHEL/Rocky and Debian/Ubuntu usually symlink `cacerts` to the OS store via `p11-kit` or `ca-certificates-java`. However, standalone JDK tarballs (Eclipse Temurin, Oracle JDK, GraalVM) maintain an isolated keystore:

```bash
sudo keytool -importcert -trustcacerts \
  -alias rootcag2 \
  -file rootcag2.crt \
  -keystore "$JAVA_HOME/lib/security/cacerts" \
  -storepass changeit -noprompt
```

### Node.js

Node.js compiles Mozilla's root store directly into the binary. Pass `--use-openssl-ca` or append your CA via `NODE_EXTRA_CA_CERTS`:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
# On RHEL/Rocky: /etc/pki/tls/certs/ca-bundle.crt
```

### Python (`requests` / `httpx` / `certifi`)

Libraries built on `certifi` ignore `/etc/ssl/certs` by default unless pointed to the system bundle:

```bash
export SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
export REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
```

*(Alternatively, on Python 3.10+, use the [`truststore`](https://pypi.org/project/truststore/) package to delegate verification to native OS trust APIs).*

### NSS Databases (Chromium, Firefox, tools using `libnss3`)

For CLI/headless browser workloads using NSS without enterprise policy overrides:

```bash
certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n "Example Root CA G2" -i rootcag2.crt
```

## 6. Removing or Distrusting a Root CA

When rotating or retiring an internal CA, remove the anchor file and regenerate the trust store:

```bash
# RHEL / Rocky / Oracle Linux
sudo rm -f /etc/pki/ca-trust/source/anchors/rootcag2.crt
sudo update-ca-trust

# Debian / Ubuntu / Alpine (--fresh purges stale symlinks in /etc/ssl/certs)
sudo rm -f /usr/local/share/ca-certificates/rootcag2.crt
sudo update-ca-certificates --fresh
```

On RHEL-family systems, if you need to **actively distrust** a compromised CA that still ships in Mozilla's default bundle, drop its PEM certificate into `/etc/pki/ca-trust/source/blocklist/` and run `sudo update-ca-trust`.

## 7. Automating Across Fleets with Ansible

Instead of running manual commands per host, standardize trust anchor deployment in Ansible across mixed Debian and Enterprise Linux fleets:

```yaml
- name: Deploy internal Root CA trust anchor
  hosts: all
  become: true
  vars:
    ca_cert_src: files/rootcag2.crt
    ca_cert_name: rootcag2.crt
  tasks:
    - name: Set OS-specific CA paths
      ansible.builtin.set_fact:
        ca_dest: >-
          {{ '/etc/pki/ca-trust/source/anchors/' ~ ca_cert_name
             if ansible_os_family == 'RedHat'
             else '/usr/local/share/ca-certificates/' ~ ca_cert_name }}
        ca_update_cmd: >-
          {{ 'update-ca-trust'
             if ansible_os_family == 'RedHat'
             else 'update-ca-certificates' }}

    - name: Ensure ca-certificates package is installed
      ansible.builtin.package:
        name: ca-certificates
        state: present

    - name: Copy Root CA certificate
      ansible.builtin.copy:
        src: "{{ ca_cert_src }}"
        dest: "{{ ca_dest }}"
        owner: root
        group: root
        mode: "0644"
      notify: Rebuild CA trust store

  handlers:
    - name: Rebuild CA trust store
      ansible.builtin.command: "{{ ca_update_cmd }}"
```

Remember to restart long-running daemons (such as NGINX, Envoy, Docker, or Prometheus) after updating the trust store so processes that cache CA bundles in memory at startup reload the new trust chain.
