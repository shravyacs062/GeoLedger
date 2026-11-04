import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Building2, ClipboardList, FilePlus2, RefreshCw } from 'lucide-react';

import { api } from '../../../services/api';
import { useAuth } from '../../context/useAuth';
import { Layout } from '../Layout';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type Summary = {
  registered_properties: number;
  submitted_applications: number;
  pending_applications: number;
};

type Application = {
  id: string;
  survey_number: string;
  application_type: string;
  status: string;
  created_at?: string;
};

export function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([api.dashboard.user(), api.applications.list()])
      .then(([nextSummary, nextApplications]) => {
        if (active) {
          setSummary(nextSummary);
          setApplications(nextApplications.slice(0, 5));
          setError('');
        }
      })
      .catch((reason) => {
        if (active) setError(reason?.response?.data?.message || 'Unable to load your dashboard data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [retry]);

  const cards = [
    { title: 'Registered properties', value: summary?.registered_properties ?? '—', icon: Building2, color: 'bg-teal-50 text-teal-700' },
    { title: 'Applications submitted', value: summary?.submitted_applications ?? applications.length, icon: ClipboardList, color: 'bg-sky-50 text-sky-700' },
    { title: 'Applications in progress', value: summary?.pending_applications ?? applications.filter((app) => !['COMPLETED', 'REJECTED'].includes(app.status)).length, icon: Activity, color: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <Layout>
      <main className="mx-auto max-w-[1600px] space-y-7 p-4 sm:p-6 lg:p-9">
        <header className="relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-white via-white to-teal-50/80 px-6 py-7 shadow-sm sm:px-8">
          <div className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full bg-teal-100/60 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Property owner portal</p>
              <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A]">Welcome, {user?.name || 'Property owner'}</h1>
              <p className="mt-1 text-sm text-[#64748B]">Track your property records and application progress.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-slate-200 bg-white/80" onClick={() => { setLoading(true); setRetry((value) => value + 1); }} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
              <Button asChild className="bg-[#0F766E] hover:bg-[#115E59]"><Link to="/applications/new"><FilePlus2 className="mr-2 h-4 w-4" />New application</Link></Button>
            </div>
          </div>
        </header>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <section className="grid gap-4 md:grid-cols-3">
          {cards.map(({ title, value, icon: Icon, color }) => <Card key={title} className="overflow-hidden"><CardContent className="flex items-center gap-4 p-5"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}><Icon className="h-5 w-5" /></span><div><p className="text-3xl font-semibold tracking-tight">{loading ? '…' : value}</p><p className="text-sm text-[#64748B]">{title}</p></div></CardContent></Card>)}
        </section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Recent applications</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/applications">View all</Link></Button>
          </CardHeader>
          <CardContent>
            {loading ? <p className="py-5 text-sm text-[#64748B]">Loading applications…</p>
              : applications.length === 0 ? <p className="py-5 text-sm text-[#64748B]">No applications yet. Start by submitting a property registration.</p>
                : <div className="divide-y">{applications.map((application) => <Link key={application.id} to={`/applications/${application.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-slate-50">
                  <div><p className="font-medium">{application.survey_number}</p><p className="text-xs text-[#64748B]">{application.application_type.replaceAll('_', ' ')}</p></div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{application.status}</span>
                </Link>)}</div>}
          </CardContent>
        </Card>
      </main>
    </Layout>
  );
}
