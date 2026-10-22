import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, Building2, Check, ChevronDown, CircleHelp, Command, Database, Download, ExternalLink, FileSearch, Filter, GraduationCap, LayoutDashboard, LoaderCircle, MapPin, RefreshCw, Search, Settings2, ShieldCheck, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { isSupabaseConfigured, loadCompanies, testConnection, type Company } from './lib/supabase';

const demoCompanies: Company[] = [
  { id: 1, name: 'Accenture', industry: 'IT Services & Consulting', location: 'Bengaluru, India', website: 'https://www.accenture.com', description: 'Technology services, consulting and digital transformation.' },
  { id: 2, name: 'Microsoft', industry: 'Software & Cloud', location: 'Hyderabad, India', website: 'https://www.microsoft.com', description: 'Cloud computing, enterprise software and AI.' },
  { id: 3, name: 'Deloitte', industry: 'Consulting', location: 'Gurugram, India', website: 'https://www.deloitte.com', description: 'Consulting, risk advisory, audit and technology.' },
  { id: 4, name: 'Adobe', industry: 'Software', location: 'Noida, India', website: 'https://www.adobe.com', description: 'Digital media, creative software and digital experience.' },
  { id: 5, name: 'Amazon', industry: 'Technology & E-commerce', location: 'Bengaluru, India', website: 'https://www.amazon.jobs', description: 'E-commerce, cloud infrastructure and consumer technology.' },
  { id: 6, name: 'TCS', industry: 'IT Services', location: 'Noida, India', website: 'https://www.tcs.com', description: 'IT services, consulting and business solutions.' },
];

function App() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [connection, setConnection] = useState<'checking' | 'connected' | 'error' | 'demo'>('checking');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('All industries');
  const [activeNav, setActiveNav] = useState('Overview');
  const [selected, setSelected] = useState<Company | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      setCompanies([]); setConnection('demo'); setSource(null);
      setDbError('Credentials not set. Demo preview is shown; no database data is being presented as live.');
      setLoading(false); return;
    }
    const result = await loadCompanies();
    if (result.error) {
      setCompanies([]); setConnection('error'); setDbError(result.error); setSource(result.source);
    } else {
      setCompanies(result.companies); setSource(result.source); setDbError(null); setConnection('connected');
    }
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const visibleCompanies = useMemo(() => companies.filter(c => {
    const term = search.toLowerCase().trim();
    const matchesSearch = !term || [c.name, c.industry, c.location, c.description].some(v => String(v ?? '').toLowerCase().includes(term));
    const matchesIndustry = industry === 'All industries' || c.industry === industry;
    return matchesSearch && matchesIndustry;
  }), [companies, search, industry]);
  const industries = useMemo(() => ['All industries', ...Array.from(new Set(companies.map(c => c.industry || 'Not specified'))).sort()], [companies]);

  const exportCsv = () => {
    const rows = [['Company', 'Industry', 'Location', 'Website', 'Description'], ...visibleCompanies.map(c => [c.name, c.industry || '', c.location || '', c.website || '', c.description || ''])];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'placement-companies.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Command size={20}/></div><div><strong>CampusIntel</strong><span>PLACEMENT INTELLIGENCE</span></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <button className={`nav-item ${activeNav === 'Overview' ? 'active' : ''}`} onClick={() => setActiveNav('Overview')}><LayoutDashboard size={18}/> Overview</button>
      <button className={`nav-item ${activeNav === 'Companies' ? 'active' : ''}`} onClick={() => setActiveNav('Companies')}><Building2 size={18}/> Companies <span className="nav-count">{companies.length}</span></button>
      <button className={`nav-item ${activeNav === 'Research' ? 'active' : ''}`} onClick={() => setActiveNav('Research')}><FileSearch size={18}/> Research desk</button>
      <button className={`nav-item ${activeNav === 'Data sources' ? 'active' : ''}`} onClick={() => setActiveNav('Data sources')}><Database size={18}/> Data sources</button>
      <div className="sidebar-bottom"><div className="campus-card"><div className="campus-icon"><GraduationCap size={19}/></div><div><strong>JSS University</strong><span>Placement cell workspace</span></div><ChevronDown size={15}/></div><button className="nav-item" onClick={() => setShowSetup(true)}><Settings2 size={18}/> Setup & connection</button><div className="user-row"><div className="avatar">JI</div><div><strong>Placement Intelligence</strong><span>Student workspace</span></div><CircleHelp size={17}/></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <strong>{activeNav}</strong></div><div className="top-actions"><div className={`connection-pill ${connection}`}><span className="status-dot"/>{connection === 'connected' ? 'Supabase connected' : connection === 'demo' ? 'Setup required' : connection === 'error' ? 'Connection issue' : 'Connecting'}</div><button className="icon-button" aria-label="Refresh data" onClick={() => void refresh()}><RefreshCw size={17}/></button><div className="avatar top-avatar">JI</div></div></header>
      <div className="page-content">
        <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> CAMPUS RECRUITMENT INTELLIGENCE</div><h1>{activeNav === 'Overview' ? 'Placement overview' : activeNav}</h1><p className="subtitle">A clearer view of company research, hiring targets, and campus opportunities.</p></div><button className="button secondary" onClick={() => setShowSetup(true)}><Settings2 size={16}/> Configure data</button></div>

        {activeNav !== 'Companies' && connection !== 'connected' && <div className={`notice ${connection === 'error' ? 'notice-error' : ''}`}><div className="notice-icon">{connection === 'error' ? <WifiOff size={19}/> : <Database size={19}/>}</div><div className="notice-copy"><strong>{connection === 'error' ? 'Could not load Supabase data' : 'Connect your Supabase project'}</strong><p>{dbError || 'Checking connection…'} {connection === 'demo' ? 'The company list remains empty until you connect your database, so demo content is never confused with real records.' : ''}</p>{connection === 'error' && <button className="text-button" onClick={() => setShowSetup(true)}>Troubleshoot connection <ExternalLink size={13}/></button>}</div><button className="notice-action" onClick={() => setShowSetup(true)}>View setup <span>→</span></button></div>}

        {activeNav !== 'Companies' && <section className="metrics-grid">
          <Metric label="Companies in database" value={loading ? '—' : companies.length.toLocaleString()} note={source ? `Loaded from ${source}` : 'Live database records'} icon={<Building2 size={19}/>} trend="database" />
          <Metric label="Industries represented" value={loading ? '—' : new Set(companies.map(c => c.industry).filter(v => v && v !== 'Not specified')).size.toString()} note="Distinct industry labels" icon={<Activity size={19}/>} trend="neutral" />
          <Metric label="Records with website" value={loading ? '—' : companies.filter(c => c.website).length.toLocaleString()} note="Company profiles with links" icon={<ExternalLink size={19}/>} trend="neutral" />
          <Metric label="Data connection" value={connection === 'connected' ? 'Healthy' : connection === 'checking' ? 'Checking' : connection === 'demo' ? 'Pending' : 'Needs review'} note={connection === 'connected' ? 'Supabase query succeeded' : 'Check URL, key and table access'} icon={<ShieldCheck size={19}/>} trend={connection === 'connected' ? 'good' : 'neutral'} />
        </section>}

        <section className={`content-grid ${activeNav === 'Companies' ? 'companies-view' : ''}`}>
          {activeNav === 'Companies' && <div className="companies-intro"><div className="eyebrow"><Building2 size={14}/> PLACEMENT DIRECTORY</div><h2>All companies</h2><p>Search, filter, and open individual company profiles. Showing records loaded from your connected database.</p></div>}
          <div className="panel company-panel"><div className="panel-header"><div><h2>Company directory</h2><p>Browse the companies available to your placement team.</p></div><button className="button secondary compact" onClick={exportCsv} disabled={!visibleCompanies.length}><Download size={15}/> Export CSV</button></div>
            <div className="table-tools"><label className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies, sectors, locations…"/></label><label className="select-box"><Filter size={15}/><select value={industry} onChange={e => setIndustry(e.target.value)}>{industries.map(i => <option key={i}>{i}</option>)}</select></label></div>
            <div className="table-wrap"><table><thead><tr><th>COMPANY</th><th>INDUSTRY</th><th>LOCATION</th><th>PROFILE</th></tr></thead><tbody>
              {loading && <tr><td colSpan={4} className="empty-cell"><LoaderCircle className="spin" size={22}/> Loading company records…</td></tr>}
              {!loading && visibleCompanies.map((c, i) => <tr key={`${c.id}-${i}`} onClick={() => setSelected(c)} className="company-row"><td><div className="company-name-cell"><div className={`company-logo logo-${i % 6}`}>{c.name.slice(0, 1).toUpperCase()}</div><div><strong>{c.name}</strong><span>ID · {c.id}</span></div></div></td><td><span className="industry-tag">{c.industry || 'Not specified'}</span></td><td><span className="location-cell"><MapPin size={13}/>{c.location || 'Not specified'}</span></td><td><button className="open-row" aria-label={`View ${c.name}`}><ExternalLink size={15}/></button></td></tr>)}
              {!loading && visibleCompanies.length === 0 && <tr><td colSpan={4}><div className="empty-state"><div className="empty-illustration"><Building2 size={23}/></div><strong>{search || industry !== 'All industries' ? 'No matching companies' : 'No company records loaded yet'}</strong><p>{search || industry !== 'All industries' ? 'Try another search or clear the industry filter.' : 'Once the Supabase connection and table permissions are set, your records will appear here.'}</p>{!search && industry === 'All industries' && <button className="button primary small" onClick={() => setShowSetup(true)}>Check connection setup</button>}</div></td></tr>}
            </tbody></table></div><div className="table-footer"><span>Showing <strong>{visibleCompanies.length}</strong> of <strong>{companies.length}</strong> records</span><span>{source ? `Source table: ${source}` : 'Source: Supabase'}</span></div>
          </div>
          {activeNav !== 'Companies' && <div className="right-column"><div className="panel status-panel"><div className="panel-header"><div><h2>Data health</h2><p>Connection diagnostics</p></div><div className={`health-icon ${connection}`}><Activity size={18}/></div></div><div className="health-status"><div className={`health-big-dot ${connection}`}/><div><strong>{connection === 'connected' ? 'Connected and readable' : connection === 'checking' ? 'Checking connection' : connection === 'demo' ? 'Waiting for credentials' : 'Needs attention'}</strong><span>{connection === 'connected' ? 'Your app can query Supabase.' : 'Review the connection settings below.'}</span></div></div><div className="health-list"><HealthRow label="Environment variables" ok={isSupabaseConfigured}/><HealthRow label="Database query" ok={connection === 'connected'}/><HealthRow label="Company records" ok={companies.length > 0}/></div><button className="button secondary full" onClick={() => void refresh()}><RefreshCw size={15}/> Recheck connection</button></div>
            <div className="panel quick-panel"><div className="quick-heading"><div className="quick-symbol"><Sparkles size={17}/></div><div><h2>Research workflow</h2><p>Make your company data useful.</p></div></div><div className="workflow-step"><div className="step-number">01</div><div><strong>Verify company profiles</strong><span>Check website, sector and location fields.</span></div></div><div className="workflow-step"><div className="step-number">02</div><div><strong>Find priority employers</strong><span>Search and filter the current company list.</span></div></div><div className="workflow-step"><div className="step-number">03</div><div><strong>Export a working list</strong><span>Download filtered records as CSV.</span></div></div><div className="quick-foot"><Check size={15}/> Built for real records, not hard-coded sample data.</div></div>
          </div>}
        </section>
        <footer className="footer"><span>CampusIntel <span className="footer-dot">·</span> Placement Intelligence</span><span>Private workspace <span className="footer-dot">·</span> Supabase-backed</span></footer>
      </div>
    </main>

    {showSetup && <div className="modal-backdrop" onClick={() => setShowSetup(false)}><div className="setup-modal" onClick={e => e.stopPropagation()}><div className="modal-top"><div className="modal-icon"><Database size={21}/></div><button className="icon-button" onClick={() => setShowSetup(false)}>✕</button></div><h2>Connect your Supabase project</h2><p className="modal-subtitle">This project already includes the Supabase client and database-loading logic. Add credentials once; you should not need to edit source code.</p><ol className="setup-list"><li><span>1</span><div><strong>Create your local env file</strong><p>Copy <code>.env.example</code> to <code>.env</code> in the project root.</p></div></li><li><span>2</span><div><strong>Paste your project credentials</strong><p><code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> (publishable/anon key only).</p></div></li><li><span>3</span><div><strong>Restart the dev server</strong><p>Stop and rerun <code>npm run dev</code>. The app tries <code>staging_company_directory_public</code> first, then the other available company tables/views.</p></div></li><li><span>4</span><div><strong>Confirm read permissions</strong><p>Your chosen table must allow SELECT for the role used by the app, typically through a suitable RLS policy.</p></div></li></ol><div className="security-note"><ShieldCheck size={17}/><p>Never put a <strong>service_role</strong> key in this frontend. Use the publishable/anon key with proper Row Level Security.</p></div><div className="modal-actions"><a className="button secondary" href="https://supabase.com/dashboard/project/rmeamcstlsjalixgnrgg/settings/api-keys" target="_blank" rel="noreferrer">Open API keys <ExternalLink size={14}/></a><button className="button primary" onClick={() => { setShowSetup(false); void refresh(); }}>Recheck setup <RefreshCw size={14}/></button></div></div></div>}
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="setup-modal profile-modal" onClick={e => e.stopPropagation()}><div className="modal-top"><div className="company-logo large-logo">{selected.name.slice(0, 1).toUpperCase()}</div><button className="icon-button" onClick={() => setSelected(null)}>✕</button></div><h2>{selected.name}</h2><p className="modal-subtitle">Company profile from {source || 'the connected data source'}.</p><div className="profile-fields"><ProfileField label="Industry" value={selected.industry}/><ProfileField label="Location" value={selected.location}/><ProfileField label="Website" value={selected.website} link={selected.website}/><ProfileField label="Description" value={selected.description}/><ProfileField label="Record ID" value={String(selected.id)}/></div>{selected.raw && <details className="raw-details"><summary>View raw database fields</summary><pre>{JSON.stringify(selected.raw, null, 2)}</pre></details>}<div className="modal-actions"><button className="button secondary" onClick={() => setSelected(null)}>Close</button>{selected.website && <a className="button primary" href={selected.website.startsWith('http') ? selected.website : `https://${selected.website}`} target="_blank" rel="noreferrer">Visit website <ExternalLink size={14}/></a>}</div></div></div>}
  </div>;
}

function Metric({ label, value, note, icon, trend }: { label: string; value: string; note: string; icon: React.ReactNode; trend: string }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><div className="metric-icon">{icon}</div></div><div className="metric-value">{value}</div><div className="metric-note">{trend === 'good' ? <ArrowUpRight size={14} className="green-icon"/> : trend === 'database' ? <Database size={13}/> : <ArrowDownRight size={13}/>}<span>{note}</span></div></div>;
}
function HealthRow({ label, ok }: { label: string; ok: boolean }) { return <div className="health-row"><span>{label}</span><span className={`health-badge ${ok ? 'ok' : 'pending'}`}>{ok ? <><Check size={12}/> OK</> : 'Pending'}</span></div>; }
function ProfileField({ label, value, link }: { label: string; value?: string; link?: string }) { return <div className="profile-field"><span>{label}</span>{link && value ? <a href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer">{value} <ExternalLink size={12}/></a> : <strong>{value || 'Not available'}</strong>}</div>; }

export default App;
