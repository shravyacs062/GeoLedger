import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

export function DocumentVerification() {
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
    }
  };

  return (
    <Layout>
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
      </div>
    </Layout>
  );
}
