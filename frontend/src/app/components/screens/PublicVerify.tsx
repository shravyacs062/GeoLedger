import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, Map, Shield } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { api } from '../../../services/api';

export function PublicVerify() {
  const { identifier } = useParams<{ identifier: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!identifier) return;
    const load = async () => {
      try {
        setLoading(true);
        const result = await api.publicVerify.verifyProperty(identifier);
        setData(result);
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || 'Property not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [identifier]);

  const area = data?.area_sqft ?? data?.area;
  const location = [data?.village || data?.locality, data?.taluk, data?.district, data?.state]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-[#E2E8F0] bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-[#0F172A]">
            <div className="w-9 h-9 bg-[#0F766E] rounded-lg flex items-center justify-center">
              <Map className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold">GeoLedger Public Verify</span>
          </Link>
          <Badge variant="outline" className="gap-1">
            <Shield className="w-3 h-3" /> Public
          </Badge>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {loading && (
          <div className="flex items-center gap-2 text-[#64748B]">
            <Loader2 className="w-4 h-4 animate-spin" /> Verifying property…
          </div>
        )}

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-4 flex gap-2">
            <AlertCircle className="w-5 h-5 text-[#DC2626]" />
            <p className="text-[#991B1B]">{error}</p>
          </div>
        )}

        {data && (
          <>
            <Card className="border-[#E2E8F0]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                  Property Verification
                </CardTitle>
                <CardDescription>
                  Essential public cadastral information. Confidential documents are not exposed.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#64748B]">Survey Number</p>
                  <p className="font-medium text-[#0F172A]">{data.survey_number || identifier}</p>
                </div>
                <div>
                  <p className="text-[#64748B]">Property ID</p>
                  <p className="font-medium text-[#0F172A]">{data.property_id || '—'}</p>
                </div>
                <div>
                  <p className="text-[#64748B]">Registration Status</p>
                  <p className="font-medium text-[#0F172A]">{data.status || data.property_status || '—'}</p>
                </div>
                <div>
                  <p className="text-[#64748B]">Land Type</p>
                  <p className="font-medium text-[#0F172A]">{data.land_type || '—'}</p>
                </div>
                <div>
                  <p className="text-[#64748B]">Current Owner Wallet</p>
                  <p className="font-mono text-xs text-[#0F172A] break-all">
                    {data.owner_wallet || data.blockchain_owner_wallet || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[#64748B]">Area</p>
                  <p className="font-medium text-[#0F172A]">{area ? `${area} sq ft` : '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[#64748B]">Location</p>
                  <p className="font-medium text-[#0F172A]">{location || '—'}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E2E8F0]">
              <CardHeader>
                <CardTitle>Blockchain Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-[#64748B]">On-chain owner: </span>
                  <span className="font-mono text-xs break-all">
                    {data.blockchain_owner_wallet || 'Unavailable'}
                  </span>
                </p>
                <p>
                  <span className="text-[#64748B]">Matches registry: </span>
                  {data.ownership_matches === true
                    ? 'Yes'
                    : data.ownership_matches === false
                      ? 'No'
                      : '—'}
                </p>
                {data.blockchain_tx_hash && (
                  <p className="font-mono text-xs break-all">
                    <span className="text-[#64748B]">Tx: </span>
                    {data.blockchain_tx_hash}
                  </p>
                )}
                {(data.verified_documents || []).length > 0 && (
                  <div className="pt-2">
                    <p className="text-[#64748B] mb-2">
                      Anchored document hashes ({data.verified_documents.length})
                    </p>
                    <ul className="space-y-1">
                      {data.verified_documents.map((d: any, i: number) => (
                        <li key={i} className="font-mono text-xs text-[#334155] truncate">
                          {d.document_type}: {d.document_hash || d.sha256_hash}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.verification_statement && (
                  <p className="text-xs text-[#64748B] pt-2">{data.verification_statement}</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
