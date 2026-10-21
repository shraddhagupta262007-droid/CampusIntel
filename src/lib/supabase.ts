import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(url && key && !url.includes('YOUR_PROJECT_ID') && !key.includes('YOUR_SUPABASE'));
export const supabase = isSupabaseConfigured ? createClient(url!, key!, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
}) : null;

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

const firstValue = (row: Record<string, unknown>, keys: string[], fallback: unknown = '') => {
  for (const key of keys) if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  return fallback;
};

export function normalizeCompany(row: Record<string, unknown>, index: number): Company {
  const nested = (row.company && typeof row.company === 'object' ? row.company : {}) as Record<string, unknown>;
  const merged = { ...row, ...nested };
  const name = String(firstValue(merged, ['name', 'company_name', 'company', 'organisation_name', 'organization_name', 'title'], `Company ${index + 1}`));
  return {
    id: (firstValue(merged, ['id', 'company_id', 'staging_id'], index + 1)) as string | number,
    name,
    industry: String(firstValue(merged, ['industry', 'sector', 'industry_name', 'domain'], 'Not specified')),
    website: String(firstValue(merged, ['website', 'website_url', 'url', 'company_website'], '')),
    location: String(firstValue(merged, ['location', 'city', 'headquarters', 'address', 'hq_location'], 'Not specified')),
    description: String(firstValue(merged, ['description', 'about', 'company_description', 'summary'], '')),
    status: String(firstValue(merged, ['processing_status', 'status'], 'Available')),
    raw: merged
  };
}

// Tries common project tables in priority order. A missing optional table is skipped;
// a permissions/schema error is retained so the dashboard can explain what to fix.
export async function loadCompanies(): Promise<{ companies: Company[]; source: string | null; error: string | null }> {
  if (!supabase) return { companies: [], source: null, error: 'Add your Supabase URL and publishable/anon key in .env, then restart the dev server.' };
  const candidates = ['companies', 'company_json', 'staging_company'];
  const errors: string[] = [];
  for (const table of candidates) {
    const { data, error } = await supabase.from(table).select('*').limit(500);
    if (!error && data) {
      const rows = data.map((r, i) => normalizeCompany(r as Record<string, unknown>, i));
      // Some JSON/staging tables have a wrapper row with no useful name; keep rows visible for diagnosis.
      return { companies: rows, source: table, error: null };
    }
    errors.push(`${table}: ${error?.message ?? 'unknown error'}`);
    if (error && !/does not exist|could not find the table|schema cache|42P01|PGRST205/i.test(error.message)) {
      return { companies: [], source: table, error: `${error.message} (Table: ${table})` };
    }
  }
  return { companies: [], source: null, error: `Could not read companies from the expected tables. ${errors.join(' | ')}` };
}

export async function testConnection() {
  if (!supabase) return { ok: false, message: 'Supabase credentials are missing in .env.' };
  const { error } = await supabase.from('companies').select('*', { head: true, count: 'exact' });
  if (!error) return { ok: true, message: 'Supabase connected. The companies table is readable.' };
  return { ok: false, message: error.message };
}
