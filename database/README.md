# Database helpers for daily-budget

This folder contains artifacts to migrate the browser-localStorage data (`daily-budget-data`) into a database backing suitable for Cloudflare D1 (SQLite-compatible). This is intended to make it easier to migrate from Next.js to a serverless backend (Cloudflare Workers + D1) or other SQL stores.

What I added

- `migrations/001_init.sql`: initial DDL for budgets, accounts, transactions, and settings.
- `cloudflare-worker-example.js`: example Cloudflare Worker routes to list accounts and import a JSON payload into D1. Expects a D1 binding named `DB`.
- `lib/import-localstorage-to-sqlite.ts`: Node utility to import a JSON export from the browser into a local SQLite file (uses `better-sqlite3`). Useful for local testing before uploading data to D1.
- `schema.json`: JSON Schema inferred from the code (root key `daily-budget-data`).

Quick local import flow

1. In the browser console, export your data:

```js
copy(localStorage.getItem('daily-budget-data'))
```

Paste the copied JSON into a file, e.g. `tmp/export.json`.

2. Install dependency and run import script locally:

```bash
pnpm add -w better-sqlite3
node ./lib/import-localstorage-to-sqlite.ts tmp/export.json ./tmp/daily-budget.sqlite
```

(If you use pnpm workspaces you might prefer to install locally.)

Cloudflare D1 notes

- Use `wrangler` to configure your Worker and a D1 database. In `wrangler.toml` add a binding like:

```toml
[d1_databases]
DB = "<your-d1-binding-name>"
```

- Deploy the migration SQL to D1 or run the SQL in your Worker startup to ensure tables exist.
- The `cloudflare-worker-example.js` file shows a minimal import endpoint. Adapt to your API/authorization needs.

Next steps for migration to Astro (serverless)

- Astro can call the same Cloudflare Worker endpoints (or be deployed to Cloudflare Pages with Functions) to access the data.
- If moving to a Node server, reuse `lib/import-localstorage-to-sqlite.ts` to seed your PostgreSQL/SQLite database, and write small adapters to convert types (dates as ISO strings).

If you want, I can:
- Add a Wrangler `wrangler.toml` example and a deployable Worker project scaffold.
- Add SQL scripts to export/import data between SQLite and PostgreSQL.
- Add a small test harness and unit tests for the import script.
