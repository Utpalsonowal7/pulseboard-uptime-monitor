import { useEffect, useState, type FormEvent } from 'react';
import { X, Globe2 } from 'lucide-react';
import type { Monitor } from '../types';
import type { MonitorPayload } from '../services/monitors';

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
export function MonitorForm({ monitor, onClose, onSubmit, busy, apiError }: {
  monitor?: Monitor | null; onClose: () => void; onSubmit: (payload: MonitorPayload) => void; busy: boolean; apiError?: string;
}) {
  const [name, setName] = useState(monitor?.name ?? '');
  const [url, setUrl] = useState(monitor?.url ?? 'https://');
  const [slug, setSlug] = useState(monitor?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(Boolean(monitor));
  const [formError, setFormError] = useState('');
  useEffect(() => { if (!slugEdited) setSlug(slugify(name)); }, [name, slugEdited]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch { setFormError('Enter a complete website URL starting with http:// or https://'); return; }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { setFormError('Use lowercase letters, numbers, and hyphens for the public status URL.'); return; }
    setFormError('');
    onSubmit({ name: name.trim(), url: url.trim(), slug, ...(monitor ? { enabled: monitor.enabled } : {}) });
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="monitor-form-title">
      <button className="icon-button modal-close" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
      <div className="modal-icon"><Globe2 size={20} /></div>
      <p className="eyebrow">MONITOR SETUP</p>
      <h2 id="monitor-form-title">{monitor ? 'Edit monitor' : 'Add a monitor'}</h2>
      <p className="modal-description">PulseBoard will check your endpoint every 60 seconds and notify the dashboard when something changes.</p>
      <form onSubmit={submit} className="monitor-form">
        <label>Service name<input autoFocus required maxLength={100} placeholder="e.g. Marketing site" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>Website or API URL<input required type="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} /></label>
        <label>Public status page slug<div className="slug-field"><span>pulseboard.app/status/</span><input required maxLength={80} value={slug} onChange={(e) => { setSlugEdited(true); setSlug(slugify(e.target.value)); }} /></div></label>
        {(formError || apiError) && <p className="form-error">{formError || apiError}</p>}
        <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : monitor ? 'Save changes' : 'Create monitor'}</button></div>
      </form>
    </section>
  </div>;
}
