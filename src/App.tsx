import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, Building2, Check, CheckCircle2, ChevronDown, CircleHelp, Command, Database, Download, ExternalLink, FileSearch, Filter, Globe, GraduationCap, LayoutDashboard, LoaderCircle, MapPin, RefreshCw, Search, Settings2, ShieldCheck, Sparkles, Target, TrendingUp, Wifi, WifiOff, Table2, Server, KeyRound, CircleCheck, CircleAlert, BrainCircuit, BookOpen, Code2 } from 'lucide-react';
import { isSupabaseConfigured, loadCompanies, loadCompanySkills, testConnection, type Company, type CompanySkillRecord } from './lib/supabase';

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
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [researchSearch, setResearchSearch] = useState('');
  const [researchIndustry, setResearchIndustry] = useState('All industries');
  const [skillRecords, setSkillRecords] = useState<CompanySkillRecord[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [skillsSearch, setSkillsSearch] = useState('');
  const [selectedSkillCompany, setSelectedSkillCompany] = useState('');

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

  const refreshSkills = useCallback(async () => {
    setSkillsLoading(true);
    const result = await loadCompanySkills();
    setSkillRecords(result.skills);
    setSkillsError(result.error);
    setSkillsLoading(false);
  }, []);
  useEffect(() => { if (activeNav === 'Skills intelligence') void refreshSkills(); }, [activeNav, refreshSkills]);
  useEffect(() => {
    if (!skillRecords.length) { setSelectedSkillCompany(''); return; }
    if (!selectedSkillCompany || !skillRecords.some(record => String(record.id) === selectedSkillCompany)) {
      setSelectedSkillCompany(String(skillRecords[0].id));
    }
  }, [skillRecords, selectedSkillCompany]);

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
      <button className={`nav-item ${activeNav === 'Skills intelligence' ? 'active' : ''}`} onClick={() => setActiveNav('Skills intelligence')}><BrainCircuit size={18}/> Skills intelligence</button>
      <div className="sidebar-bottom"><div className="campus-card"><div className="campus-icon"><GraduationCap size={19}/></div><div><strong>JSS University</strong><span>Placement cell workspace</span></div><ChevronDown size={15}/></div><button className="nav-item" onClick={() => setShowSetup(true)}><Settings2 size={18}/> Setup & connection</button><div className="user-row"><div className="avatar">JI</div><div><strong>Placement Intelligence</strong><span>Student workspace</span></div><CircleHelp size={17}/></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <strong>{activeNav}</strong></div><div className="top-actions"><div className={`connection-pill ${connection}`}><span className="status-dot"/>{connection === 'connected' ? 'Supabase connected' : connection === 'demo' ? 'Setup required' : connection === 'error' ? 'Connection issue' : 'Connecting'}</div><button className="icon-button" aria-label="Refresh data" onClick={() => void refresh()}><RefreshCw size={17}/></button><div className="avatar top-avatar">JI</div></div></header>
      <div className="page-content">
        <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> CAMPUS RECRUITMENT INTELLIGENCE</div><h1>{activeNav === 'Overview' ? 'Placement overview' : activeNav}</h1><p className="subtitle">A clearer view of company research, hiring targets, and campus opportunities.</p></div><button className="button secondary" onClick={() => setShowSetup(true)}><Settings2 size={16}/> Configure data</button></div>

        {activeNav !== 'Companies' && connection !== 'connected' && <div className={`notice ${connection === 'error' ? 'notice-error' : ''}`}><div className="notice-icon">{connection === 'error' ? <WifiOff size={19}/> : <Database size={19}/>}</div><div className="notice-copy"><strong>{connection === 'error' ? 'Could not load Supabase data' : 'Connect your Supabase project'}</strong><p>{dbError || 'Checking connection…'} {connection === 'demo' ? 'The company list remains empty until you connect your database, so demo content is never confused with real records.' : ''}</p>{connection === 'error' && <button className="text-button" onClick={() => setShowSetup(true)}>Troubleshoot connection <ExternalLink size={13}/></button>}</div><button className="notice-action" onClick={() => setShowSetup(true)}>View setup <span>→</span></button></div>}


        {activeNav === 'Data sources' && <section className="sources-desk">
          <div className="sources-hero"><div className="sources-hero-copy"><div className="eyebrow"><Database size={14}/> DATA CONNECTIONS & QUALITY</div><h2>Know where your placement data comes from.</h2><p>Review connection status, company records available to CampusIntel, and checks to keep data reliable.</p></div><div className="sources-hero-mark"><Server size={30}/><span>SOURCE CONTROL</span></div></div>
          <div className="source-status-banner"><div className={'source-status-icon ' + connection}>{connection === 'connected' ? <CircleCheck size={21}/> : connection === 'checking' ? <LoaderCircle className="spin" size={21}/> : <CircleAlert size={21}/>}</div><div className="source-status-copy"><strong>{connection === 'connected' ? 'Supabase is responding' : connection === 'checking' ? 'Checking the database connection' : connection === 'demo' ? 'Database credentials need attention' : 'Could not read company records'}</strong><p>{connection === 'connected' ? 'CampusIntel successfully loaded company records from the configured source.' : dbError || 'Checking the configured Supabase connection.'}</p></div><button className="button secondary compact" onClick={() => void refresh()}><RefreshCw size={14}/> Test again</button></div>
          <div className="sources-metrics">
            <div className="source-metric"><span>CONNECTION</span><strong className={'source-state-text ' + connection}>{connection === 'connected' ? 'Connected' : connection === 'checking' ? 'Checking…' : connection === 'demo' ? 'Setup needed' : 'Needs review'}</strong><small>{isSupabaseConfigured ? 'Project credentials detected' : 'Project credentials not detected'}</small></div>
            <div className="source-metric"><span>RECORDS LOADED</span><strong>{loading ? '—' : companies.length.toLocaleString()}</strong><small>Company records returned by the query</small></div>
            <div className="source-metric"><span>ACTIVE SOURCE</span><strong className="source-table-name">{source || 'Not confirmed'}</strong><small>{source ? 'Resolved by the company loader' : 'Shown after a successful query'}</small></div>
          </div>
          <div className="sources-main-grid">
            <div className="panel source-details-panel"><div className="panel-header"><div><h2>Configured data source</h2><p>What CampusIntel is currently reading</p></div><div className="quick-symbol"><Database size={17}/></div></div>
              <div className="source-detail-row"><div className="source-detail-icon"><Server size={17}/></div><div><strong>Supabase database</strong><span>Primary provider for company records</span></div><span className={'source-chip ' + connection}>{connection === 'connected' ? 'Available' : 'Status unknown'}</span></div>
              <div className="source-detail-row"><div className="source-detail-icon"><Table2 size={17}/></div><div><strong>Company table / view</strong><span>{source || 'Not detected yet — run a connection check'}</span></div><span className={'source-chip ' + (companies.length ? 'connected' : 'error')}>{companies.length ? 'Has records' : 'No records loaded'}</span></div>
              <div className="source-detail-row"><div className="source-detail-icon"><KeyRound size={17}/></div><div><strong>Read access</strong><span>Uses the configured public key and database permissions</span></div><span className={'source-chip ' + (connection === 'connected' ? 'connected' : 'error')}>{connection === 'connected' ? 'Query passed' : 'Check access'}</span></div>
              <div className="source-panel-actions"><button className="button primary" onClick={() => setShowSetup(true)}><Settings2 size={15}/> Connection settings</button><button className="button secondary" onClick={() => void refresh()}><RefreshCw size={15}/> Refresh source</button></div>
            </div>
            <div className="panel source-quality-panel"><div className="panel-header"><div><h2>Data quality checks</h2><p>Based on currently loaded company rows</p></div><ShieldCheck size={19}/></div>
              <div className="quality-summary"><strong>{loading ? '—' : companies.length ? Math.round((companies.filter(c => Boolean(c.name && c.name.trim())).length + companies.filter(c => Boolean(c.website && c.website.trim())).length + companies.filter(c => Boolean(c.industry && c.industry.trim())).length) / (companies.length * 3) * 100) : 0}%</strong><span>field completeness indicator</span></div>
              <div className="quality-row"><div><span>Company names</span><small>{loading ? 'Checking…' : companies.filter(c => Boolean(c.name && c.name.trim())).length + ' of ' + companies.length + ' have a name'}</small></div><span className={'quality-pill ' + (!loading && companies.length && companies.every(c => Boolean(c.name && c.name.trim())) ? 'ok' : 'pending')}>{loading ? 'Checking' : companies.length && companies.every(c => Boolean(c.name && c.name.trim())) ? 'Complete' : 'Review'}</span></div>
              <div className="quality-row"><div><span>Industry labels</span><small>{loading ? 'Checking…' : companies.filter(c => Boolean(c.industry && c.industry.trim())).length + ' of ' + companies.length + ' specified'}</small></div><span className={'quality-pill ' + (!loading && companies.length && companies.every(c => Boolean(c.industry && c.industry.trim())) ? 'ok' : 'pending')}>{loading ? 'Checking' : companies.length && companies.every(c => Boolean(c.industry && c.industry.trim())) ? 'Complete' : 'Review'}</span></div>
              <div className="quality-row"><div><span>Website links</span><small>{loading ? 'Checking…' : companies.filter(c => Boolean(c.website && c.website.trim())).length + ' of ' + companies.length + ' specified'}</small></div><span className={'quality-pill ' + (!loading && companies.length && companies.every(c => Boolean(c.website && c.website.trim())) ? 'ok' : 'pending')}>{loading ? 'Checking' : companies.length && companies.every(c => Boolean(c.website && c.website.trim())) ? 'Complete' : 'Review'}</span></div>
              <p className="quality-note">Completeness is calculated from loaded records only; it does not verify that links work or company details are current.</p>
            </div>
          </div>
          <div className="panel source-next-steps"><div className="panel-header"><div><h2>Connection checklist</h2><p>Next steps if data is missing or stale</p></div></div><div className="source-checklist">
            <div><span className={isSupabaseConfigured ? 'check-done' : 'check-pending'}>{isSupabaseConfigured ? <Check size={13}/> : '1'}</span><section><strong>Credentials detected</strong><p>{isSupabaseConfigured ? 'The app found its configured Supabase URL and public key.' : 'Set the Supabase URL and public anon/publishable key in the project environment.'}</p></section></div>
            <div><span className={connection === 'connected' ? 'check-done' : 'check-pending'}>{connection === 'connected' ? <Check size={13}/> : '2'}</span><section><strong>Read query succeeds</strong><p>{connection === 'connected' ? 'A company query returned successfully.' : 'Check the configured table/view and SELECT permissions or Row Level Security policy.'}</p></section></div>
            <div><span className={companies.length ? 'check-done' : 'check-pending'}>{companies.length ? <Check size={13}/> : '3'}</span><section><strong>Company rows available</strong><p>{companies.length ? 'Company rows are available to the app.' : 'Confirm the source contains records and the query points to the intended table.'}</p></section></div>
          </div><div className="source-panel-actions"><button className="button secondary" onClick={() => setActiveNav('Companies')}><Building2 size={15}/> Open company directory</button><button className="button primary" onClick={() => setShowSetup(true)}><Settings2 size={15}/> View setup guide</button></div></div>
        </section>}

        {activeNav === 'Skills intelligence' && <section className="skills-desk">
          <div className="skills-hero"><div className="skills-hero-copy"><div className="eyebrow"><BrainCircuit size={14}/> ROLE READINESS & SKILL MAP</div><h2>Know what to learn before you apply.</h2><p>Explore the skill expectations stored for each company, compare core areas, and turn the gaps into a practical learning plan. These are database indicators, not guaranteed job requirements.</p></div><div className="skills-hero-mark"><BookOpen size={30}/><span>SKILL INTELLIGENCE</span></div></div>
          <div className="skills-stat-grid">
            <div className="skills-stat"><span>COMPANY PROFILES</span><strong>{skillsLoading ? '—' : skillRecords.length}</strong><small>Skill records returned by Supabase</small></div>
            <div className="skills-stat"><span>SKILL AREAS</span><strong>12</strong><small>Coding, DSA, OOP, SQL and more</small></div>
            <div className="skills-stat"><span>DATA SOURCE</span><strong className="skills-source">Supabase</strong><small>staging_company_skill_levels</small></div>
          </div>
          <div className="panel skills-explorer">
            <div className="panel-header"><div><h2>Company skill explorer</h2><p>Select a company to inspect its recorded skill levels.</p></div><button className="button secondary compact" onClick={() => void refreshSkills()}><RefreshCw size={14}/> Refresh</button></div>
            <div className="table-tools skills-tools"><label className="search-box"><Search size={17}/><input value={skillsSearch} onChange={e => setSkillsSearch(e.target.value)} placeholder="Search companies or skills…"/></label><label className="select-box skills-company-select"><Building2 size={15}/><select aria-label="Select company for skill profile" value={selectedSkillCompany} onChange={e => setSelectedSkillCompany(e.target.value)} disabled={skillsLoading || Boolean(skillsError) || skillRecords.length === 0}><option value="" disabled>{skillsLoading ? 'Loading companies…' : 'Choose a company'}</option>{skillRecords.filter(r => !skillsSearch.trim() || [r.companies,r.coding,r.data_structures_and_algorithms,r.object_oriented_programming_and_design,r.aptitude_and_problem_solving,r.communication_skills,r.ai_native_engineering,r.devops_and_cloud,r.sql_and_design,r.software_engineering,r.system_design_and_architecture,r.computer_networking,r.operating_system].some(v => String(v ?? '').toLowerCase().includes(skillsSearch.trim().toLowerCase()))).map(r => <option key={r.id} value={String(r.id)}>{r.companies || 'Unnamed company'}</option>)}</select></label></div>
            {skillsLoading && <div className="skills-empty"><LoaderCircle className="spin" size={22}/><strong>Loading skill intelligence</strong><p>Reading company skill records from Supabase.</p></div>}
            {!skillsLoading && skillsError && <div className="skills-empty"><CircleAlert size={24}/><strong>Could not load skill records</strong><p>{skillsError}</p><button className="button secondary compact" onClick={() => void refreshSkills()}>Try again</button></div>}
            {!skillsLoading && !skillsError && skillRecords.length === 0 && <div className="skills-empty"><BrainCircuit size={24}/><strong>No skill profiles available</strong><p>Check that the connected Supabase project contains the staging_company_skill_levels table and permits read access.</p></div>}
            {!skillsLoading && !skillsError && skillRecords.length > 0 && (() => {
              const filtered = skillRecords.filter(r => !skillsSearch || [r.companies,r.coding,r.data_structures_and_algorithms,r.object_oriented_programming_and_design,r.aptitude_and_problem_solving,r.communication_skills,r.ai_native_engineering,r.devops_and_cloud,r.sql_and_design,r.software_engineering,r.system_design_and_architecture,r.computer_networking,r.operating_system].some(v => String(v ?? '').toLowerCase().includes(skillsSearch.toLowerCase())));
              const chosen = filtered.find(r => String(r.id) === selectedSkillCompany) || filtered[0];
              const skillFields: [string, keyof CompanySkillRecord][] = [['Coding','coding'],['Data Structures & Algorithms','data_structures_and_algorithms'],['OOP & Design','object_oriented_programming_and_design'],['Aptitude & Problem Solving','aptitude_and_problem_solving'],['Communication','communication_skills'],['AI-native Engineering','ai_native_engineering'],['DevOps & Cloud','devops_and_cloud'],['SQL & Database Design','sql_and_design'],['Software Engineering','software_engineering'],['System Design','system_design_and_architecture'],['Computer Networking','computer_networking'],['Operating Systems','operating_system']];
              const parseLevel = (value: unknown) => { const m = String(value ?? '').match(/\d+/); return m ? Math.max(0,Math.min(10,Number(m[0]))) : 0; };
              const valueFor = (r: CompanySkillRecord, key: keyof CompanySkillRecord) => String(r[key] ?? 'Not specified');
              return <div className="skills-content">
                <div className="skills-selected-head"><div className="skills-company-mark">{chosen.companies.slice(0,1).toUpperCase()}</div><div><span>SELECTED COMPANY</span><h3>{chosen.companies}</h3><p>Recorded skill indicators from the connected database</p></div><span className="skills-count">{filtered.length} profiles match</span></div>
                <div className="skills-grid">{skillFields.map(([label,key]) => { const raw = valueFor(chosen,key); const level = parseLevel(raw); const has = raw !== 'Not specified' && raw !== ''; return <div className="skill-card" key={key}><div className="skill-card-top"><span>{label}</span><strong>{has ? raw : 'Not specified'}</strong></div><div className="skill-meter"><span style={{width: has ? (level*10)+'%' : '0%'}}/></div><small>{has ? 'Stored numeric indicator · scale not specified' : 'No rating recorded'}</small></div>})}</div>
                <div className="skills-plan"><div className="skills-plan-title"><div className="quick-symbol"><Target size={17}/></div><div><h3>How to use this profile</h3><p>Convert the recorded indicators into preparation steps.</p></div></div><div className="skills-plan-steps"><div><span>01</span><section><strong>Build core foundations</strong><p>Prioritise coding, DSA, OOP, aptitude and communication for broad placement readiness.</p></section></div><div><span>02</span><section><strong>Follow the role-specific stack</strong><p>Use SQL, cloud, AI or system design indicators to guide projects for your target role.</p></section></div><div><span>03</span><section><strong>Validate against job descriptions</strong><p>Confirm these database indicators against current official job postings; the scale is not a published company hiring rubric.</p></section></div></div></div>
              </div>;
            })()}
          </div>
        </section>}
        {activeNav === 'Research' && <section className="research-desk">
          <div className="research-hero">
            <div className="research-hero-copy"><div className="eyebrow"><Target size={14}/> EMPLOYER RESEARCH WORKSPACE</div><h2>Turn company data into a placement plan.</h2><p>Find relevant employers, build a shortlist, and open company profiles to review the details available in your database.</p></div>
            <div className="research-hero-mark"><TrendingUp size={31}/><span>RESEARCH DESK</span></div>
          </div>
          <div className="research-stat-grid">
            <div className="research-stat"><span>AVAILABLE EMPLOYERS</span><strong>{loading ? '—' : companies.length}</strong><small>Records from your connected source</small></div>
            <div className="research-stat"><span>SHORTLISTED</span><strong>{shortlist.length}</strong><small>Employers saved in this session</small></div>
            <div className="research-stat"><span>INDUSTRIES</span><strong>{new Set(companies.map(c => c.industry).filter(Boolean)).size}</strong><small>Distinct industry labels</small></div>
          </div>
          <div className="research-workspace">
            <div className="panel research-results">
              <div className="panel-header"><div><h2>Explore employers</h2><p>Search the actual company records and shortlist useful targets.</p></div><span className="research-live"><span/> {connection === 'connected' ? 'LIVE DATA' : 'DATA STATUS'}</span></div>
              <div className="table-tools research-tools"><label className="search-box"><Search size={17}/><input value={researchSearch} onChange={e => setResearchSearch(e.target.value)} placeholder="Search name, industry, location…"/></label><label className="select-box"><Filter size={15}/><select value={researchIndustry} onChange={e => setResearchIndustry(e.target.value)}>{industries.map(i => <option key={i}>{i}</option>)}</select></label></div>
              <div className="research-company-list">
                {loading && <div className="research-empty"><LoaderCircle className="spin" size={22}/><strong>Loading employer records</strong><p>Reading company data from your connected source.</p></div>}
                {!loading && companies.filter(c => { const term = researchSearch.toLowerCase().trim(); return (!term || [c.name,c.industry,c.location,c.description].some(v => String(v ?? '').toLowerCase().includes(term))) && (researchIndustry === 'All industries' || c.industry === researchIndustry); }).map((c,i) => {
                  const key = String(c.id ?? c.name);
                  const saved = shortlist.includes(key);
                  return <article className="research-company" key={key + '-' + i}><div className={`company-logo logo-${i % 6}`}>{c.name.slice(0,1).toUpperCase()}</div><div className="research-company-main"><strong>{c.name}</strong><div className="research-company-meta"><span>{c.industry || 'Industry not specified'}</span><span><MapPin size={12}/>{c.location || 'Location not specified'}</span></div><p>{c.description || 'No company description is available in this record yet.'}</p></div><div className="research-company-actions"><button className={`button ${saved ? 'primary' : 'secondary'} compact`} onClick={() => setShortlist(current => saved ? current.filter(v => v !== key) : [...current,key])}>{saved ? <><Check size={14}/> Shortlisted</> : <><Target size={14}/> Shortlist</>}</button><button className="research-open-link" onClick={() => setSelected(c)}>View profile <ExternalLink size={13}/></button></div></article>;
                })}
                {!loading && companies.filter(c => { const term = researchSearch.toLowerCase().trim(); return (!term || [c.name,c.industry,c.location,c.description].some(v => String(v ?? '').toLowerCase().includes(term))) && (researchIndustry === 'All industries' || c.industry === researchIndustry); }).length === 0 && <div className="research-empty"><div className="empty-illustration"><FileSearch size={23}/></div><strong>{companies.length ? 'No employers match your filters' : 'No employer records available'}</strong><p>{companies.length ? 'Try a different search or choose All industries.' : connection === 'connected' ? 'The connected source returned no company records. Check the selected source table and permissions.' : 'Connect the Supabase project and confirm table read permissions to start researching real employers.'}</p>{!companies.length && <button className="button secondary compact" onClick={() => setShowSetup(true)}><Settings2 size={14}/> Check data connection</button>}</div>}
              </div>
            </div>
            <aside className="research-side">
              <div className="panel shortlist-panel"><div className="panel-header"><div><h2>Your shortlist</h2><p>Employers to investigate further</p></div><div className="quick-symbol"><CheckCircle2 size={17}/></div></div>
                {shortlist.length ? <div className="shortlist-items">{companies.filter(c => shortlist.includes(String(c.id ?? c.name))).map(c => <div className="shortlist-item" key={String(c.id ?? c.name)}><span className="shortlist-dot"/><div><strong>{c.name}</strong><span>{c.industry || 'Industry not specified'}</span></div><button aria-label={`Remove ${c.name} from shortlist`} onClick={() => setShortlist(current => current.filter(v => v !== String(c.id ?? c.name)))}>×</button></div>)}</div> : <div className="shortlist-empty"><Target size={22}/><strong>Your research list starts here</strong><p>Use “Shortlist” on an employer card. Your selected targets will appear here while this page is open.</p></div>}
                <div className="shortlist-foot"><span>{shortlist.length} selected</span><button disabled={!shortlist.length} onClick={() => setShortlist([])}>Clear list</button></div>
              </div>
              <div className="panel research-guide"><div className="quick-heading"><div className="quick-symbol"><Sparkles size={17}/></div><div><h2>Suggested workflow</h2><p>A practical way to use this desk</p></div></div><div className="research-step"><span>01</span><div><strong>Filter by industry</strong><p>Start with sectors related to your target roles.</p></div></div><div className="research-step"><span>02</span><div><strong>Review company profiles</strong><p>Check available location, website and description fields.</p></div></div><div className="research-step"><span>03</span><div><strong>Build a focused shortlist</strong><p>Keep promising employers together for follow-up research.</p></div></div><button className="button secondary full" onClick={() => setActiveNav('Companies')}><Building2 size={15}/> Open full company directory</button></div>
            </aside>
          </div>
        </section>}

        {activeNav !== 'Companies' && activeNav !== 'Research' && <section className="metrics-grid">
          <Metric label="Companies in database" value={loading ? '—' : companies.length.toLocaleString()} note={source ? `Loaded from ${source}` : 'Live database records'} icon={<Building2 size={19}/>} trend="database" />
          <Metric label="Industries represented" value={loading ? '—' : new Set(companies.map(c => c.industry).filter(v => v && v !== 'Not specified')).size.toString()} note="Distinct industry labels" icon={<Activity size={19}/>} trend="neutral" />
          <Metric label="Records with website" value={loading ? '—' : companies.filter(c => c.website).length.toLocaleString()} note="Company profiles with links" icon={<ExternalLink size={19}/>} trend="neutral" />
          <Metric label="Data connection" value={connection === 'connected' ? 'Healthy' : connection === 'checking' ? 'Checking' : connection === 'demo' ? 'Pending' : 'Needs review'} note={connection === 'connected' ? 'Supabase query succeeded' : 'Check URL, key and table access'} icon={<ShieldCheck size={19}/>} trend={connection === 'connected' ? 'good' : 'neutral'} />
        </section>}

        <section className={`content-grid ${activeNav === 'Companies' ? 'companies-view' : ''}`} style={activeNav === 'Research' || activeNav === 'Data sources' || activeNav === 'Skills intelligence' ? { display: 'none' } : undefined}>
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
