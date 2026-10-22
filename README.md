# CampusIntel — Placement Intelligence

CampusIntel is a React, Vite, and TypeScript placement workspace. It includes a company directory, employer research shortlist, recorded skill profiles, Supabase diagnostics, CSV exports, and a browser-local application tracker.

Company and skill information is read from the configured Supabase project. The application tracker stores entries in this browser's local storage only; those entries are not written to Supabase or synced across devices. The app does not insert sample companies into the database or present demo records as live data. The company directory is not an authenticated or private workspace, so do not enter sensitive personal information into tracker notes.

## Requirements

- Node.js and npm
- A Supabase project with company records and read access
- A Supabase publishable key (or legacy anon key)

## Local setup

1. Clone the repository and open the project folder.
2. Copy `.env.example` to `.env`.
3. Set the Supabase URL and publishable/anon key:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
   ```

4. Install dependencies and start the development server:

   ```bash
   npm install
   npm run dev
   ```

5. Create a production build when needed:

   ```bash
   npm run build
   ```

## Supabase data sources

The company directory tries these sources in order and uses the first source that returns readable records:

1. `staging_company_directory_public`
2. `company_directory_public`
3. `staging_company`
4. `companies`
5. `company_json`

Skill Intelligence reads from `company_skill_profiles_public`, a read-only view that selects only the skill fields needed by the browser app. The underlying `staging_company_skill_levels` table is not directly readable by the public app roles. Duplicate company names in the source skill records remain visible as separately identified records; the app does not silently merge potentially conflicting values.

The dashboard cannot display records that are not present in the connected database or are not readable by the configured role.

Company fields are normalized from common column names such as `name`, `company_name`, `industry`, `sector`, `website`, `city`, and `location`.

If records are missing or no data appears:

- Confirm `VITE_SUPABASE_URL` points to the intended Supabase project.
- Check which table/view contains the expected records and compare its row count.
- Confirm the configured key's role has `SELECT` permission and the table/view's Row Level Security (RLS) policies allow reads.
- Use the dashboard's connection diagnostic message to identify the table/view or permission error.

Changing the table search order does not create missing records. If your expected dataset has 163 companies but the connected source contains fewer, import or restore the missing records into the intended Supabase source first.

## UI design

CampusIntel uses a restrained brutalist visual style for a clear, professional placement dashboard:

- **Palette:** deep navy (`#142B3D`), teal (`#176B63`), cool grey-blue surfaces, and white.
- **Layout:** square corners, strong borders, clear table structure, and deliberate offset shadows.
- **Interaction:** subtle transitions for hover, focus, and navigation states; no added decorative motion.
- **Accessibility:** reduced-motion preferences are respected, and responsive layouts support smaller screens.

The design is implemented in `src/styles.css`. Keep future UI changes consistent with this palette and interaction approach rather than introducing unrelated gradients, rounded-pill controls, or attention-grabbing animations.

## Features

- Company directory with search, industry filtering, company profiles, and CSV export
- Employer research shortlist
- Skill Intelligence with search, source-record disambiguation for duplicate company names, and a note that the dataset's rating scale is not documented
- Read-only skill data through the restricted `company_skill_profiles_public` view
- Placement tracker for company, role, stage, application date, follow-up date, job link, next action, and notes
- Application tracker data saved in browser local storage and exportable as CSV; it is not synced or backed up by Supabase
- Supabase connection diagnostics and explicit setup/error states
- CSV cells are escaped to reduce spreadsheet formula-injection risk

## Deploying to Vercel

1. Import or connect this GitHub repository in Vercel.
2. Open **Project Settings → Environment Variables**.
3. Add these exact variable names (the `VITE_` prefix is required by the frontend):

   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase publishable key or legacy anon key

4. Enable the variables for the **Production** environment (and **Preview** if you use preview deployments).
5. Redeploy the latest deployment after adding or changing environment variables.

Vite embeds `VITE_*` values at build time, so saving variables alone does not update an already-built deployment. Make sure the URL and key belong to the same Supabase project used for the intended company dataset.

## Security

Never place a Supabase `service_role` key or any secret key in frontend code or a `VITE_*` variable. Use a publishable/anon key with suitable RLS policies. Keep your local `.env` file out of Git; do not commit credentials.
