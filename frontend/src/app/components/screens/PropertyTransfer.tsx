import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Upload } from 'lucide-react';

import { api } from '../../../services/api';
import { useAuth } from '../../context/useAuth';
import { useWallet } from '../../context/useWallet';
import { Layout } from '../Layout';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const REQUIRED_DOCUMENTS = ['SALE_DEED', 'SELLER_ID_PROOF', 'BUYER_ID_PROOF', 'MUTATION_CERTIFICATE'];
type Property = { survey_number: string; property_id?: string; area?: number; village?: string; taluk?: string; district?: string; owner_wallet?: string };

export function PropertyTransfer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { address } = useWallet();
  const [survey, setSurvey] = useState(searchParams.get('survey') || '');
  const [property, setProperty] = useState<Property | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerWallet, setBuyerWallet] = useState('');
  const [reason, setReason] = useState('Sale');
  const [files, setFiles] = useState<Record<string, File>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProperty = async (value: string) => {
    setError('');
    try {
      setProperty(await api.properties.getBySurvey(value.trim()));
    } catch (issue) {
      setProperty(null);
      setError((issue as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Property could not be loaded.');
    }
  };

  useEffect(() => {
    const initialSurvey = searchParams.get('survey');
    if (initialSurvey) void loadProperty(initialSurvey);
  }, [searchParams]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!property) throw new Error('Load a registered property first.');
      if (!user?.wallet_address || !address || user.wallet_address.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Connect the wallet linked to this account before requesting a transfer.');
      }
      if (!/^0x[a-fA-F0-9]{40}$/.test(buyerWallet)) throw new Error('Enter a valid buyer wallet address.');
      if (buyerWallet.toLowerCase() === user.wallet_address.toLowerCase()) throw new Error('Buyer wallet must be different from your wallet.');
      if (REQUIRED_DOCUMENTS.some((type) => !files[type])) throw new Error('Upload all required transfer documents.');
      const application = await api.ownership.transfer({
        survey_number: property.survey_number,
        seller_wallet: user.wallet_address,
        applicant_wallet: user.wallet_address,
        buyer_wallet: buyerWallet,
        buyer_name: buyerName,
        reason,
      });
      const applicationId = application.id || application.application_id || application._id;
      if (!applicationId) throw new Error('Transfer request was created without an application identifier.');
      for (const type of REQUIRED_DOCUMENTS) await api.documents.upload(applicationId, files[type], type);
      navigate(`/applications/${applicationId}`);
    } catch (issue) {
      setError((issue as { response?: { data?: { message?: string } } })?.response?.data?.message || (issue as Error).message || 'Unable to submit transfer request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <main className="mx-auto max-w-4xl space-y-6 p-4 lg:p-8">
        <header><h1 className="text-3xl font-semibold tracking-tight">Ownership transfer</h1><p className="mt-1 text-sm text-[#64748B]">Submit a transfer request. Ownership changes only after Admin approval and blockchain confirmation.</p></header>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <form onSubmit={(event) => void submit(event)} className="space-y-6">
          <Card><CardHeader><CardTitle>Property</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="flex gap-2"><Input value={survey} onChange={(event) => setSurvey(event.target.value)} placeholder="Survey number" required /><Button type="button" variant="outline" onClick={() => void loadProperty(survey)}>Load</Button></div>
            {property && <div className="rounded-md bg-slate-50 p-3 text-sm"><p><strong>{property.survey_number}</strong> · {property.area ?? 'Area not recorded'} sq ft</p><p className="text-xs text-[#64748B]">{[property.village, property.taluk, property.district].filter(Boolean).join(', ')}</p><p className="mt-1 break-all font-mono text-xs">Owner: {property.owner_wallet || 'Not recorded'}</p></div>}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>New owner</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="buyer-name">Buyer legal name</Label><Input id="buyer-name" required value={buyerName} onChange={(event) => setBuyerName(event.target.value)} /></div>
            <div><Label htmlFor="buyer-wallet">Buyer wallet address</Label><Input id="buyer-wallet" required value={buyerWallet} onChange={(event) => setBuyerWallet(event.target.value)} className="font-mono" /></div>
            <div className="sm:col-span-2"><Label htmlFor="reason">Transfer reason</Label><Input id="reason" required value={reason} onChange={(event) => setReason(event.target.value)} /></div>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Required transfer documents</CardTitle></CardHeader><CardContent className="space-y-3">
            {REQUIRED_DOCUMENTS.map((type) => <label key={type} className="flex flex-col gap-2 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span>{type.replaceAll('_', ' ')}</span><input type="file" required accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt" onChange={(event) => { const file = event.target.files?.[0]; if (file) setFiles((current) => ({ ...current, [type]: file })); }} /></label>)}
            <p className="text-xs text-[#64748B]"><Upload className="mr-1 inline h-3 w-3" />Documents are subject to integrity checks and human review.</p>
          </CardContent></Card>
          <Button type="submit" disabled={loading || !property} className="bg-[#0F766E]">{loading ? 'Submitting…' : 'Submit transfer request'}<ArrowRight className="ml-2 h-4 w-4" /></Button>
        </form>
      </main>
    </Layout>
  );
}
