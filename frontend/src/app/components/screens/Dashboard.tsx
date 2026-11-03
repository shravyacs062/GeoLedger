import { useState, useEffect } from 'react';
import { Layout } from '../Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Map, FileText, TrendingUp, Activity, MapPin, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';

type PropertyRecord = {
  id?: string;
  survey_number?: string;
  property_id?: string;
  village?: string;
  district?: string;
  area?: number | string;
  status?: string;
};
type ApplicationRecord = { status: string };
type TransactionRecord = {
  transaction_type?: string;
  type?: string;
  survey_number?: string;
  surveyNumber?: string;
  property_id?: string;
  timestamp?: string;
};

export function Dashboard() {
<<<<<<< Updated upstream
  const [properties, setProperties] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api.dashboard.user().catch(() => null),
      api.properties.list().catch(() => []),
      api.applications.list().catch(() => []),
      api.blockchain.getTransactions().catch(() => []),
    ]).then(([dash, props, apps, txs]) => {
      setUserStats(dash);
      setProperties(props || []);
      setApplications(apps || []);
      setTransactions(txs || []);
=======
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    Promise.all([
      api.properties.list(),
      api.applications.list(),
      api.blockchain.getTransactions(),
    ]).then(([props, apps, txs]) => {
      setProperties(props || []);
      setApplications(apps || []);
      setTransactions(txs || []);
    }).catch((error) => {
      setLoadError(error?.response?.data?.message || 'Dashboard data could not be loaded.');
>>>>>>> Stashed changes
    });
  }, []);

  const stats = [
<<<<<<< Updated upstream
    {
      icon: Map,
      label: 'My Properties',
      value: String(userStats?.registered_properties ?? properties.length),
      color: 'bg-[#0F766E]',
    },
    {
      icon: FileText,
      label: 'Pending Applications',
      value: String(
        userStats?.pending_applications ??
          applications.filter((a) => !['COMPLETED', 'REJECTED'].includes(a.status)).length
      ),
      color: 'bg-[#38BDF8]',
    },
    {
      icon: TrendingUp,
      label: 'Submitted Applications',
      value: String(userStats?.submitted_applications ?? applications.length),
      color: 'bg-[#16A34A]',
    },
    {
      icon: Activity,
      label: 'Blockchain Txns',
      value: String(transactions.length),
      color: 'bg-[#334155]',
    },
  ];

  const sourceProps = userStats?.properties?.length ? userStats.properties : properties;
  const recentProperties = sourceProps.slice(0, 3).map((p: any) => ({
    id: p.survey_number || p.property_id || '—',
    location: [p.village, p.district].filter(Boolean).join(', ') || 'Registered parcel',
    area: p.area ? `${p.area} sq ft` : '—',
    status: p.status || 'REGISTERED',
  }));

  const sourceApps = userStats?.recent_applications?.length
    ? userStats.recent_applications
    : applications;
  const recentActivity = sourceApps.slice(0, 4).map((t: any) => ({
    action: (t.application_type || t.transaction_type || 'Application').replace(/_/g, ' '),
    property: t.survey_number || t.property_id || '—',
    time: t.updated_at || t.created_at || t.timestamp || 'Recent',
=======
    { icon: Map, label: 'Your Properties', value: String(properties.length), color: 'bg-[#0F766E]' },
    { icon: FileText, label: 'Pending Applications', value: String(applications.filter(a => !['COMPLETED', 'REJECTED'].includes(a.status)).length), color: 'bg-[#38BDF8]' },
    { icon: TrendingUp, label: 'Your Transactions', value: String(transactions.length), color: 'bg-[#16A34A]' },
    { icon: Activity, label: 'Completed Applications', value: String(applications.filter(a => a.status === 'COMPLETED').length), color: 'bg-[#334155]' },
  ];

  const recentProperties = properties.slice(0, 3).map((p) => ({
    id: p.survey_number || p.property_id || p.id,
    location: [p.village, p.district].filter(Boolean).join(', ') || 'Location not provided',
    area: p.area ? `${p.area}` : 'Area not provided',
    status: p.status || 'REGISTERED',
  }));

  const recentActivity = transactions.slice(0, 4).map((t) => ({
    action: (t.transaction_type || t.type || 'Transaction').replace(/_/g, ' '),
    property: t.survey_number || t.surveyNumber || t.property_id || 'Property',
    time: t.timestamp ? new Date(t.timestamp).toLocaleDateString() : 'Date unavailable',
>>>>>>> Stashed changes
  }));

  return (
    <Layout>
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#0F172A] mb-2">Dashboard</h1>
<<<<<<< Updated upstream
          <p className="text-[#64748B]">Overview of your properties, applications, and transfers.</p>
=======
          <p className="text-[#64748B]">Your registered properties, applications, and blockchain activity.</p>
>>>>>>> Stashed changes
        </div>
        {loadError && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{loadError}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-[#E2E8F0]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-semibold text-[#0F172A] mb-1">{stat.value}</p>
                  <p className="text-sm text-[#64748B]">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border-[#E2E8F0]">
              <CardHeader>
                <CardTitle className="text-[#0F172A]">GIS Map Overview</CardTitle>
                <CardDescription className="text-[#64748B]">
                  Open the interactive map to inspect parcels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-[#0F766E]/20 to-[#38BDF8]/20 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <Map className="w-32 h-32 text-[#0F766E]/30" />
                  <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#0F766E]" />
                    <span className="text-sm text-[#0F172A]">{properties.length} Properties</span>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <Link to="/map">
                      <Button size="sm" className="bg-[#0F766E] hover:bg-[#0F766E]/90">
                        View Full Map
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E2E8F0] mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[#0F172A]">Your Properties</CardTitle>
                    <CardDescription className="text-[#64748B]">Registered land parcels</CardDescription>
                  </div>
                  <Link to="/properties">
                    <Button variant="outline" size="sm" className="border-[#E2E8F0]">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
<<<<<<< Updated upstream
                  {recentProperties.length === 0 && (
                    <p className="text-sm text-[#64748B]">No registered properties yet.</p>
                  )}
                  {recentProperties.map((property: any, index: number) => (
                    <Link
                      key={index}
                      to={`/properties/${property.id}`}
                      className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg hover:bg-[#F1F5F9]"
                    >
=======
                  {recentProperties.length === 0 && <p className="py-6 text-center text-sm text-[#64748B]">No properties are linked to your account yet.</p>}
                  {recentProperties.map((property, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg">
>>>>>>> Stashed changes
                      <div className="flex-1">
                        <p className="font-medium text-[#0F172A]">{property.id}</p>
                        <p className="text-sm text-[#64748B]">{property.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[#0F172A]">{property.area}</p>
<<<<<<< Updated upstream
                        <span className="inline-block px-2 py-1 rounded text-xs mt-1 bg-[#16A34A]/10 text-[#16A34A]">
=======
                        <span className={`inline-block px-2 py-1 rounded text-xs mt-1 ${
                          property.status === 'REGISTERED'
                            ? 'bg-[#16A34A]/10 text-[#16A34A]'
                            : 'bg-[#38BDF8]/10 text-[#38BDF8]'
                        }`}>
>>>>>>> Stashed changes
                          {property.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-[#E2E8F0]">
              <CardHeader>
                <CardTitle className="text-[#0F172A]">Recent Activity</CardTitle>
                <CardDescription className="text-[#64748B]">Latest applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
<<<<<<< Updated upstream
                  {recentActivity.length === 0 && (
                    <p className="text-sm text-[#64748B]">No activity yet.</p>
                  )}
                  {recentActivity.map((activity: any, index: number) => (
=======
                  {recentActivity.length === 0 && <p className="py-6 text-center text-sm text-[#64748B]">No transactions recorded yet.</p>}
                  {recentActivity.map((activity, index) => (
>>>>>>> Stashed changes
                    <div key={index} className="flex gap-4">
                      <div className="w-2 h-2 bg-[#0F766E] rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#0F172A]">{activity.action}</p>
                        <p className="text-sm text-[#64748B]">{activity.property}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-[#64748B]" />
                          <p className="text-xs text-[#64748B]">{activity.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E2E8F0] mt-6">
              <CardHeader>
                <CardTitle className="text-[#0F172A]">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/register">
                  <Button className="w-full bg-[#0F766E] hover:bg-[#0F766E]/90" size="lg">
                    <FileText className="w-4 h-4 mr-2" />
                    Register New Property
                  </Button>
                </Link>
                <Link to="/transfer">
                  <Button variant="outline" className="w-full border-[#E2E8F0]" size="lg">
                    Ownership Transfer
                  </Button>
                </Link>
                <Link to="/inheritance">
                  <Button variant="outline" className="w-full border-[#E2E8F0]" size="lg">
                    Inheritance Transfer
                  </Button>
                </Link>
                <Link to="/valuation">
                  <Button variant="outline" className="w-full border-[#E2E8F0]" size="lg">
                    Land Valuation
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
