import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
<<<<<<< Updated upstream
import { Layout } from '../Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  Shield,
} from 'lucide-react';
=======
import { AlertCircle, CheckCircle2, FileText, Loader2, ShieldAlert } from 'lucide-react';
import { Layout } from '../Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
>>>>>>> Stashed changes
import { api } from '../../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_META: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  VERIFIED: { label: 'Verified', className: 'bg-[#ECFDF5] text-[#0F766E]', icon: CheckCircle2 },
  REJECTED: { label: 'Verification Failed', className: 'bg-[#FEF2F2] text-[#DC2626]', icon: XCircle },
  REQUIRES_MANUAL_REVIEW: {
    label: 'Requires Manual Review',
    className: 'bg-[#FFF7ED] text-[#C2410C]',
    icon: AlertTriangle,
  },
  PENDING: { label: 'Pending Verification', className: 'bg-[#FEF3C7] text-[#B45309]', icon: Clock },
};

type Application = { id: string; _id?: string; survey_number: string; application_type: string };
type Document = {
  id: string;
  document_type: string;
  filename: string;
  verification_status: string;
  verification_notes?: string;
  document_hash: string;
  uploaded_at: string;
};

const statusLabel: Record<string, string> = {
  PENDING: 'Pending verification',
  REQUIRES_MANUAL_REVIEW: 'Requires manual review',
  VERIFIED: 'Verified by registrar',
  REJECTED: 'Verification failed',
};

export function DocumentVerification() {
<<<<<<< Updated upstream
  const { isAdmin } = useAuth();
  const [applicationId, setApplicationId] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api.applications.list().then(setApplications).catch(() => setApplications([]));
  }, []);

  const loadDocs = async (appId: string) => {
    if (!appId) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const [app, docs] = await Promise.all([
        api.applications.get(appId),
        api.documents.getByApp(appId),
      ]);
      setSelectedApp(app);
      setDocuments(docs || []);
      setApplicationId(appId);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load documents');
      setDocuments([]);
      setSelectedApp(null);
    } finally {
      setLoading(false);
    }
  };

  const runIntegrityCheck = async (docId: string) => {
    setActionLoading(true);
    try {
      const result = await api.verification.verify(docId);
      setMessage(`Integrity check: ${STATUS_META[result.verification_status]?.label || result.verification_status}`);
      await loadDocs(applicationId);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Integrity check failed');
    } finally {
      setActionLoading(false);
    }
  };

  const reviewDoc = async (docId: string, status: string) => {
    const remarks = prompt(`Remarks for ${status}:`, status === 'VERIFIED' ? 'Verified by registrar' : '') || '';
    setActionLoading(true);
    try {
      await api.verification.review(docId, status, remarks);
      setMessage(`Document marked ${status}`);
      await loadDocs(applicationId);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Review failed');
    } finally {
      setActionLoading(false);
=======
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.applications.list().then(async (apps) => {
      if (!active) return;
      setApplications(apps);
      if (apps.length) {
        const appId = apps[0].id || apps[0]._id;
        setSelectedId(appId);
        const docs = await api.documents.getByApp(appId);
        if (active) setDocuments(docs);
      }
    }).catch((err) => {
      if (active) setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to load your documents.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const selectApplication = async (id: string) => {
    setSelectedId(id);
    setError('');
    try {
      setDocuments(await api.documents.getByApp(id));
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to load documents.');
    }
  };

  const verify = async (documentId: string) => {
    setBusy(documentId);
    setError('');
    try {
      const result = await api.verification.verify(documentId);
      setDocuments((current) => current.map((doc) => doc.id === documentId
        ? { ...doc, verification_status: result.verification_status, verification_notes: result.message || (result.matches ? 'File integrity passed; registrar review is still required.' : 'File hash mismatch detected.') }
        : doc));
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Document integrity check failed.');
    } finally {
      setBusy('');
>>>>>>> Stashed changes
    }
  };

  const selectedApplication = applications.find((app) => (app.id || app._id) === selectedId);

  return (
    <Layout>
<<<<<<< Updated upstream
      <div className="p-4 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-[#0F172A]">Document Verification</h1>
          <p className="text-[#64748B]">
            Review SHA-256 integrity, extracted fields, and verification statuses for application documents
          </p>
        </div>

        <Card className="border-[#E2E8F0]">
          <CardHeader>
            <CardTitle>Select Application</CardTitle>
            <CardDescription>Load documents by application ID</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-2">
              <Label>Application</Label>
              <select
                className="w-full h-10 rounded-md border border-[#E2E8F0] px-3 text-sm"
                value={applicationId}
                onChange={(e) => loadDocs(e.target.value)}
              >
                <option value="">Select an application…</option>
                {applications.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.survey_number} · {a.application_type?.replaceAll('_', ' ')} · {a.status}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-2">
              <Label>Or paste Application ID</Label>
              <div className="flex gap-2">
                <Input value={applicationId} onChange={(e) => setApplicationId(e.target.value)} />
                <Button type="button" variant="outline" onClick={() => loadDocs(applicationId)}>
                  Load
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex items-center gap-2 text-[#64748B]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading documents…
          </div>
        )}
        {error && <p className="text-sm text-[#DC2626]">{error}</p>}
        {message && <p className="text-sm text-[#0F766E]">{message}</p>}

        {selectedApp && (
          <Card className="border-[#E2E8F0]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0F766E]" />
                {selectedApp.survey_number}
              </CardTitle>
              <CardDescription>
                {selectedApp.application_type?.replaceAll('_', ' ')} · Status {selectedApp.status} ·{' '}
                <Link className="text-[#0F766E] hover:underline" to={`/applications/${selectedApp.id}`}>
                  Open application
                </Link>
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="space-y-4">
          {!loading && applicationId && documents.length === 0 && (
            <Card className="border-[#E2E8F0]">
              <CardContent className="py-10 text-center text-[#64748B]">
                No documents uploaded for this application.
              </CardContent>
            </Card>
          )}

          {documents.map((doc) => {
            const status = doc.verification_status || 'PENDING';
            const meta = STATUS_META[status] || STATUS_META.PENDING;
            const Icon = meta.icon;
            return (
              <Card key={doc.id || doc.document_id} className="border-[#E2E8F0]">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#0F766E]" />
                        <p className="font-semibold">{(doc.document_type || 'DOCUMENT').replaceAll('_', ' ')}</p>
                        <Badge className={`border-0 ${meta.className}`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#64748B]">
                        {doc.filename} · {Math.round((doc.file_size || 0) / 1024)} KB
                      </p>
                      <p className="font-mono text-[11px] break-all text-[#475569]">
                        SHA-256: {doc.document_hash}
                      </p>
                      {doc.verification_notes && (
                        <p className="text-xs text-[#64748B]">Notes: {doc.verification_notes}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() => runIntegrityCheck(doc.document_id || doc.id)}
                      >
                        Re-check Hash
                      </Button>
                      {isAdmin && (
                        <>
                          <Button
                            size="sm"
                            className="bg-[#0F766E] hover:bg-[#0F766E]/90"
                            disabled={actionLoading}
                            onClick={() => reviewDoc(doc.document_id || doc.id, 'VERIFIED')}
                          >
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[#C2410C] border-[#FDBA74]"
                            disabled={actionLoading}
                            onClick={() => reviewDoc(doc.document_id || doc.id, 'REQUIRES_MANUAL_REVIEW')}
                          >
                            Flag Review
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[#DC2626] border-[#FECACA]"
                            disabled={actionLoading}
                            onClick={() => reviewDoc(doc.document_id || doc.id, 'REJECTED')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {doc.extracted_fields && Object.keys(doc.extracted_fields).length > 0 && (
                    <div className="bg-[#F8FAFC] rounded-lg p-3 text-xs grid sm:grid-cols-2 gap-2">
                      <p className="sm:col-span-2 font-medium text-[#0F172A]">Extracted fields</p>
                      {Object.entries(doc.extracted_fields).map(([k, v]) => (
                        <p key={k}>
                          <span className="text-[#64748B]">{k}: </span>
                          {String(v)}
                        </p>
                      ))}
                    </div>
                  )}

                  {(doc.verification_checks || []).length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-[#0F172A]">Validation checks</p>
                      {(doc.verification_checks || []).map((c: any, i: number) => (
                        <p key={i} className={`text-xs ${c.passed ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                          {c.passed ? '✓' : '✗'} {c.name}: {c.message}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
=======
      <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
        <div>
          <h1 className="text-3xl font-semibold text-[#0F172A]">Document verification</h1>
          <p className="mt-2 text-[#64748B]">Check that stored files still match their upload-time SHA-256 hash and track registrar review.</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          A matching hash proves file integrity only. It does not confirm that the original document is genuine; an authorized registrar must review authenticity.
        </div>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <Card>
          <CardHeader>
            <CardTitle>Application documents</CardTitle>
            <CardDescription>Select an application to review its submitted files.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <div className="flex items-center gap-2 py-6 text-sm text-[#64748B]"><Loader2 className="h-4 w-4 animate-spin" />Loading documents…</div>
              : applications.length === 0 ? <div className="py-6 text-center">
                <p className="text-sm text-[#64748B]">You have no applications yet.</p>
                <Link to="/applications/new"><Button className="mt-4 bg-[#0F766E]">Start an application</Button></Link>
              </div> : <>
                <label className="block max-w-xl text-sm font-medium text-[#334155]">
                  Application
                  <select className="mt-1 block w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2"
                    value={selectedId} onChange={(event) => void selectApplication(event.target.value)}>
                    {applications.map((app) => <option key={app.id || app._id} value={app.id || app._id}>
                      {app.survey_number} · {app.application_type.replaceAll('_', ' ')}
                    </option>)}
                  </select>
                </label>
                {documents.length === 0 ? <p className="py-6 text-sm text-[#64748B]">No documents uploaded for this application.</p>
                  : <div className="divide-y">
                    {documents.map((doc) => <article key={doc.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <FileText className="mt-1 h-5 w-5 shrink-0 text-[#0F766E]" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#0F172A]">{doc.document_type.replaceAll('_', ' ')}</p>
                          <p className="truncate text-sm text-[#64748B]">{doc.filename}</p>
                          <p className="mt-1 break-all font-mono text-xs text-[#64748B]">SHA-256: {doc.document_hash}</p>
                          {doc.verification_notes && <p className="mt-1 text-xs text-[#64748B]">{doc.verification_notes}</p>}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="flex items-center gap-1 text-sm">
                          {doc.verification_status === 'VERIFIED' ? <CheckCircle2 className="h-4 w-4 text-green-700" />
                            : doc.verification_status === 'REJECTED' ? <ShieldAlert className="h-4 w-4 text-red-700" />
                              : <AlertCircle className="h-4 w-4 text-amber-700" />}
                          {statusLabel[doc.verification_status] || doc.verification_status}
                        </span>
                        <Button variant="outline" disabled={busy === doc.id || doc.verification_status === 'VERIFIED'} onClick={() => void verify(doc.id)}>
                          {busy === doc.id ? 'Checking…' : 'Check integrity'}
                        </Button>
                      </div>
                    </article>)}
                  </div>}
                {selectedApplication && <Link className="inline-block text-sm text-[#0F766E] underline" to={`/applications/${selectedId}`}>View application details</Link>}
              </>}
          </CardContent>
        </Card>
>>>>>>> Stashed changes
      </div>
    </Layout>
  );
}
