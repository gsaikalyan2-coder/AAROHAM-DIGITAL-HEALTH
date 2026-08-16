# Aaroham
## Digital Health Record Management System for Migrant Workers in Kerala

**Department of Health &amp; Family Welfare, Government of Kerala**

A portable **Migrant Health ID (MHID)** under which a worker's complete physical and
mental health record is maintained and made available to authorised medical practitioners
at every participating facility in the State.

---

## System Overview

| Aspect | Detail |
|---|---|
| Beneficiary group | Inter-state migrant workers registered in Kerala |
| Primary identifier | Migrant Health ID (MHID) · ABHA number linked where available |
| User roles | Beneficiary · Medical practitioner · Departmental administrator |
| Present status | Working prototype — Milestone I |
| Database | PostgreSQL (sole supported engine) |

---

## Installation

**Prerequisites:** Node.js 18 or later. PostgreSQL 14 or later (required from Phase 5A).

**Database**

The register runs on PostgreSQL 14 or later. Either a local instance or a managed
one (the project uses a Supabase instance in the ap-south-1 Mumbai region, which
keeps beneficiary data in-country).

*Managed — Supabase:* open the project dashboard, click **Connect**, choose
**Session pooler**, and copy the string into `DATABASE_URL` in `server/.env`.

```
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-<region>.pooler.supabase.com:5432/postgres
```

Use the **session** pooler on port `5432`, not the transaction pooler on `6543` —
transaction mode supports neither prepared statements nor session-scoped
advisory locks, both of which the migration runner requires. A `6543` URL is
refused at connection time rather than failing midway through a migration.

*Local:*

```bash
createdb Aaroham
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/Aaroham
```

TLS is negotiated automatically for any non-localhost host. URL-encode special
characters in the password (`@` → `%40`, `#` → `%23`, `/` → `%2F`).

**Application server**
```bash
cd server
cp .env.example .env   # then fill DATABASE_URL
npm install
npm run db:migrate     # applies server/db/migrations in order
npm run db:seed        # loads the departmental demonstration dataset
npm run dev            # http://localhost:5000
```

Both database commands are safe to re-run: `db:migrate` skips migrations already applied,
and `db:seed` inserts nothing on a second run. Useful variants:

| Command | Effect |
|---|---|
| `npm run db:migrate -- --status` | Report applied and pending migrations; change nothing |
| `npm run db:migrate -- --reset` | Drop the schema and rebuild from empty (refused when `NODE_ENV=production`) |
| `npm run db:reset` | `--reset` followed by a fresh seed |

An applied migration must never be edited — the runner records a checksum and refuses to
continue if one changes, because the edit would not reach any database that already ran
it. Add a new migration instead.

**Web client**
```bash
cd client
cp .env.example .env
npm install
npm run dev            # http://localhost:5173
```

Verify the server with `GET http://localhost:5000/api/v1/health`.

---

## Demonstration Access

| Portal | Credentials |
|---|---|
| Beneficiary | Any 10-digit mobile number · OTP `123456` |
| Medical practitioner | Any email address and password |
| Departmental administrator | Any email address and password |

> **Declared limitation.** Authentication is simulated at Milestone I and all displayed
> figures originate from a labelled demonstration dataset at
> `client/src/data/mockData.js`. No figure shown is derived from a live record.
> Production authentication is delivered at Phases 6–7; live data at Phases 5A–5D.

---

## Beneficiary Dataset

The initial dataset is collected through Google Forms and expected on **6 August 2026**.
Its column structure is not yet known, so the importer is written against a declarative
mapping configuration rather than fixed column names.

| Artefact | Location |
|---|---|
| Ingestion specification | `docs/DATA_INGESTION.md` |
| Field mapping configuration | `server/src/config/fieldMapping.js` |
| Received exports (never edited) | `server/db/imports/` |
| Test fixtures (synthetic) | `server/db/fixtures/` |

The pipeline is built and tested. **Dry run is the default; a load must be asked for.**

```bash
# dry run against the synthetic fixtures — writes nothing
npm run db:import -- --file server/db/fixtures/sample_dirty.csv --profile fixture

# dry run against the real export once it is deposited (Phase 5D)
npm run db:import -- --file server/db/imports/<export>.csv
```

A load (`--commit`) is refused while `MAPPING_COMPLETE` is `false` in
`server/src/config/fieldMapping.js`. Every run writes an exception report to
`server/db/reports/` and prints the reconciliation statement.

On receipt, follow `docs/DATA_INGESTION.md` §9 — deposit, profile, map, dry run, load,
reconcile.

---

## Documentation

| Document | Purpose |
|---|---|
| `CLAUDE.md` | Technical standard and single source of truth |
| `PROJECT_PLAN.md` | Phased implementation plan, dependencies, risk register |
| `FOLDER_STRUCTURE.md` | Annotated repository structure |
| `docs/DATA_INGESTION.md` | Google Forms ingestion specification |

---

## Technology Platform

React 18 · Tailwind CSS · Node.js with Express · PostgreSQL · JWT with OTP · Chart.js
