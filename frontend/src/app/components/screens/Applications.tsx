import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  ArrowRight,
  FileText,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ArrowLeftRight,
  HeartHandshake,
  Building2,
  RefreshCw,
} from 'lucide-react';

import { Layout } from '../Layout';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { api } from '../../../services/api';
import { useWallet } from '../../context/WalletContext';

export function Applications() {
  const { address } = useWallet();
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await api.applications.list(undefined, address || undefined);
      setApplications(data);
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [address]);

  const filtered = applications.filter((app) => {
    if (selectedFilter === 'ALL') return true;
    return app.status === selectedFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-[#DCFCE7] text-[#166534] border-0">Completed (Anchored)</Badge>;
      case 'APPROVED':
        return <Badge className="bg-[#F0FDF4] text-[#15803D] border-0">Approved (Ready)</Badge>;
      case 'VERIFIED':
        return <Badge className="bg-[#F0FDFA] text-[#0F766E] border-0">Verified</Badge>;
      case 'UNDER_REVIEW':
        return <Badge className="bg-[#FEF3C7] text-[#B45309] border-0">Under Review</Badge>;
      case 'DOCUMENTS_PENDING':
        return <Badge className="bg-[#FEF2F2] text-[#B91C1C] border-0">Docs Pending</Badge>;
      case 'REJECTED':
      case 'BLOCKCHAIN_FAILED':
        return <Badge className="bg-[#FEE2E2] text-[#991B1B] border-0">{status}</Badge>;
      default:
        return <Badge className="bg-[#EFF6FF] text-[#1D4ED8] border-0">{status || 'SUBMITTED'}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="p-4 lg:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#0F172A] mb-2">Land Registry Applications</h1>
            <p className="text-[#64748B]">
              Track the state machine of off-chain legal verifications and on-chain ownership registrations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadApplications}
              className="border-[#CBD5E1] text-[#0F172A]"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/applications/new">
              <Button size="sm" className="bg-[#0F766E] hover:bg-[#115E59]">
                <Plus className="mr-1.5 h-4 w-4" />
                New Application
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_PENDING', 'VERIFIED', 'APPROVED', 'COMPLETED', 'REJECTED'].map(
            (status) => (
              <Button
                key={status}
                variant={selectedFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter(status)}
                className={
                  selectedFilter === status
                    ? 'bg-[#0F766E] text-white hover:bg-[#115E59]'
                    : 'border-[#E2E8F0] text-[#64748B]'
                }
              >
                {status.replace(/_/g, ' ')}
              </Button>
            )
          )}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="py-12 text-center text-sm text-[#64748B]">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <Card className="border-[#E2E8F0] p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-[#94A3B8]" />
            <h3 className="mt-4 text-base font-semibold text-[#0F172A]">No applications found</h3>
            <p className="mt-1 text-sm text-[#64748B]">
              {selectedFilter !== 'ALL'
                ? `No applications with status "${selectedFilter}".`
                : 'Start a new land registration or transfer application.'}
            </p>
            <Link to="/applications/new" className="mt-4 inline-block">
              <Button className="bg-[#0F766E] hover:bg-[#115E59]">Create New Application</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((app) => {
              const appId = app._id || app.application_id;
              const isTransfer = (app.application_type || '').includes('TRANSFER');
              const Icon = isTransfer ? ArrowLeftRight : Building2;

              return (
                <Card
                  key={appId}
                  className="border-[#E2E8F0] transition-shadow hover:shadow-sm"
                >
                  <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0F766E]">
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-[#0F172A]">
                            {app.application_type?.replace(/_/g, ' ')}
                          </h3>
                          {getStatusBadge(app.status)}
                        </div>

                        <p className="text-xs text-[#64748B]">
                          Survey Number: <span className="font-medium text-[#0F172A]">{app.survey_number}</span> • Application ID: <span className="font-mono text-[#0F766E]">{appId}</span>
                        </p>

                        <p className="text-xs text-[#64748B]">
                          Applicant Wallet: <span className="font-mono">{app.applicant_wallet?.substring(0, 10)}...{app.applicant_wallet?.substring(app.applicant_wallet?.length - 6)}</span>
                          {app.created_at && ` • Submitted: ${new Date(app.created_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link to={`/applications/${appId}`}>
                        <Button className="bg-[#0F766E] hover:bg-[#115E59] text-xs">
                          Open Application
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
