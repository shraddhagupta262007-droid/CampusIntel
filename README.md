# CampusIntel — Placement Intelligence

A React + Vite + TypeScript placement/company dashboard with Supabase client integration already wired in. It loads company records from your existing Supabase project; it does not seed fake companies into the database.

## Only required configuration

1. Open the project folder.
2. Copy `.env.example` to `.env`.
3. Paste your Supabase Project URL and **publishable/anon** key into `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

4. Install and run (first run only):

```bash
npm install
npm run dev
```

To make a production build: `npm run build`.

## Database behavior

- The included client uses `@supabase/supabase-js` and reads from the first accessible table in this order: `companies`, `company_json`, `staging_company`.
- Column names are normalized across common naming conventions such as `name`, `company_name`, `company_id`, `industry`, `sector`, `website`, `city`, and `location`.
- Search, industry filtering, company detail view, raw-record inspection, CSV export, refresh, and connection diagnostics are included.
- If no credentials are configured, the dashboard explicitly says setup is required and does not pretend that demo/sample rows are live data.
- If the table is not accessible, check the actual table name, schema, and SELECT/RLS policy in Supabase. The frontend cannot bypass Row Level Security.

## Security

Never place a `service_role` / secret key in a browser app. Use the publishable key (or legacy anon key) with suitable RLS policies. `.env` is ignored by Git.

## Deploying to Vercel

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Project Settings → Environment Variables, then redeploy.
