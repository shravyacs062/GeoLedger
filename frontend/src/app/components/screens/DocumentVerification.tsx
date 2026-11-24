import { useEffect, useMemo, useState } from 'react';
import { FileCheck2, RefreshCw, Search, ShieldCheck } from 'lucide-react';

import { api } from '../../../services/api';
import { Layout } from '../Layout';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';

type Application = { id: string; survey_number: string; application_type: string; applicant_email?: string; applicant_wallet?: string; property_details?: { village?: string; taluk?: string; district?: string } };
type Document = { id: string; document_type: string; filename: string; verification_status: string; verification_notes?: string; document_hash: string; extracted_fields?: Record<string, string>; verification_checks?: Array<{ name: string; passed: boolean; message: string; severity: string }> };

export function DocumentVerification() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationId, setApplicationId] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    api.applications.list().then((items) => { if (active) setApplications(items); })
      .catch((reason) => { if (active) setError(reason?.response?.data?.message || 'Unable to load applications for review.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return applications.slice(0, 8);
    return applications.filter((application) => [
      application.id, application.survey_number, application.application_type,
      application.applicant_email, application.applicant_wallet,
      application.property_details?.village, application.property_details?.taluk, application.property_details?.district,
    ].some((value) => String(value || '').toLowerCase().includes(q))).slice(0, 12);
  }, [applications, query]);

  const selectApplication = (id: string) => { setApplicationId(id); setQuery(''); setNotice(''); setError(''); };

  useEffect(() => {
    let active = true;
    if (!applicationId) { setDocuments([]); return () => { active = false; }; }
    api.documents.getByApp(applicationId).then((items) => { if (active) setDocuments(items); })
      .catch((reason) => { if (active) setError(reason?.response?.data?.message || 'Unable to load documents.'); });
    return () => { active = false; };
  }, [applicationId]);

  const verify = async (documentId: string) => {
    setBusy(documentId); setError(''); setNotice('');
    try {
      const result = await api.verification.verify(documentId);
      setDocuments((current) => current.map((document) => document.id === documentId ? { ...document, ...result } : document));
      setNotice(result.verification_status === 'REQUIRES_MANUAL_REVIEW' ? 'Integrity check passed. Admin authenticity review is still required.' : `Integrity check result: ${result.verification_status}.`);
    } catch (reason) { setError((reason as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to verify this document.'); }
    finally { setBusy(''); }
  };

  const selected = applications.find((application) => application.id === applicationId);
  return <Layout><main className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
    <header><h1 className="text-3xl font-semibold tracking-tight">Document review</h1><p className="mt-1 text-sm text-[#64748B]">Find an application, inspect its files, then run an integrity check. SHA-256 matching does not establish legal authenticity.</p></header>
    {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
    <Card><CardHeader><CardTitle>Find an application</CardTitle></CardHeader><CardContent className="space-y-3">
      <div className="search-input relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search survey no., application ID, owner, village or district" style={{ paddingLeft: '2.75rem' }} disabled={loading} /></div>
      {loading ? <p className="text-sm text-slate-500">Loading applications…</p> : matches.length === 0 ? <p className="text-sm text-slate-500">No applications match that search.</p> : <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">{matches.map((application) => <button type="button" key={application.id} onClick={() => selectApplication(application.id)} className={`flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-teal-50 ${application.id === applicationId ? 'bg-teal-50' : ''}`}><span className="font-medium text-slate-900">{application.survey_number}</span><span className="text-xs text-slate-500">{application.application_type.replaceAll('_', ' ')} · {[application.property_details?.village, application.property_details?.district].filter(Boolean).join(', ') || 'Location not recorded'}</span><span className="text-xs text-slate-400">{application.id}</span></button>)}</div>}
      {selected && <p className="text-xs text-slate-500">Reviewing: <span className="font-mono">{selected.id}</span></p>}
    </CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#0F766E]" />Uploaded documents</CardTitle></CardHeader><CardContent className="space-y-4">
      {!applicationId ? <p className="py-5 text-sm text-slate-500">Select an application above to review its documents.</p> : documents.length === 0 ? <p className="py-5 text-sm text-slate-500">No documents uploaded for this application.</p> : documents.map((document) => <article key={document.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-medium">{document.document_type}</h2><p className="text-xs text-[#64748B]">{document.filename}</p><p className="mt-2 text-sm">Status: <strong>{document.verification_status}</strong></p>{document.verification_notes && <p className="mt-1 text-xs text-[#64748B]">{document.verification_notes}</p>}</div><Button variant="outline" disabled={busy === document.id} onClick={() => void verify(document.id)}><RefreshCw className={`mr-2 h-4 w-4 ${busy === document.id ? 'animate-spin' : ''}`} />Check integrity</Button></div><p className="mt-3 break-all font-mono text-xs text-[#475569]">SHA-256: {document.document_hash}</p>{document.extracted_fields && Object.keys(document.extracted_fields).length > 0 && <div className="mt-3 rounded bg-slate-50 p-3"><p className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-700"><FileCheck2 className="h-3 w-3" />Extracted fields (unverified)</p><dl className="grid gap-1 text-xs sm:grid-cols-2">{Object.entries(document.extracted_fields).map(([field, value]) => <div key={field}><dt className="inline text-slate-500">{field.replaceAll('_', ' ')}: </dt><dd className="inline">{value}</dd></div>)}</dl></div>}{document.verification_checks?.length ? <ul className="mt-3 space-y-1 text-xs">{document.verification_checks.map((check) => <li key={check.name} className={check.passed ? 'text-emerald-800' : 'text-red-700'}>{check.passed ? 'Passed' : 'Flagged'} · {check.name}: {check.message}</li>)}</ul> : null}</article>)}
    </CardContent></Card>
  </main></Layout>;
}
