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
  );
}
