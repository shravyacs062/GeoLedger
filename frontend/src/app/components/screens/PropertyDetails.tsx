import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, ExternalLink, RefreshCw, Share2 } from 'lucide-react';

import { api } from '../../../services/api';
import { Layout } from '../Layout';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

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
};
type Document = { id: string; document_type: string; verification_status: string; document_hash: string };
type Transaction = { tx_hash?: string; transaction_type?: string; status?: string; timestamp?: string; previous_owner?: string; new_owner?: string };

export function PropertyDetails() {
  const { propertyId = '' } = useParams();
  const identifier = propertyId || new URLSearchParams(window.location.search).get('survey') || '';
  const [property, setProperty] = useState<Property | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    if (!identifier) {
      setLoading(false);
      setError('No property identifier was provided.');
      return () => { active = false; };
    }
    Promise.resolve().then(async () => {
      const record = await api.properties.getBySurvey(identifier);
      const key = record.property_id || record._id || record.survey_number;
      const [history, docs] = await Promise.all([
        api.ownership.getHistory(record.survey_number),
        api.documents.getByProperty(key),
      ]);
      if (active) {
        setProperty(record);
        setTransactions(history);
        setDocuments(docs);
        setError('');
      }
    }).catch((reason) => {
      if (active) setError(reason?.response?.data?.message || 'Property details could not be loaded.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [identifier, retry]);

  const publicUrl = property ? `${window.location.origin}/verify/property/${encodeURIComponent(property.survey_number)}` : '';
  const share = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setNotice('Public verification link copied.');
    } catch (reason) {
      setError((reason as Error).message || 'Unable to copy the verification link.');
    }
  };
  const exportRecord = () => {
    if (!property) return;
    const blob = new Blob([JSON.stringify({
      property_id: property.property_id || property._id,
      survey_number: property.survey_number,
      status: property.status,
      location: [property.village, property.taluk, property.district, property.state].filter(Boolean).join(', '),
      area: property.area,
      land_type: property.land_type,
      blockchain_tx_hash: property.blockchain_tx_hash,
      transactions,
    }, null, 2)], { type: 'application/json' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `${property.survey_number}-geoledger.json`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <Layout>
      <main className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
        <Link to="/properties" className="inline-flex items-center gap-2 text-sm text-[#0F766E]"><ArrowLeft className="h-4 w-4" />My Properties</Link>
        {loading ? <p className="py-12 text-center text-sm text-[#64748B]">Loading property…</p>
          : error ? <Card><CardContent className="space-y-4 p-8 text-center"><p role="alert" className="text-sm text-red-700">{error}</p><Button variant="outline" onClick={() => { setError(''); setLoading(true); setRetry((count) => count + 1); }}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></CardContent></Card>
            : property && <>
              <header className="flex flex-wrap items-end justify-between gap-4">
                <div><h1 className="text-3xl font-semibold">{property.survey_number}</h1><p className="text-sm text-[#64748B]">{[property.village, property.taluk, property.district, property.state].filter(Boolean).join(', ') || 'Location not recorded'}</p></div>
                <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void share()}><Share2 className="mr-2 h-4 w-4" />Share verification</Button><Button variant="outline" onClick={exportRecord}>Export record</Button><Button asChild className="bg-[#0F766E]"><Link to={`/transfer?survey=${encodeURIComponent(property.survey_number)}`}>Request transfer</Link></Button></div>
              </header>
              {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
              <div className="grid gap-6 lg:grid-cols-3">
                <section className="space-y-6 lg:col-span-2">
                  <Card><CardHeader><CardTitle>Property record</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
                    <div><p className="text-xs text-[#64748B]">Property ID</p><p className="break-all font-medium">{property.property_id || property._id || 'Not assigned'}</p></div>
                    <div><p className="text-xs text-[#64748B]">Status</p><p className="font-medium">{property.status || 'REGISTERED'}</p></div>
                    <div><p className="text-xs text-[#64748B]">Area</p><p className="font-medium">{property.area ?? 'Not recorded'} {property.area ? 'sq ft' : ''}</p></div>
                    <div><p className="text-xs text-[#64748B]">Land type</p><p className="font-medium">{property.land_type || 'Not recorded'}</p></div>
                    <div className="sm:col-span-2"><p className="text-xs text-[#64748B]">Owner wallet</p><p className="break-all font-mono text-xs">{property.owner_wallet}</p></div>
                    <div className="sm:col-span-2"><Link to={`/map?survey=${encodeURIComponent(property.survey_number)}`} className="text-sm text-[#0F766E] underline">View GIS location</Link><p className="mt-1 text-xs text-[#64748B]">GIS overlays are demonstrative unless identified as verified cadastral data.</p></div>
                  </CardContent></Card>
                  <Card><CardHeader><CardTitle>Documents</CardTitle></CardHeader><CardContent>
                    {documents.length === 0 ? <p className="text-sm text-[#64748B]">No documents are linked to this property.</p> : <ul className="divide-y">{documents.map((doc) => <li key={doc.id} className="py-3"><p className="font-medium">{doc.document_type} · {doc.verification_status}</p><p className="break-all font-mono text-xs text-[#64748B]">{doc.document_hash}</p></li>)}</ul>}
                  </CardContent></Card>
                  <Card><CardHeader><CardTitle>Transaction history</CardTitle></CardHeader><CardContent>
                    {property.blockchain_tx_hash && <p className="mb-3 break-all font-mono text-xs">Registration transaction: {property.blockchain_tx_hash}</p>}
                    {transactions.length === 0 ? <p className="text-sm text-[#64748B]">No ownership transactions are recorded yet.</p> : <div className="divide-y">{transactions.map((item, index) => <div key={`${item.tx_hash || item.timestamp}-${index}`} className="py-3 text-sm"><p>{(item.transaction_type || 'Transaction').replaceAll('_', ' ')} · {item.status || 'Recorded'}</p><p className="break-all font-mono text-xs">{item.tx_hash || 'Hash unavailable'}</p></div>)}</div>}
                  </CardContent></Card>
                </section>
                <Card className="h-fit"><CardHeader><CardTitle>Public verification</CardTitle></CardHeader><CardContent className="flex flex-col items-center gap-4">
                  <QRCodeSVG value={publicUrl} size={200} level="M" />
                  <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all text-center text-xs text-[#0F766E] underline">Open public verification <ExternalLink className="h-3 w-3 shrink-0" /></a>
                  <p className="text-center text-xs text-[#64748B]">This public page omits personal names, wallet addresses, and document contents.</p>
                </CardContent></Card>
              </div>
            </>}
      </main>
    </Layout>
  );
}
