import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Check, ClipboardList, ExternalLink, FilePlus2, RefreshCw, Users } from 'lucide-react';

import { api } from '../../../services/api';
import { Layout } from '../Layout';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type Application = {
  id: string;
  survey_number: string;
  application_type: string;
  status: string;
  applicant_wallet?: string;
};

type Document = {
  id: string;
  application_id?: string;
  document_type: string;
  filename: string;
  document_hash: string;
  verification_status: string;
  verification_notes?: string;
};

export function AdminDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(() => Promise.all([
    api.applications.list(),
    api.documents.list(),
  ]), []);

  const refresh = useCallback(async () => {
    try {
      const [nextApplications, nextDocuments] = await loadData();
      setApplications(nextApplications);
      setDocuments(nextDocuments);
    } catch (reason) {
      setError((reason as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to load Admin data.');
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  useEffect(() => {
    let active = true;
    loadData()
      .then(([nextApplications, nextDocuments]) => {
        if (!active) return;
        setApplications(nextApplications);
        setDocuments(nextDocuments);
        setError('');
      })
      .catch((reason) => {
        if (active) {
          setError((reason as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to load Admin data.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [loadData]);

  const action = async (id: string, operation: () => Promise<unknown>) => {
    setBusy(id);
    setError('');
    try {
      await operation();
      await refresh();
    } catch (reason) {
      setError((reason as { response?: { data?: { message?: string } } })?.response?.data?.message || 'The requested review action failed.');
    } finally {
      setBusy('');
    }
  };

  const pendingApplications = applications.filter((app) => !['COMPLETED', 'REJECTED'].includes(app.status));
  const pendingDocuments = documents.filter((doc) => doc.verification_status !== 'VERIFIED' && doc.verification_status !== 'REJECTED');

  return (
    <Layout>
      <main className="mx-auto max-w-[1600px] space-y-7 p-4 sm:p-6 lg:p-9">
        <header className="relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-white via-white to-teal-50/80 px-6 py-7 shadow-sm sm:px-8">
          <div className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full bg-teal-100/60 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">GeoLedger Admin</p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A]">Admin dashboard</h1>
            <p className="mt-1 text-sm text-[#64748B]">Review applications and documents before on-chain registration.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="border-slate-200 bg-white/80"><Link to="/admin/users"><Users className="mr-2 h-4 w-4" />Users</Link></Button>
            <Button variant="outline" className="border-slate-200 bg-white/80" onClick={() => void refresh()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          </div>
          </div>
        </header>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['Pending applications', pendingApplications.length],
            ['Documents to review', pendingDocuments.length],
            ['Registered properties', applications.filter((app) => app.status === 'COMPLETED').length],
          ].map(([label, count], index) => (
            <Card key={String(label)} className="overflow-hidden">
              <CardContent className="flex items-center gap-4 p-5">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${index === 0 ? 'bg-amber-50 text-amber-700' : index === 1 ? 'bg-sky-50 text-sky-700' : 'bg-teal-50 text-teal-700'}`}>
                  {index === 0 ? <ClipboardList className="h-5 w-5" /> : index === 1 ? <FilePlus2 className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                </span>
                <div><p className="text-3xl font-semibold tracking-tight text-[#0F172A]">{count}</p><p className="text-sm text-[#64748B]">{label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader><CardTitle>Applications</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? <p className="py-6 text-sm text-[#64748B]">Loading applications…</p>
              : applications.length === 0 ? <p className="py-6 text-sm text-[#64748B]">No applications submitted.</p>
                : <table className="w-full min-w-[700px] text-left text-sm">
                  <thead><tr className="border-b text-[#64748B]"><th className="p-3">Survey</th><th className="p-3">Type</th><th className="p-3">Applicant</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
                  <tbody>{applications.map((app) => <tr key={app.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{app.survey_number}</td><td className="p-3">{app.application_type.replaceAll('_', ' ')}</td>
                    <td className="p-3 font-mono text-xs">{app.applicant_wallet || '—'}</td><td className="p-3">{app.status}</td>
                    <td className="p-3"><div className="flex gap-2">
                      <Button asChild size="sm" variant="outline"><Link to={`/admin/applications/${app.id}`}>Details</Link></Button>
                      {!['COMPLETED', 'REJECTED'].includes(app.status) && <Button size="sm" disabled={busy === app.id} onClick={() => void action(app.id, () => api.applications.approve(app.id))}><Check className="mr-1 h-4 w-4" />Approve</Button>}
                    </div></td>
                  </tr>)}</tbody>
                </table>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Document review</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {documents.length === 0 ? <p className="py-6 text-sm text-[#64748B]">No documents uploaded.</p>
              : <table className="w-full min-w-[800px] text-left text-sm">
                <thead><tr className="border-b text-[#64748B]"><th className="p-3">Document</th><th className="p-3">Application</th><th className="p-3">SHA-256</th><th className="p-3">Status</th><th className="p-3">Review</th></tr></thead>
                <tbody>{documents.map((doc) => <tr key={doc.id} className="border-b last:border-0">
                  <td className="p-3"><a className="inline-flex items-center gap-1 text-[#0F766E] underline" href={api.documents.getDownloadUrl(doc.id)} target="_blank" rel="noreferrer">{doc.filename}<ExternalLink className="h-3 w-3" /></a><p className="text-xs text-[#64748B]">{doc.document_type}</p></td>
                  <td className="p-3 font-mono text-xs">{doc.application_id || '—'}</td>
                  <td className="max-w-56 truncate p-3 font-mono text-xs" title={doc.document_hash}>{doc.document_hash}</td>
                  <td className="p-3">{doc.verification_status}{doc.verification_notes && <p className="text-xs text-[#64748B]">{doc.verification_notes}</p>}</td>
                  <td className="p-3"><div className="flex gap-2">
                    <Button size="sm" disabled={busy === doc.id} onClick={() => void action(doc.id, () => api.verification.review(doc.id, 'VERIFIED', 'Approved by Admin'))}>Verify</Button>
                    <Button size="sm" variant="outline" disabled={busy === doc.id} onClick={() => void action(doc.id, () => api.verification.review(doc.id, 'REJECTED', 'Rejected by Admin'))}>Reject</Button>
                  </div></td>
                </tr>)}</tbody>
              </table>}
          </CardContent>
        </Card>
      </main>
    </Layout>
  );
}
