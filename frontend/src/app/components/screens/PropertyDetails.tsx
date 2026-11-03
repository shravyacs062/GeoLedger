import { useEffect, useState } from 'react';
<<<<<<< Updated upstream
import { Link, useParams, useSearchParams } from 'react-router-dom';
=======
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, ExternalLink, MapPin, RefreshCw, Share2 } from 'lucide-react';
>>>>>>> Stashed changes
import { Layout } from '../Layout';
import { Button } from '../ui/button';
<<<<<<< Updated upstream
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
=======
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { api } from '../../../services/api';

type Property = {
  id?: string;
  _id?: string;
  property_id?: string;
  survey_number: string;
  owner_wallet: string;
  status?: string;
  village?: string;
  taluk?: string;
  district?: string;
  state?: string;
  area?: number;
  land_type?: string;
  blockchain_tx_hash?: string;
  blockchain_block_number?: number;
  created_at?: string;
};
type Transaction = {
  transaction_type?: string;
  timestamp?: string;
  tx_hash?: string;
  status?: string;
  previous_owner?: string;
  new_owner?: string;
};
type Document = {
  id: string;
  document_type: string;
  verification_status: string;
  document_hash: string;
};

export function PropertyDetails() {
  const { propertyId = '' } = useParams();
  const identifier = propertyId || new URLSearchParams(window.location.search).get('survey') || '';
  const [property, setProperty] = useState<Property | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let active = true;
    if (!identifier) return () => { active = false; };

    const load = async () => {
      try {
        const record = await api.properties.getBySurvey(identifier);
        const propertyKey = record.property_id || record._id || record.survey_number;
        const [history, docs] = await Promise.all([
          api.ownership.getHistory(record.survey_number),
          api.documents.getByProperty(propertyKey),
        ]);
        if (active) {
          setProperty(record);
          setTransactions(history);
          setDocuments(docs);
          setError('');
        }
      } catch (err) {
        if (active) setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Property details could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [identifier, reloadCount]);

  const publicUrl = property
    ? `${window.location.origin}/verify/property/${encodeURIComponent(property.survey_number)}`
    : '';
  const share = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setMessage('Public verification link copied.');
    } catch {
      setMessage(`Public verification link: ${publicUrl}`);
    }
  };
  const exportRecord = () => {
    if (!property) return;
    const blob = new Blob([JSON.stringify({
      property_id: property.property_id || property._id,
      survey_number: property.survey_number,
      status: property.status,
      locality: [property.village, property.taluk, property.district, property.state].filter(Boolean).join(', '),
      area: property.area,
      owner_wallet: property.owner_wallet,
      blockchain_tx_hash: property.blockchain_tx_hash,
      transactions,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${property.survey_number}-geoledger.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
        <Link to="/properties" className="inline-flex items-center gap-2 text-sm text-[#0F766E]"><ArrowLeft className="h-4 w-4" />My Properties</Link>
        {!identifier ? <Card><CardContent className="p-8 text-center"><p role="alert" className="text-sm text-red-700">No property identifier was provided.</p></CardContent></Card>
          : loading ? <p className="py-12 text-center text-sm text-[#64748B]">Loading property…</p>
          : error ? <Card><CardContent className="space-y-4 p-8 text-center"><p role="alert" className="text-sm text-red-700">{error}</p><Button variant="outline" onClick={() => { setLoading(true); setReloadCount((count) => count + 1); }}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></CardContent></Card>
            : property && <>
              <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div><h1 className="text-3xl font-semibold text-[#0F172A]">{property.survey_number}</h1><p className="mt-1 text-sm text-[#64748B]">{[property.village, property.taluk, property.district, property.state].filter(Boolean).join(', ') || 'Location not recorded'}</p></div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => void share()}><Share2 className="mr-2 h-4 w-4" />Share verification</Button>
                  <Button variant="outline" onClick={exportRecord}>Export record</Button>
                  <Link to={`/transfer?survey=${encodeURIComponent(property.survey_number)}`}><Button className="bg-[#0F766E]">Request transfer</Button></Link>
                </div>
              </header>
              {message && <p role="status" className="text-sm text-[#0F766E]">{message}</p>}
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <Card><CardHeader><CardTitle>Property record</CardTitle><CardDescription>Registered parcel information</CardDescription></CardHeader>
                    <CardContent className="grid gap-5 sm:grid-cols-2">
                      <div><p className="text-xs text-[#64748B]">Property ID</p><p className="break-all font-medium">{property.property_id || property._id || 'Not assigned'}</p></div>
                      <div><p className="text-xs text-[#64748B]">Registration status</p><p className="font-medium">{property.status || 'REGISTERED'}</p></div>
                      <div><p className="text-xs text-[#64748B]">Land area</p><p className="font-medium">{property.area ?? 'Not recorded'} {property.area ? 'sq ft' : ''}</p></div>
                      <div><p className="text-xs text-[#64748B]">Land type</p><p className="font-medium">{property.land_type || 'Not recorded'}</p></div>
                      <div className="sm:col-span-2"><p className="text-xs text-[#64748B]">Registered owner wallet</p><p className="break-all font-mono text-sm">{property.owner_wallet}</p></div>
                      <div className="sm:col-span-2"><Link className="inline-flex items-center gap-2 text-sm text-[#0F766E] underline" to={`/map?survey=${encodeURIComponent(property.survey_number)}`}><MapPin className="h-4 w-4" />View parcel in GIS map</Link><p className="mt-1 text-xs text-[#64748B]">GIS overlays are demonstrative unless explicitly identified as verified cadastral data.</p></div>
                    </CardContent>
                  </Card>
                  <Card><CardHeader><CardTitle>Blockchain history</CardTitle></CardHeader><CardContent>
                    {property.blockchain_tx_hash && <p className="mb-4 break-all text-sm">Registration transaction: <code className="font-mono text-xs">{property.blockchain_tx_hash}</code></p>}
                    {transactions.length === 0 ? <p className="text-sm text-[#64748B]">No ownership transactions are recorded yet.</p> : <div className="divide-y">{transactions.map((tx, index) => <div key={`${tx.tx_hash || tx.timestamp}-${index}`} className="grid gap-1 py-3 text-sm sm:grid-cols-3"><span>{(tx.transaction_type || 'Transaction').replaceAll('_', ' ')}</span><span>{tx.status || 'Recorded'} · {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'Date unavailable'}</span><span className="break-all font-mono text-xs">{tx.tx_hash || 'Transaction hash unavailable'}</span></div>)}</div>}
                  </CardContent></Card>
                  <Card><CardHeader><CardTitle>Documents</CardTitle><CardDescription>Private documents are only available to you and authorized registrars.</CardDescription></CardHeader><CardContent>
                    {documents.length === 0 ? <p className="text-sm text-[#64748B]">No documents linked to this property.</p> : <ul className="space-y-3">{documents.map((doc) => <li key={doc.id} className="flex flex-wrap justify-between gap-2 text-sm"><span>{doc.document_type.replaceAll('_', ' ')}</span><span>{doc.verification_status}</span><code className="w-full break-all text-xs text-[#64748B]">SHA-256 {doc.document_hash}</code></li>)}</ul>}
                  </CardContent></Card>
                </div>
                <Card className="h-fit"><CardHeader><CardTitle>Public verification QR</CardTitle><CardDescription>Scan to check public property status. Private documents and personal details are not included.</CardDescription></CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    <QRCodeSVG value={publicUrl} size={208} level="M" includeMargin />
                    <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all text-center text-xs text-[#0F766E] underline">Open public verification <ExternalLink className="h-3 w-3 shrink-0" /></a>
                    {property.blockchain_tx_hash && <p className="break-all text-center text-xs text-[#64748B]">Transaction {property.blockchain_tx_hash}</p>}
                    <p className="text-center text-xs text-[#64748B]">Document hashes confirm integrity, not original authenticity.</p>
                  </CardContent>
                </Card>
              </div>
            </>}
>>>>>>> Stashed changes
      </div>
    </Layout>
  );
}
