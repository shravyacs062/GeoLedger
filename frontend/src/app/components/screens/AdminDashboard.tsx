<<<<<<< Updated upstream
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  ClipboardList,
  FileWarning,
  ArrowLeftRight,
  Users,
  Shield,
  Loader2,
} from 'lucide-react';

import { Layout } from '../Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { api } from '../../../services/api';

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [s, a] = await Promise.all([
          api.dashboard.admin(),
          api.applications.list(),
        ]);
        setStats(s);
        setApps(
          (a || []).filter((x: any) =>
            !['COMPLETED', 'REJECTED'].includes(x.status)
          ).slice(0, 8)
        );
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || 'Failed to load admin dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = [
    { label: 'Registered Properties', value: stats?.total_properties, icon: Building2 },
    { label: 'Pending Registrations', value: stats?.pending_registrations, icon: ClipboardList },
    { label: 'Pending Transfers', value: stats?.pending_transfers, icon: ArrowLeftRight },
    { label: 'Pending Inheritance', value: stats?.pending_inheritance, icon: Users },
    { label: 'Approved Applications', value: stats?.approved_applications, icon: ClipboardList },
    { label: 'Rejected Applications', value: stats?.rejected_applications, icon: FileWarning },
    { label: 'Docs Pending Review', value: stats?.pending_document_verification, icon: FileWarning },
    { label: 'Flagged Documents', value: stats?.flagged_documents, icon: Shield },
    { label: 'Total Users', value: stats?.total_users, icon: Users },
  ];

  return (
    <Layout>
      <div className="p-4 lg:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-[#0F172A]">Admin Dashboard</h1>
          <p className="text-[#64748B]">Review applications, documents, and blockchain activity</p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-[#64748B]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading registry metrics…
          </div>
        )}
        {error && <p className="text-sm text-[#DC2626]">{error}</p>}

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="border-[#E2E8F0]">
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#0F766E]/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#0F766E]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#64748B]">{c.label}</p>
                    <p className="text-2xl font-semibold text-[#0F172A]">{c.value ?? '—'}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-[#E2E8F0]">
            <CardHeader>
              <CardTitle>Pending Applications</CardTitle>
              <CardDescription>Requires registrar action</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {apps.length === 0 && (
                <p className="text-sm text-[#64748B]">No pending applications.</p>
              )}
              {apps.map((app) => (
                <div key={app.id} className="flex items-center justify-between border border-[#E2E8F0] rounded-lg p-3">
                  <div>
                    <p className="font-medium text-[#0F172A]">{app.survey_number}</p>
                    <p className="text-xs text-[#64748B]">{app.application_type?.replaceAll('_', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{app.status}</Badge>
                    <Button asChild size="sm" className="bg-[#0F766E] hover:bg-[#0F766E]/90">
                      <Link to={`/admin/applications/${app.id}`}>Review</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0]">
            <CardHeader>
              <CardTitle>Recent Blockchain Transactions</CardTitle>
              <CardDescription>On-chain registry activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(stats?.recent_blockchain_transactions || []).length === 0 && (
                <p className="text-sm text-[#64748B]">No transactions yet.</p>
              )}
              {(stats?.recent_blockchain_transactions || []).map((tx: any, idx: number) => (
                <div key={tx.id || idx} className="border border-[#E2E8F0] rounded-lg p-3">
                  <p className="text-sm font-medium text-[#0F172A]">{tx.transaction_type || 'TX'}</p>
                  <p className="text-xs text-[#64748B] font-mono truncate">{tx.tx_hash || tx.blockchain_tx_hash}</p>
                  <p className="text-xs text-[#64748B] mt-1">{tx.survey_number} · {tx.status}</p>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link to="/transactions">View all transactions</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
=======
import { useCallback, useEffect, useState } from 'react';
import { Check, ExternalLink, RefreshCw, X } from 'lucide-react';
import { api } from '../../../services/api';
import { useAuth } from '../../context/useAuth';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type Application = {
  id?: string;
  _id?: string;
  application_type: string;
  survey_number: string;
  applicant_wallet: string;
  status: string;
  required_documents?: string[];
  created_at?: string;
};

type Document = {
  id: string;
  application_id?: string;
  document_type: string;
  filename: string;
  verification_status: string;
  verification_notes?: string;
  document_hash: string;
};

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const loadData = useCallback(async () => {
    const [apps, docs] = await Promise.all([api.applications.list(), api.documents.list()]);
    return { apps, docs };
  }, []);
  const refresh = async () => {
    setError('');
    try {
      const { apps, docs } = await loadData();
      setApplications(apps);
      setDocuments(docs);
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to load the registrar dashboard.');
    }
  };

  useEffect(() => {
    let active = true;
    loadData().then(({ apps, docs }) => {
      if (active) {
        setApplications(apps);
        setDocuments(docs);
      }
    }).catch((err) => {
      if (active) setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to load the registrar dashboard.');
    });
    return () => { active = false; };
  }, [loadData]);

  const runAction = async (id: string, action: () => Promise<unknown>) => {
    setBusy(id);
    setError('');
    try {
      await action();
      await refresh();
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Action failed.');
    } finally {
      setBusy('');
    }
  };

  const pending = applications.filter((app) => !['COMPLETED', 'REJECTED'].includes(app.status));
  const pendingDocuments = documents.filter((doc) => doc.verification_status === 'PENDING');

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-white px-6 py-4">
        <div><h1 className="text-xl font-semibold text-[#0F172A]">GeoLedger Registrar</h1><p className="text-sm text-[#64748B]">{user?.email}</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void refresh()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          <Button variant="outline" onClick={() => void logout().then(() => { window.location.href = '/admin/login'; })}>Sign out</Button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-8 p-6">
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          {[['Pending applications', pending.length], ['Pending documents', pendingDocuments.length], ['Total applications', applications.length]].map(([label, count]) => (
            <Card key={String(label)}><CardContent className="p-5"><p className="text-3xl font-semibold">{count}</p><p className="text-sm text-[#64748B]">{label}</p></CardContent></Card>
          ))}
        </div>
        <Card>
          <CardHeader><CardTitle>Applications for review</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {applications.length === 0 ? <p className="py-6 text-sm text-[#64748B]">No applications submitted.</p> : (
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead><tr className="border-b text-[#64748B]"><th className="p-3">Survey</th><th className="p-3">Workflow</th><th className="p-3">Applicant</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
                <tbody>{applications.map((app) => {
                  const id = app.id || app._id || '';
                  return <tr key={id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{app.survey_number}</td><td className="p-3">{app.application_type?.replaceAll('_', ' ')}</td>
                    <td className="p-3 font-mono">{app.applicant_wallet}</td><td className="p-3">{app.status}</td>
                    <td className="flex gap-2 p-3">
                      {!['COMPLETED', 'REJECTED'].includes(app.status) && <>
                        <Button size="sm" disabled={busy === id} onClick={() => void runAction(id, () => api.applications.approve(id))}><Check className="mr-1 h-4 w-4" />Approve & register</Button>
                        <Button size="sm" variant="outline" disabled={busy === id} onClick={() => {
                          const reason = window.prompt('Reason for rejection:');
                          if (reason?.trim()) void runAction(id, () => api.applications.updateStatus(id, { status: 'REJECTED', rejection_reason: reason.trim() }));
                        }}><X className="mr-1 h-4 w-4" />Reject</Button>
                      </>}
                    </td>
                  </tr>;
                })}</tbody>
              </table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Document review</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {documents.length === 0 ? <p className="py-6 text-sm text-[#64748B]">No documents uploaded.</p> : (
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead><tr className="border-b text-[#64748B]"><th className="p-3">Document</th><th className="p-3">Workflow</th><th className="p-3">SHA-256</th><th className="p-3">Status</th><th className="p-3">Review</th></tr></thead>
                <tbody>{documents.map((doc) => <tr key={doc.id} className="border-b last:border-0">
                  <td className="p-3"><a className="inline-flex items-center gap-1 text-[#0F766E] underline" href={api.documents.getDownloadUrl(doc.id)} target="_blank" rel="noreferrer">{doc.filename}<ExternalLink className="h-3 w-3" /></a><div className="text-xs text-[#64748B]">{doc.document_type}</div></td>
                  <td className="p-3 font-mono text-xs">{doc.application_id || 'Property file'}</td>
                  <td className="max-w-48 truncate p-3 font-mono text-xs" title={doc.document_hash}>{doc.document_hash}</td>
                  <td className="p-3">{doc.verification_status}{doc.verification_notes ? <div className="text-xs text-[#64748B]">{doc.verification_notes}</div> : null}</td>
                  <td className="p-3"><div className="flex gap-2">
                    <Button size="sm" disabled={busy === doc.id} onClick={() => void runAction(doc.id, () => api.verification.review(doc.id, 'VERIFIED', 'Approved by registrar'))}>Verify</Button>
                    <Button size="sm" variant="outline" disabled={busy === doc.id} onClick={() => {
                      const reason = window.prompt('Reason for rejection:');
                      if (reason?.trim()) void runAction(doc.id, () => api.verification.review(doc.id, 'REJECTED', reason.trim()));
                    }}>Reject</Button>
                  </div></td>
                </tr>)}</tbody>
              </table>
            )}
            <p className="mt-4 text-xs text-[#64748B]">Hash matching confirms file integrity only. It does not by itself prove a document is authentic.</p>
          </CardContent>
        </Card>
      </div>
    </main>
>>>>>>> Stashed changes
  );
}
