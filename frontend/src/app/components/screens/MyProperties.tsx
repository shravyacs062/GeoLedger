import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  ArrowRight,
  FileText,
  RefreshCw,
} from 'lucide-react';

import { Layout } from '../Layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { api } from '../../../services/api';
import { useWallet } from '../../context/WalletContext';
import { sameAddress } from '../../../services/wallet';

export function MyProperties() {
  const { address } = useWallet();
  const [properties, setProperties] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await api.properties.list();
      setProperties(data);
    } catch (err) {
      console.error('Failed to load properties', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const filteredProperties = properties.filter((p) => {
    if (!sameAddress(p.owner_wallet, address)) return false;
    const q = searchQuery.toLowerCase();
    const survey = (p.survey_number || '').toLowerCase();
    const propId = (p.property_id || '').toLowerCase();
    const loc = (p.village || '').toLowerCase();
    return survey.includes(q) || propId.includes(q) || loc.includes(q);
  });

  return (
    <Layout>
      <div className="p-4 lg:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#0F172A] mb-2">Registered Properties</h1>
            <p className="text-[#64748B]">
              Verified land parcels anchored on GeoLedger with cryptographic integrity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadProperties}
              className="border-[#CBD5E1] text-[#0F172A]"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/applications/new">
              <Button size="sm" className="bg-[#0F766E] hover:bg-[#115E59]">
                Register New Land
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            placeholder="Search by survey number, property ID, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Property Cards */}
        {loading ? (
          <div className="py-12 text-center text-sm text-[#64748B]">Loading properties from registry...</div>
        ) : filteredProperties.length === 0 ? (
          <Card className="border-[#E2E8F0] p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-[#94A3B8]" />
            <h3 className="mt-4 text-base font-semibold text-[#0F172A]">No properties found</h3>
            <p className="mt-1 text-sm text-[#64748B]">
              {searchQuery
                ? 'Try a different search query.'
                : 'No land parcels are registered to this MetaMask account yet.'}
            </p>
            <Link to="/applications/new" className="mt-4 inline-block">
              <Button className="bg-[#0F766E] hover:bg-[#115E59]">Submit Registration Application</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((prop) => (
              <Card key={prop.property_id || prop._id} className="border-[#E2E8F0] transition-shadow hover:shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase text-[#0F766E]">Survey Number</span>
                      <CardTitle className="text-lg font-bold text-[#0F172A]">{prop.survey_number}</CardTitle>
                    </div>
                    <Badge className="border-0 bg-[#ECFDF5] text-[#0F766E]">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      {prop.status || 'REGISTERED'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-2 text-xs text-[#64748B]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#94A3B8]" />
                      <span>{prop.village || 'Thandavapura'}, {prop.taluk || 'Nanjangud'}, {prop.district || 'Mysuru'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-[#94A3B8]" />
                      <span>Area: {prop.area || 2500} sq ft ({prop.land_type || 'Residential'})</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-[#F8FAFC] p-3 text-xs">
                    <p className="font-medium text-[#475569]">Blockchain Owner Wallet</p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-[#0F766E]">
                      {prop.owner_wallet || '0x...'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link to={`/search`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        View GIS Parcel
                      </Button>
                    </Link>
                    <Link to={`/transfer`} className="flex-1">
                      <Button size="sm" className="w-full bg-[#0F766E] text-xs hover:bg-[#115E59]">
                        Transfer
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
