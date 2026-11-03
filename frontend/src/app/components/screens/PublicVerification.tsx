import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Map } from 'lucide-react';
import { api } from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type PublicProperty = {
  property_id: string;
  survey_number: string;
  status: string;
  blockchain_verified?: boolean;
  blockchain_source?: string;
  blockchain_registered_at?: string | number;
  blockchain_tx_hash?: string;
  locality?: string;
  taluk?: string;
  district?: string;
  area_sqft?: number;
  verified_documents?: Array<{ verification_status: string }>;
  verification_statement?: string;
};

export function PublicVerification() {
  const { identifier = '' } = useParams();
  const [record, setRecord] = useState<PublicProperty | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.publicVerify.verifyProperty(identifier).then((result) => {
      if (active) setRecord(result);
    }).catch((err) => {
      if (active) setError(err?.response?.data?.message || 'Verification record not found.');
    });
    return () => { active = false; };
  }, [identifier]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-center gap-3"><div className="rounded-lg bg-[#0F766E] p-2 text-white"><Map /></div><div><h1 className="text-xl font-semibold">GeoLedger public verification</h1><p className="text-sm text-[#64748B]">Read-only property record</p></div></header>
        {error && <Card><CardContent className="p-6"><p role="alert" className="text-sm text-red-700">{error}</p></CardContent></Card>}
        {!record && !error && <p className="py-12 text-center text-sm text-[#64748B]">Loading verification record…</p>}
        {record && <Card><CardHeader><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-[#0F766E]" /><CardTitle>{record.survey_number}</CardTitle></div><p className="text-sm text-[#64748B]">Property ID: {record.property_id}</p></CardHeader>
          <CardContent className="space-y-5">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div><dt className="text-xs text-[#64748B]">Registry status</dt><dd className="font-medium">{record.status}</dd></div>
              <div><dt className="text-xs text-[#64748B]">On-chain verification</dt><dd className="font-medium">{record.blockchain_verified ? 'Verified on configured chain' : record.blockchain_source === 'blockchain' ? 'Not found on configured chain' : 'Unavailable; showing cached registry data'}</dd></div>
              <div><dt className="text-xs text-[#64748B]">Area</dt><dd className="font-medium">{record.area_sqft ?? 'Not recorded'} {record.area_sqft ? 'sq ft' : ''}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-[#64748B]">Location</dt><dd className="font-medium">{[record.locality, record.taluk, record.district].filter(Boolean).join(', ') || 'Not recorded'}</dd></div>
              <div><dt className="text-xs text-[#64748B]">Verified document count</dt><dd className="font-medium">{record.verified_documents?.filter((doc) => doc.verification_status === 'VERIFIED').length || 0}</dd></div>
              <div><dt className="text-xs text-[#64748B]">Registry / chain record date</dt><dd className="font-medium">{record.blockchain_registered_at ? new Date(typeof record.blockchain_registered_at === 'number' ? record.blockchain_registered_at * 1000 : record.blockchain_registered_at).toLocaleString() : 'Not available'}</dd></div>
            </dl>
            {record.blockchain_tx_hash && <div><p className="text-xs text-[#64748B]">Transaction hash</p><p className="break-all font-mono text-xs">{record.blockchain_tx_hash}</p></div>}
            <p className="rounded-md bg-[#F1F5F9] p-3 text-xs text-[#475569]">{record.verification_statement} Public view does not disclose private documents, personal names, or wallet addresses.</p>
            <p className="text-xs text-[#64748B]">A matching document hash proves integrity against its recorded baseline, not that the source document is genuine.</p>
            <Link to="/" className="text-sm text-[#0F766E] underline">Visit GeoLedger</Link>
          </CardContent>
        </Card>}
      </div>
    </main>
  );
}
