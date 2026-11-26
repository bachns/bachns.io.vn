---
title: "MariaDB Administration Cheat Sheet"
description: "Practical day-to-day commands for running MariaDB on Linux: installation, UTF-8 databases, least-privilege users, safe transactions, online backups, and 3-node Galera clusters."
date: 2026-11-18
category: data
tags: [mariadb, database, sql, galera, backup]
draft: false
---

MariaDB remains one of the most reliable open-source relational databases for transactional workloads on Linux. Below is a consolidated operational reference covering installation, user privileges, safe data updates, online InnoDB backups, and multi-master Galera clustering.

## 1. Installation and Initial Setup

### RHEL / Rocky Linux / AlmaLinux

Install the server package, enable the service, and run the post-install hardening script:

```bash
sudo dnf install -y mariadb-server
sudo systemctl enable --now mariadb
sudo systemctl status mariadb --no-pager

# Harden defaults (remove anonymous users, test DB, and remote root login)
sudo mariadb-secure-installation
```

*(On older MariaDB 10.x releases, the binary is named `mysql_secure_installation`).*

On modern MariaDB installations (10.4+), local `root@localhost` authenticates via `unix_socket` by default, so you can open a shell directly from a privileged Linux account:

```bash
sudo mariadb
# Or over TCP with password authentication:
mariadb -h 127.0.0.1 -u app_user -p
```

Run a one-off SQL statement directly from the shell without entering the interactive prompt:

```bash
mariadb -u app_user -p -D app_db -e "SELECT COUNT(*) FROM users;"
```

### Quick Local Container (Docker)

Spin up an isolated MariaDB LTS instance for testing:

```bash
docker run -d \
  --name mariadb-dev \
  -e MARIADB_ROOT_PASSWORD='ChangeMe_StrongPass!' \
  -p 127.0.0.1:3306:3306 \
  mariadb:11.4
```

## 2. Databases and Least-Privilege Users

### Create a UTF-8 (`utf8mb4`) Database

Always specify `utf8mb4` explicitly so full 4-byte Unicode characters (including Vietnamese diacritics and symbols) store cleanly without truncation:

```sql
CREATE DATABASE app_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE app_db;
SELECT DATABASE();
```

*(If sorting Vietnamese names strictly by dictionary order is required, use `COLLATE utf8mb4_vietnamese_ci`).*

### Create Application and Read-Only Users

Scope user accounts to your internal application subnet (for example, `10.0.%`) instead of wildcard `'%'` whenever possible:

```sql
-- 1. Application user (full access to a single database only)
CREATE USER 'app_user'@'10.0.%' IDENTIFIED BY 'StrongAppPassword!';
GRANT ALL PRIVILEGES ON app_db.* TO 'app_user'@'10.0.%';

-- 2. Read-only user (for reporting, BI, or exporters)
CREATE USER 'readonly_user'@'10.0.%' IDENTIFIED BY 'StrongReadPassword!';
GRANT SELECT ON app_db.* TO 'readonly_user'@'10.0.%';
```

*(Note: `FLUSH PRIVILEGES` is not needed after `CREATE USER`, `ALTER USER`, or `GRANT` statements).*

### Inspect Users, Grants, and Rotate Passwords

```sql
-- List all accounts and allowed client hosts
SELECT User, Host, plugin FROM mysql.user;

-- Inspect grants (always include the exact host part)
SHOW GRANTS FOR 'app_user'@'10.0.%';

-- Rotate an existing user's password
ALTER USER 'app_user'@'10.0.%' IDENTIFIED BY 'NewStrongPassword!';
```

## 3. Guarding Manual Updates with Transactions

Before running manual `UPDATE` or `DELETE` statements on production tables, wrap them in an explicit transaction so you can verify affected rows before committing:

```sql
-- 1. Begin an isolated transaction
START TRANSACTION;

-- 2. Apply the change
UPDATE products SET price = 20000 WHERE id = 10;

-- 3. Verify affected rows and resulting state
SELECT ROW_COUNT();
SELECT id, name, price FROM products WHERE id = 10;

-- 4a. Revert immediately if anything looks wrong:
ROLLBACK;

-- 4b. Or persist the change once verified:
COMMIT;
```

> [!WARNING]
> **DDL statements cannot be rolled back** in MariaDB. Commands such as `DROP TABLE`, `TRUNCATE TABLE`, and `ALTER TABLE` trigger an **implicit `COMMIT`** immediately. Always take a logical backup before altering schema or truncating data.

## 4. Online Backup and Restore (`mariadb-dump`)

*(On MariaDB 10.x systems where `mariadb-dump` is not yet symlinked, substitute `mysqldump` and `mysql`).*

### Step 1: Online Hot Backup of an InnoDB Database

Use `--single-transaction` to capture a consistent point-in-time MVCC snapshot on InnoDB tables **without locking writes**:

```bash
mariadb-dump \
  --user=root \
  --password \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --databases app_db \
  | gzip > /backup/app_db_$(date +%Y%m%d_%H%M%S).sql.gz
```

| Dump Option | Includes `CREATE DATABASE` & `USE`? | Best Used When |
|---|---|---|
| `--databases app_db` | Yes | Restoring the same database name onto a fresh or existing server |
| `app_db` *(without `--databases`)* | No (tables and data only) | Restoring production data into a differently named database (such as `app_db_staging`) |

### Step 2: Verify the Backup Archive

Check both the header and the last line (`Dump completed on ...`) to confirm the export did not abort mid-stream due to a full disk or dropped connection:

```bash
ls -lh /backup/app_db_*.sql.gz
zcat /backup/app_db_20261118_020000.sql.gz | head -n 25
zcat /backup/app_db_20261118_020000.sql.gz | tail -n 5
```

### Step 3: Restore Scenarios

**Scenario A - Restore onto a target server (same database name):**

Because `--databases` embedded `CREATE DATABASE IF NOT EXISTS` and `USE app_db;` in the dump, stream it directly into `mariadb`:

```bash
zcat /backup/app_db_20261118_020000.sql.gz | mariadb -u root -p
```

**Scenario B - Restore into a different database name (`app_db_staging`):**

If the backup was created **without** `--databases`:

```bash
mariadb -u root -p -e "CREATE DATABASE app_db_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
zcat /backup/app_db_raw.sql.gz | mariadb -u root -p app_db_staging
```

If the backup **already contains** `--databases app_db`, strip the top-level `CREATE DATABASE` and `USE` lines on the fly before piping into the new database:

```bash
mariadb -u root -p -e "CREATE DATABASE app_db_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
zcat /backup/app_db_20261118_020000.sql.gz \
  | sed '/^CREATE DATABASE /d; /^USE /d' \
  | mariadb -u root -p app_db_staging
```

**Step 4 - Confirm the restore:**

```bash
mariadb -u root -p -e "USE app_db; SHOW TABLES;"
```

## 5. Multi-Master High Availability with Galera Cluster

MariaDB ships with native **Galera Cluster** (`wsrep`) support for synchronous 3-node (or 5-node) multi-master replication.

### Step 1: Configure Each Node

Stop MariaDB on all nodes first (`sudo systemctl stop mariadb`), then configure `/etc/my.cnf.d/galera.cnf` (RHEL/Rocky) or `/etc/mysql/mariadb.conf.d/60-galera.cnf` (Debian/Ubuntu):

```ini
[galera]
wsrep_on                 = ON
wsrep_provider           = /usr/lib64/galera-4/libgalera_smm.so
wsrep_cluster_name       = "prod_galera_cluster"
wsrep_cluster_address    = "gcomm://192.168.1.11,192.168.1.12,192.168.1.13"

# Change per node (192.168.1.11 / node1, .12 / node2, .13 / node3)
wsrep_node_address       = "192.168.1.11"
wsrep_node_name          = "node1"

# Use mariabackup for non-blocking SST in production (or rsync for small empty setups)
wsrep_sst_method         = mariabackup

# Mandatory InnoDB & binlog settings for Galera
binlog_format            = ROW
default_storage_engine   = InnoDB
innodb_autoinc_lock_mode = 2
bind-address             = 0.0.0.0
```

*(Note: on Debian/Ubuntu, `wsrep_provider` is typically `/usr/lib/galera/libgalera_smm.so`. Ensure TCP ports `3306`, `4567`, `4568`, and `4444` plus UDP `4567` are open between cluster nodes).*

### Step 2: Bootstrap the Cluster Safely

Bootstrap the primary component on **Node 1 only**, then start `mariadb` normally on the remaining nodes:

```bash
# Run on Node 1 ONLY:
sudo galera_new_cluster

# Run on Node 2 and Node 3:
sudo systemctl start mariadb
```

> [!WARNING]
> Never run `galera_new_cluster` on multiple nodes at the same time - doing so initializes separate single-node clusters and causes split-brain divergence.

### Step 3: Verify Cluster Quorum and Sync State

```bash
sudo mariadb -e "
  SHOW STATUS LIKE 'wsrep_cluster_size';
  SHOW STATUS LIKE 'wsrep_cluster_status';
  SHOW STATUS LIKE 'wsrep_local_state_comment';
  SHOW STATUS LIKE 'wsrep_ready';
"
```

A healthy 3-node cluster reports `wsrep_cluster_size = 3`, `wsrep_cluster_status = Primary`, `wsrep_local_state_comment = Synced`, and `wsrep_ready = ON`.
