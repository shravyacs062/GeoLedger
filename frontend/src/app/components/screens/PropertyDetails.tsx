import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '../Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { MapPin, FileText, Clock, CheckCircle2, Loader2, ArrowLeftRight } from 'lucide-react';
import { Badge } from '../ui/badge';
import { api } from '../../../services/api';

export function PropertyDetails() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [searchParams] = useSearchParams();
  const identifier = propertyId || searchParams.get('survey') || 'SN-DEMO-001';

  const [property, setProperty] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [qr, setQr] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const prop = await api.properties.getBySurvey(identifier);
        setProperty(prop);
        const survey = prop?.survey_number || identifier;
        const [hist, qrData] = await Promise.all([
          api.ownership.getHistory(survey).catch(() => []),
          api.qr.get(survey).catch(() => null),
        ]);
        setHistory(hist || []);
        setQr(qrData);
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || 'Property not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [identifier]);

  const survey = property?.survey_number || identifier;
  const publicUrl = qr?.verify_url || `/public/verify/${survey}`;

  return (
    <Layout>
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold text-[#0F172A]">Property Details</h1>
              {property?.status && (
                <Badge className="bg-[#16A34A] hover:bg-[#16A34A]/90">{property.status}</Badge>
              )}
            </div>
            <p className="text-[#64748B]">
              {survey} {property?.property_id ? `• ${property.property_id}` : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="border-[#E2E8F0]">
              <Link to={`/transfer?survey=${survey}`}>
                <ArrowLeftRight className="w-4 h-4 mr-2" /> Transfer
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-[#E2E8F0]">
              <a href={publicUrl} target="_blank" rel="noreferrer">Public Verify</a>
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-[#64748B]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading property…
          </div>
        )}
        {error && <p className="text-sm text-[#DC2626]">{error}</p>}

        {property && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-[#E2E8F0]">
                <CardHeader>
                  <CardTitle>Registry Information</CardTitle>
                  <CardDescription>Current ownership and cadastral details</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#64748B]">Owner Wallet</p>
                    <p className="font-mono text-xs break-all">{property.owner_wallet}</p>
                  </div>
                  <div>
                    <p className="text-[#64748B]">Land Type</p>
                    <p className="font-medium">{property.land_type || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[#64748B]">Area</p>
                    <p className="font-medium">{property.area ? `${property.area} sq ft` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[#64748B]">Location</p>
                    <p className="font-medium flex items-start gap-1">
                      <MapPin className="w-4 h-4 mt-0.5 text-[#0F766E]" />
                      {[property.village, property.taluk, property.district, property.state].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[#64748B]">Blockchain Tx</p>
                    <p className="font-mono text-xs break-all">{property.blockchain_tx_hash || '—'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#E2E8F0]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Ownership History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {history.length === 0 && <p className="text-sm text-[#64748B]">No transactions recorded.</p>}
                  {history.map((tx, i) => (
                    <div key={tx.id || i} className="border border-[#E2E8F0] rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{tx.transaction_type}</p>
                        <Badge variant="outline">{tx.status}</Badge>
                      </div>
                      <p className="text-xs text-[#64748B] mt-1">{tx.timestamp}</p>
                      <p className="font-mono text-[11px] truncate mt-1">{tx.tx_hash || tx.blockchain_tx_hash}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-[#E2E8F0]">
                <CardHeader>
                  <CardTitle>Property QR Code</CardTitle>
                  <CardDescription>Scan to open the public verification page</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3">
                  {qr?.qr_image_base64 ? (
                    <img
                      src={`data:image/png;base64,${qr.qr_image_base64}`}
                      alt="Property QR"
                      className="w-48 h-48 border border-[#E2E8F0] rounded-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 border border-dashed border-[#CBD5E1] rounded-lg flex items-center justify-center text-xs text-[#64748B] p-4 text-center">
                      QR image unavailable — use the public verify link
                    </div>
                  )}
                  <a href={publicUrl} className="text-xs text-[#0F766E] break-all text-center hover:underline">
                    {publicUrl}
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const data = await api.qr.generate({ survey_number: survey });
                      setQr(data);
                    }}
                  >
                    Regenerate QR
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-[#E2E8F0]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild className="w-full bg-[#0F766E] hover:bg-[#0F766E]/90">
                    <Link to={`/inheritance?survey=${survey}`}>Inheritance Transfer</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/valuation`}>Estimate Value</Link>
                  </Button>
                  <p className="text-xs text-[#64748B] flex items-center gap-1 pt-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                    QR remains valid after ownership transfers
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
