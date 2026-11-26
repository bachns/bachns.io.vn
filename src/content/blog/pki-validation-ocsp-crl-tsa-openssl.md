---
title: "Inspecting and Testing CRT, CRL, OCSP, and RFC 3161 TSA Services with OpenSSL"
description: "A practical OpenSSL reference for operating PKI validation and timestamping infrastructure: extracting AIA and CDP URLs, checking CRLs, debugging OCSP GET/POST requests, and verifying RFC 3161 timestamps."
date: 2026-11-26
category: cryptography
tags: [pki, openssl, ocsp, crl, tsa]
draft: false
---

When operating Public Key Infrastructure (PKI) components such as EJBCA (CA and Validation Authority) or SignServer (Time-Stamp Authority), browsers and high-level SDKs often hide the underlying ASN.1 payloads when validation fails. Knowing how to craft, decode, verify, and benchmark **CRT**, **CRL**, **OCSP**, and **TSA** traffic directly with `openssl` and `curl` makes troubleshooting far faster.

| Component | Standard | HTTP Content-Type (Request / Response) | Primary Purpose |
|---|---|---|---|
| **AIA (`caIssuers`)** | RFC 5280 | N/A / `application/pkix-cert` | Fetch intermediate CA certificates to build the trust chain |
| **CRL** | RFC 5280 | N/A / `application/pkix-crl` | Periodic batch list of revoked certificate serial numbers |
| **OCSP** | RFC 6960, RFC 5019 | `application/ocsp-request` / `application/ocsp-response` | Real-time status query (`good`, `revoked`, `unknown`) for a single serial |
| **TSA** | RFC 3161 | `application/timestamp-query` / `application/timestamp-reply` | Cryptographic proof that specific data existed at a trusted point in time |

## 1. Certificates (CRT) and AIA Discovery

End-entity (leaf) certificates embed **Authority Information Access (AIA)** URLs pointing to the issuing CA certificate (`CA Issuers`) and the OCSP responder (`OCSP`).

Extract the full AIA extension or just the OCSP URI from a certificate:

```bash
# Show both OCSP and CA Issuers URLs
openssl x509 -in leaf.crt -noout -ext authorityInfoAccess

# Extract only the OCSP Responder URI
openssl x509 -in leaf.crt -noout -ocsp_uri

# Filter CA Issuers from full text output
openssl x509 -in leaf.crt -noout -text | grep "CA Issuers"
```

Download the issuer certificate directly from the AIA URL without following unexpected HTTP redirects:

```bash
wget --max-redirect=0 http://pki.example.com/pub/crt/subca-g2.crt
```

> [!TIP]
> **DER vs. PEM at AIA URLs:** Per RFC 5280 Section 4.2.2.1, HTTP `caIssuers` endpoints commonly serve binary **DER-encoded** certificates (`.crt` / `.cer`), even when the filename ends in `.crt`. Before passing the issuer file to older OpenSSL subcommands or concatenating chains, check its format and convert to PEM if needed:
>
> ```bash
> file subca-g2.crt
> openssl x509 -inform DER -in subca-g2.crt -out subca-g2.pem
> ```

## 2. Certificate Revocation Lists (CRL)

Extract the **CRL Distribution Points (CDP)** URL embedded in a certificate:

```bash
openssl x509 -in leaf.crt -noout -ext crlDistributionPoints
```

Download the CRL and inspect its metadata (`Issuer`, `Last Update`, `Next Update`, `CRL Number`, and revoked serials):

```bash
wget --max-redirect=0 http://pki.example.com/pub/crl/subca-g2.crl

# Inspect CRL headers (omit -text and add -lastupdate -nextupdate for quick expiry checks)
openssl crl -in subca-g2.crl -noout -text | head -n 25
```

*(On OpenSSL 1.1.1, add `-inform DER` if the downloaded CRL is binary DER; OpenSSL 3.x detects DER and PEM automatically).*

Verify the cryptographic signature of the CRL against the CA chain, then check whether `leaf.crt` is revoked:

```bash
# 1. Verify the CRL signature itself
openssl crl -in subca-g2.crl -CAfile chain.pem -noout

# 2. Convert a DER CRL to PEM and bundle it with the CA chain to verify a leaf certificate
openssl crl -inform DER -in subca-g2.crl -out subca-g2.crl.pem
cat root-ca.pem subca-g2.pem subca-g2.crl.pem > chain-with-crl.pem
openssl verify -crl_check -CAfile chain-with-crl.pem leaf.crt
```

## 3. Online Certificate Status Protocol (OCSP)

### Live OCSP Status Check (HTTP POST)

Query an OCSP responder for a certificate's revocation status:

```bash
openssl ocsp \
  -issuer subca-g2.pem \
  -cert leaf.crt \
  -url http://ocsp.example.com \
  -CAfile chain.pem \
  -resp_text
```

Pay attention to **two separate results** in the output:

1. `Response verify OK`: confirms the OCSP responder's signature chains back to `-CAfile` and carries the `OCSPSigning` Extended Key Usage.
2. `leaf.crt: good` (or `revoked` / `unknown`): reports the actual status of the certificate, followed by `This Update` and `Next Update`.

When testing an internal Validation Authority (such as EJBCA) directly by IP before switching DNS, override the HTTP `Host` header explicitly:

```bash
openssl ocsp \
  -issuer subca-g2.pem \
  -cert leaf.crt \
  -url http://10.10.20.15:8080/ejbca/publicweb/status/ocsp \
  -header "Host=ocsp.example.com" \
  -CAfile chain.pem
```

### Decoding OCSP HTTP GET Requests from Access Logs

Lightweight OCSP profiles (RFC 5019) send OCSP queries over **HTTP GET** so reverse proxies (NGINX, Varnish, CDNs) can cache responses:

```text
GET /MEIwQDA%2BMDwwOjAJBgUrDgMCGgUABBRrlYNTUQjx8ZqQ4pdbMTvWU%2BaHDAQU2RcbUaMXt578Ldth%2BnkA%2F1h0nVwCAQQ%3D HTTP/1.1
```

The path segment is a **URL-encoded, Base64-encoded DER `OCSPRequest`**. To inspect which certificate serial number and issuer key hash a client was querying in your access logs, URL-decode `%2B` (`+`), `%2F` (`/`), and `%3D` (`=`), Base64-decode to binary DER, and parse it with `openssl ocsp`:

```bash
REQUEST='MEIwQDA%2BMDwwOjAJBgUrDgMCGgUABBRrlYNTUQjx8ZqQ4pdbMTvWU%2BaHDAQU2RcbUaMXt578Ldth%2BnkA%2F1h0nVwCAQQ%3D'

echo "$REQUEST" \
  | sed 's/%2B/+/g; s/%2F/\//g; s/%3D/=/g' \
  | openssl enc -d -A -base64 -out request.der

openssl ocsp -reqin request.der -req_text
```

Output:

```text
OCSP Request Data:
    Version: 1 (0x0)
    Requestor List:
        Certificate ID:
          Hash Algorithm: sha1
          Issuer Name Hash: 6B9583535108F1F19A90E2975B313BD653E6870C
          Issuer Key Hash: D9171B51A317B79EFC2DDB61FA7900FF58749D5C
          Serial Number: 04
```

*(If a captured path contains lowercase hex escapes like `%2b` or `%2f`, `python3 -c "import sys, urllib.parse, base64; sys.stdout.buffer.write(base64.b64decode(urllib.parse.unquote(sys.argv[1])))" "$REQUEST" > request.der` decodes any percent-encoded string cleanly).*

## 4. Time-Stamp Authority (RFC 3161 TSA)

An RFC 3161 Time-Stamp Authority hashes your payload (never uploading the raw document itself) and signs a `TimeStampToken` proving the digest existed before a given time.

### Step 1: Create a Timestamp Query (`.tsq`)

Generate a SHA-256 timestamp request and pass `-cert` so the TSA includes its signing certificate in the reply:

```bash
echo "Sample payload to timestamp" > data.txt
openssl ts -query -data data.txt -sha256 -cert -out request.tsq

# Inspect the generated query (hash algorithm, message imprint, and random nonce)
openssl ts -query -in request.tsq -text
```

### Step 2: Send the Query to the TSA Server

Submit the binary `.tsq` via HTTP POST with `Content-Type: application/timestamp-query`:

```bash
curl -fS \
  -H "Content-Type: application/timestamp-query" \
  --data-binary @request.tsq \
  http://tsa.example.com/signserver/process?workerName=TimeStampSigner \
  -o response.tsr
```

### Step 3: Inspect and Cryptographically Verify the Response (`.tsr`)

Read the human-readable fields (`Status: Granted.`, `Policy OID`, `Time stamp`, `Nonce`, and embedded signer subject):

```bash
openssl ts -reply -in response.tsr -text
```

Finally, verify that `response.tsr` matches `data.txt`, carries a valid `timeStamping` Extended Key Usage, and chains up to your trusted Root CA:

```bash
openssl ts -verify \
  -in response.tsr \
  -data data.txt \
  -CAfile root-ca.pem \
  -untrusted subca-g2.pem
```

Expected output:

```text
Verification: OK
```

## 5. Load Testing OCSP and TSA Endpoints

Because every dynamic OCSP response or RFC 3161 timestamp requires a private-key signature (typically executed inside a network HSM or PKCS#11 token), capacity planning before production rollout is essential.

You can benchmark both endpoints using ApacheBench (`ab`) with pre-generated binary request files:

```bash
# 1. Benchmark TSA throughput (1000 requests, 50 concurrent workers)
ab -n 1000 -c 50 \
  -p request.tsq \
  -T "application/timestamp-query" \
  http://tsa.example.com/ts

# 2. Export a raw DER OCSP request (omit nonce if testing HTTP/CDN caching) and benchmark OCSP
openssl ocsp -issuer subca-g2.pem -cert leaf.crt -no_nonce -reqout request.ocsp
ab -n 1000 -c 50 \
  -p request.ocsp \
  -T "application/ocsp-request" \
  http://ocsp.example.com/
```

> [!WARNING]
> **Note on nonces and HSM load:** Replaying the same `request.tsq` with `ab` benchmarks raw cryptographic signing throughput on the TSA worker. For OCSP, requests containing a `Nonce` extension force the responder (if nonce-enabled) to sign dynamically on the HSM instead of serving pre-produced or proxy-cached responses, so test both `-nonce` and `-no_nonce` profiles to measure worst-case HSM saturation vs. cache hit latency.
