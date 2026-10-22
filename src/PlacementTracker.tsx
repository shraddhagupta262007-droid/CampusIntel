import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  CalendarDays,
  ClipboardList,
  Download,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

type ApplicationStage =
  | 'Interested'
  | 'Applied'
  | 'Assessment'
  | 'Interview'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn';

type ApplicationRecord = {
  id: string;
  company: string;
  role: string;
  stage: ApplicationStage;
  dateApplied: string;
  followUpDate: string;
  jobUrl: string;
  nextAction: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type ApplicationDraft = Omit<ApplicationRecord, 'id' | 'createdAt' | 'updatedAt'>;

const STORAGE_KEY = 'campusintel:applications:v1';
const stages: ApplicationStage[] = [
  'Interested',
  'Applied',
  'Assessment',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
];

const closedStages: ApplicationStage[] = ['Offer', 'Rejected', 'Withdrawn'];

function todayLocal(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function emptyDraft(): ApplicationDraft {
  return {
    company: '',
    role: '',
    stage: 'Interested',
    dateApplied: '',
    followUpDate: '',
    jobUrl: '',
    nextAction: '',
    notes: '',
  };
}

function isApplicationStage(value: unknown): value is ApplicationStage {
  return typeof value === 'string' && stages.includes(value as ApplicationStage);
}

function readApplications(value: unknown): ApplicationRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is ApplicationRecord => {
    if (!entry || typeof entry !== 'object') return false;
    const item = entry as Partial<ApplicationRecord>;
    const stringFields: (keyof ApplicationRecord)[] = [
      'id', 'company', 'role', 'dateApplied', 'followUpDate', 'jobUrl',
      'nextAction', 'notes', 'createdAt', 'updatedAt',
    ];
    return stringFields.every((key) => typeof item[key] === 'string') && isApplicationStage(item.stage);
  });
}

function safeCsvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[\s]*[=+@\-\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function formatDate(value: string): string {
  if (!value) return 'Not set';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function normaliseJobUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export default function PlacementTracker({ companyNames = [] }: { companyNames?: string[] }) {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All stages');
  const [draft, setDraft] = useState<ApplicationDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setApplications(readApplications(JSON.parse(raw)));
    } catch {
      setStorageAvailable(false);
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady || !storageAvailable) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    } catch {
      setStorageAvailable(false);
    }
  }, [applications, storageReady, storageAvailable]);

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...applications]
      .filter((item) => stageFilter === 'All stages' || item.stage === stageFilter)
      .filter((item) => {
        if (!term) return true;
        return [item.company, item.role, item.stage, item.nextAction, item.notes]
          .some((value) => value.toLowerCase().includes(term));
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [applications, search, stageFilter]);

  const activeCount = applications.filter((item) => !closedStages.includes(item.stage)).length;
  const interviewCount = applications.filter((item) => item.stage === 'Interview' || item.stage === 'Assessment').length;
  const followUpCount = applications.filter(
    (item) => Boolean(item.followUpDate) && !closedStages.includes(item.stage)
  ).length;

  const resetForm = () => {
    setDraft(emptyDraft());
    setEditingId(null);
    setFormError('');
    setSavedNotice('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setSavedNotice('');

    const company = draft.company.trim();
    const role = draft.role.trim();
    if (!company || !role) {
      setFormError('Company and role are required.');
      return;
    }

    const jobUrl = normaliseJobUrl(draft.jobUrl);
    if (jobUrl === null) {
      setFormError('Enter a valid job link, such as https://example.com/careers.');
      return;
    }

    const now = new Date().toISOString();
    const existing = editingId ? applications.find((item) => item.id === editingId) : undefined;
    const nextRecord: ApplicationRecord = {
      ...draft,
      company,
      role,
      jobUrl,
      nextAction: draft.nextAction.trim(),
      notes: draft.notes.trim(),
      id: existing?.id ?? (window.crypto?.randomUUID?.() || `application-${Date.now()}`),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    setApplications((current) => {
      const remaining = current.filter((item) => item.id !== nextRecord.id);
      return [nextRecord, ...remaining];
    });
    setDraft(emptyDraft());
    setEditingId(null);
    setSavedNotice(existing ? 'Application updated.' : 'Application added to your tracker.');
  };

  const startEdit = (item: ApplicationRecord) => {
    setDraft({
      company: item.company,
      role: item.role,
      stage: item.stage,
      dateApplied: item.dateApplied,
      followUpDate: item.followUpDate,
      jobUrl: item.jobUrl,
      nextAction: item.nextAction,
      notes: item.notes,
    });
    setEditingId(item.id);
    setFormError('');
    setSavedNotice('');
    document.getElementById('placement-tracker-form')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const changeStage = (id: string, stage: ApplicationStage) => {
    const updatedAt = new Date().toISOString();
    setApplications((current) => current.map((item) => item.id === id ? { ...item, stage, updatedAt } : item));
  };

  const deleteApplication = (id: string) => {
    setApplications((current) => current.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
  };

  const exportApplications = () => {
    const header = ['Company', 'Role', 'Stage', 'Date Applied', 'Follow-up Date', 'Job Link', 'Next Action', 'Notes'];
    const rows = filteredApplications.map((item) => [
      item.company, item.role, item.stage, item.dateApplied, item.followUpDate,
      item.jobUrl, item.nextAction, item.notes,
    ]);
    const csv = [header, ...rows].map((row) => row.map(safeCsvCell).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'campusintel-application-tracker.csv';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section className="placement-tracker">
      <div className="tracker-hero">
        <div className="tracker-hero-copy">
          <div className="eyebrow"><ClipboardList size={14} /> APPLICATIONS & FOLLOW-UPS</div>
          <h2>Keep every opportunity moving.</h2>
          <p>Track roles you are interested in, applications you have sent, assessments, interviews, and the next action for each one.</p>
        </div>
        <div className="tracker-hero-mark"><ClipboardList size={29} /><span>YOUR PLACEMENT PIPELINE</span></div>
      </div>

      <div className="tracker-local-note">
        <span className="tracker-local-dot" />
        <p>
          {storageAvailable
            ? 'Saved in this browser on this device. Entries are not sent to Supabase and will not sync across devices.'
            : 'Browser storage is unavailable. You can use this tracker for the current page, but changes may not survive a refresh.'}
        </p>
      </div>

      <div className="tracker-stats">
        <div className="tracker-stat"><span>TRACKED ROLES</span><strong>{applications.length}</strong><small>Applications and saved opportunities</small></div>
        <div className="tracker-stat"><span>ACTIVE</span><strong>{activeCount}</strong><small>Not yet closed</small></div>
        <div className="tracker-stat"><span>ASSESSMENTS / INTERVIEWS</span><strong>{interviewCount}</strong><small>Current stage is assessment or interview</small></div>
        <div className="tracker-stat"><span>FOLLOW-UP DATES SET</span><strong>{followUpCount}</strong><small>Active roles with a follow-up date</small></div>
      </div>

      <div className="tracker-workspace">
        <div className="panel tracker-form-panel" id="placement-tracker-form">
          <div className="panel-header">
            <div>
              <h2>{editingId ? 'Edit opportunity' : 'Add an opportunity'}</h2>
              <p>Capture the role, current stage, and next action.</p>
            </div>
          </div>
          <form className="tracker-form" onSubmit={handleSubmit}>
            <label className="tracker-field">
              <span>Company <b>*</b></span>
              <input value={draft.company} onChange={(event) => setDraft((current) => ({ ...current, company: event.target.value }))} list="campusintel-company-suggestions" placeholder="e.g. Microsoft" maxLength={120} required />
              <datalist id="campusintel-company-suggestions">
                {Array.from(new Set(companyNames)).map((company) => <option value={company} key={company} />)}
              </datalist>
            </label>
            <label className="tracker-field">
              <span>Role / internship <b>*</b></span>
              <input value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))} placeholder="e.g. Software Engineer Intern" maxLength={160} required />
            </label>
            <div className="tracker-form-row">
              <label className="tracker-field">
                <span>Current stage</span>
                <select value={draft.stage} onChange={(event) => setDraft((current) => ({ ...current, stage: event.target.value as ApplicationStage }))}>
                  {stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                </select>
              </label>
              <label className="tracker-field">
                <span>Date applied</span>
                <input type="date" value={draft.dateApplied} max={todayLocal()} onChange={(event) => setDraft((current) => ({ ...current, dateApplied: event.target.value }))} />
              </label>
            </div>
            <label className="tracker-field">
              <span>Job / careers link</span>
              <input type="url" value={draft.jobUrl} onChange={(event) => setDraft((current) => ({ ...current, jobUrl: event.target.value }))} placeholder="https://company.com/careers" maxLength={500} />
            </label>
            <label className="tracker-field">
              <span>Next action</span>
              <input value={draft.nextAction} onChange={(event) => setDraft((current) => ({ ...current, nextAction: event.target.value }))} placeholder="e.g. Practise SQL joins; ask for referral" maxLength={220} />
            </label>
            <label className="tracker-field">
              <span>Follow-up date</span>
              <input type="date" value={draft.followUpDate} onChange={(event) => setDraft((current) => ({ ...current, followUpDate: event.target.value }))} />
            </label>
            <label className="tracker-field">
              <span>Notes</span>
              <textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Referral contact, assessment topics, or questions for the recruiter" rows={3} maxLength={2000} />
            </label>
            {formError && <p className="tracker-form-message tracker-form-error" role="alert">{formError}</p>}
            {savedNotice && <p className="tracker-form-message tracker-form-success" role="status">{savedNotice}</p>}
            <div className="tracker-form-actions">
              <button className="button primary" type="submit"><Plus size={15} /> {editingId ? 'Save changes' : 'Add to tracker'}</button>
              {editingId && <button className="button secondary" type="button" onClick={resetForm}><X size={15} /> Cancel edit</button>}
            </div>
          </form>
        </div>

        <div className="panel tracker-list-panel">
          <div className="panel-header tracker-list-heading">
            <div><h2>Your opportunities</h2><p>{applications.length} saved record{applications.length === 1 ? '' : 's'} on this device.</p></div>
            <button className="button secondary compact" type="button" onClick={exportApplications} disabled={!filteredApplications.length}><Download size={14} /> Export CSV</button>
          </div>
          <div className="tracker-filters">
            <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, role, or next action" aria-label="Search tracked opportunities" /></label>
            <label className="select-box"><span className="tracker-filter-label">Stage</span><select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} aria-label="Filter opportunities by stage"><option>All stages</option>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
          </div>
          <div className="tracker-record-list">
            {!storageReady && <div className="tracker-empty"><strong>Loading saved opportunities</strong><p>Reading this browser's saved tracker.</p></div>}
            {storageReady && filteredApplications.map((item) => (
              <article className="tracker-record" key={item.id}>
                <div className="tracker-record-top">
                  <div className="tracker-company-mark">{item.company.slice(0, 1).toUpperCase()}</div>
                  <div className="tracker-record-title"><h3>{item.company}</h3><p>{item.role}</p></div>
                  {item.jobUrl && <a className="tracker-job-link" href={item.jobUrl} target="_blank" rel="noreferrer" aria-label={`Open job link for ${item.company}`}><ExternalLink size={15} /></a>}
                </div>
                <div className="tracker-record-meta">
                  <label className="tracker-stage-control"><span>Stage</span><select value={item.stage} onChange={(event) => changeStage(item.id, event.target.value as ApplicationStage)} aria-label={`Change stage for ${item.company} - ${item.role}`}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
                  <div className="tracker-date-meta"><CalendarDays size={14} /><span>Applied: {formatDate(item.dateApplied)}</span></div>
                  {item.followUpDate && <div className={item.followUpDate < todayLocal() && !closedStages.includes(item.stage) ? 'tracker-date-meta is-overdue' : 'tracker-date-meta'}><CalendarDays size={14} /><span>Follow-up: {formatDate(item.followUpDate)}</span></div>}
                </div>
                {item.nextAction && <div className="tracker-next-action"><strong>Next action</strong><p>{item.nextAction}</p></div>}
                {item.notes && <details className="tracker-notes"><summary>Notes</summary><p>{item.notes}</p></details>}
                <div className="tracker-record-actions">
                  <span>Updated {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(item.updatedAt))}</span>
                  <div><button className="button secondary compact" type="button" onClick={() => startEdit(item)}>Edit</button><button className="tracker-delete" type="button" onClick={() => deleteApplication(item.id)} aria-label={`Delete ${item.company} - ${item.role}`}><Trash2 size={15} /> Delete</button></div>
                </div>
              </article>
            ))}
            {storageReady && filteredApplications.length === 0 && (
              <div className="tracker-empty">
                <div className="tracker-empty-mark"><ClipboardList size={23} /></div>
                <strong>{applications.length ? 'No matching opportunities' : 'Start with one real opportunity'}</strong>
                <p>{applications.length ? 'Change the search or stage filter to see your other records.' : 'Add an internship or job you want to pursue, then record every follow-up and stage change here.'}</p>
                {applications.length > 0 && <button className="button secondary compact" type="button" onClick={() => { setSearch(''); setStageFilter('All stages'); }}>Clear filters</button>}
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="tracker-footnote">Tip: add a specific next action and date, such as “finish the SQL practice set by Friday”. A tracker is a reminder tool, not a guarantee of selection.</p>
    </section>
  );
}
