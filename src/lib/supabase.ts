import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  url &&
  key &&
  !url.includes('YOUR_PROJECT_ID') &&
  !key.includes('YOUR_SUPABASE')
);

export const supabase = isSupabaseConfigured
  ? createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export type Company = {
  id: string | number;
  name: string;
  industry?: string;
  website?: string;
  location?: string;
  description?: string;
  status?: string;
  raw?: Record<string, unknown>;
};

const firstValue = (
  row: Record<string, unknown>,
  keys: string[],
  fallback: unknown = ''
): unknown => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key];
    }
  }
  return fallback;
};

export function normalizeCompany(
  row: Record<string, unknown>,
  index: number
): Company {
  const nested =
    row.company && typeof row.company === 'object'
      ? (row.company as Record<string, unknown>)
      : {};
  const merged = { ...row, ...nested };

  const rawName = firstValue(
    merged,
    ['name', 'company_name', 'company', 'organisation_name', 'organization_name', 'title'],
    ''
  );

  return {
    id: firstValue(merged, ['id', 'company_id', 'staging_id'], index + 1) as string | number,
    name: String(rawName || `Company ${index + 1}`),
    industry: String(
      firstValue(merged, ['industry', 'category', 'sector', 'industry_name', 'domain'], 'Not specified')
    ),
    website: String(
      firstValue(merged, ['website', 'website_url', 'url', 'company_website'], '')
    ),
    location: String(
      firstValue(merged, ['location', 'headquarters_address', 'city', 'headquarters', 'address', 'hq_location'], 'Not specified')
    ),
    description: String(
      firstValue(merged, ['description', 'overview_text', 'about', 'company_description', 'summary'], '')
    ),
    status: String(firstValue(merged, ['processing_status', 'status'], 'Available')),
    raw: merged,
  };
}

const isMissingRelation = (message: string): boolean =>
  /does not exist|could not find the table|schema cache|42P01|PGRST205/i.test(message);

// Prefer the safe public views. The base tables are fallbacks only for projects
// where a view is not yet installed and the user's RLS policy permits reading.
const TABLE_CANDIDATES = [
  // The staging directory is the full placement dataset; prefer it over
  // the smaller public directory view when both are readable.
  'staging_company_directory_public',
  'company_directory_public',
  'staging_company',
  'companies',
  'company_json',
];

export async function loadCompanies(): Promise<{
  companies: Company[];
  source: string | null;
  error: string | null;
}> {
  if (!supabase) {
    return {
      companies: [],
      source: null,
      error: 'Supabase credentials are missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  const errors: string[] = [];

  for (const table of TABLE_CANDIDATES) {
    const { data, error } = await supabase.from(table).select('*').limit(500);

    if (error) {
      errors.push(`${table}: ${error.message}`);
      if (isMissingRelation(error.message)) continue;

      return {
        companies: [],
        source: table,
        error: `${error.message} (Table/view: ${table})`,
      };
    }

    const rows = (data ?? [])
      .map((row, index) => normalizeCompany(row as Record<string, unknown>, index))
      .filter((company) => company.name.trim().length > 0);

    if (rows.length > 0) {
      return { companies: rows, source: table, error: null };
    }

    // An empty first view/table must not prevent trying the next source.
    errors.push(`${table}: query succeeded but returned zero rows`);
  }

  return {
    companies: [],
    source: null,
    error: `No readable company records were found. ${errors.join(' | ')}`,
  };
}

export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase credentials are missing in the environment variables.',
    };
  }

  const candidates = [
    'staging_company_directory_public',
    'company_directory_public',
    'staging_company',
    'companies',
    'company_json',
  ];
  const errors: string[] = [];

  for (const table of candidates) {
    const { error } = await supabase
      .from(table)
      .select('*', { head: true, count: 'exact' });

    if (!error) {
      return {
        ok: true,
        message: `Supabase connected. Table/view "${table}" is readable.`,
      };
    }

    errors.push(`${table}: ${error.message}`);
    if (isMissingRelation(error.message)) continue;

    return { ok: false, message: `${error.message} (Table/view: ${table})` };
  }

  return {
    ok: false,
    message: `No candidate table/view is accessible. ${errors.join(' | ')}`,
  };
}
