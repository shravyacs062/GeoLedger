import { useEffect, useState } from 'react';
import { FileCheck2, RefreshCw, ShieldCheck } from 'lucide-react';

import { api } from '../../../services/api';
import { Layout } from '../Layout';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type Application = { id: string; survey_number: string; application_type: string };
type Document = {
  id: string;
  document_type: string;
  filename: string;
  verification_status: string;
  verification_notes?: string;
  document_hash: string;
  extracted_fields?: Record<string, string>;
  verification_checks?: Array<{ name: string; passed: boolean; message: string; severity: string }>;
};

export function DocumentVerification() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationId, setApplicationId] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    api.applications.list().then((items) => {
      if (active) {
        setApplications(items);
        if (items.length) setApplicationId(items[0].id);
      }
    }).catch((reason) => {
      if (active) setError(reason?.response?.data?.message || 'Unable to load your applications.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!applicationId) {
      setDocuments([]);
      return () => { active = false; };
    }
    api.documents.getByApp(applicationId).then((items) => {
      if (active) setDocuments(items);
    }).catch((reason) => {
      if (active) setError(reason?.response?.data?.message || 'Unable to load documents.');
    });
    return () => { active = false; };
  }, [applicationId]);

  const verify = async (documentId: string) => {
    setBusy(documentId);
    setError('');
    setNotice('');
    try {
      const result = await api.verification.verify(documentId);
      setDocuments((current) => current.map((document) => document.id === documentId
        ? { ...document, ...result }
        : document));
      setNotice(result.verification_status === 'REQUIRES_MANUAL_REVIEW'
        ? 'Integrity check passed. An Admin must still confirm document authenticity.'
        : `Integrity check result: ${result.verification_status}.`);
    } catch (reason) {
      setError((reason as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to verify this document.');
    } finally {
      setBusy('');
    }
  };

  const selected = applications.find((application) => application.id === applicationId);
  return (
    <Layout>
      <main className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
        <header><h1 className="text-3xl font-semibold tracking-tight">Document integrity</h1><p className="mt-1 text-sm text-[#64748B]">SHA-256 matching checks file integrity only; Admin review is required for authenticity.</p></header>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {notice && <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
        <Card>
          <CardHeader><CardTitle>Select application</CardTitle></CardHeader>
          <CardContent>
            <select className="w-full rounded-md border p-2" value={applicationId} onChange={(event) => setApplicationId(event.target.value)} disabled={loading || applications.length === 0}>
              {applications.map((application) => <option key={application.id} value={application.id}>{application.survey_number} · {application.application_type.replaceAll('_', ' ')}</option>)}
            </select>
            {!loading && applications.length === 0 && <p className="mt-3 text-sm text-[#64748B]">You have no applications with uploaded documents.</p>}
            {selected && <p className="mt-2 text-xs text-[#64748B]">Application {selected.id}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#0F766E]" />Uploaded documents</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {documents.length === 0 ? <p className="py-5 text-sm text-[#64748B]">No documents uploaded for this application.</p>
              : documents.map((document) => <article key={document.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h2 className="font-medium">{document.document_type}</h2><p className="text-xs text-[#64748B]">{document.filename}</p><p className="mt-2 text-sm">Status: <strong>{document.verification_status}</strong></p>{document.verification_notes && <p className="mt-1 text-xs text-[#64748B]">{document.verification_notes}</p>}</div>
                  <Button variant="outline" disabled={busy === document.id} onClick={() => void verify(document.id)}><RefreshCw className={`mr-2 h-4 w-4 ${busy === document.id ? 'animate-spin' : ''}`} />Check integrity</Button>
                </div>
                <p className="mt-3 break-all font-mono text-xs text-[#475569]">SHA-256: {document.document_hash}</p>
                {document.extracted_fields && Object.keys(document.extracted_fields).length > 0 && <div className="mt-3 rounded bg-slate-50 p-3"><p className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-700"><FileCheck2 className="h-3 w-3" />Extracted fields (unverified)</p><dl className="grid gap-1 text-xs sm:grid-cols-2">{Object.entries(document.extracted_fields).map(([field, value]) => <div key={field}><dt className="inline text-slate-500">{field.replaceAll('_', ' ')}: </dt><dd className="inline">{value}</dd></div>)}</dl></div>}
                {document.verification_checks?.length ? <ul className="mt-3 space-y-1 text-xs">{document.verification_checks.map((check) => <li key={check.name} className={check.passed ? 'text-emerald-800' : 'text-red-700'}>{check.passed ? 'Passed' : 'Flagged'} · {check.name}: {check.message}</li>)}</ul> : null}
              </article>)}
          </CardContent>
        </Card>
      </main>
    </Layout>
  );
}
