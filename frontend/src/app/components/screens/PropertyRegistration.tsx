import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';

import { api } from '../../../services/api';
import { useAuth } from '../../context/useAuth';
import { useWallet } from '../../context/useWallet';
import { Layout } from '../Layout';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const REQUIRED_DOCUMENTS = ['SALE_DEED', 'ID_PROOF', 'MUTATION_CERTIFICATE'];

export function PropertyRegistration() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { address } = useWallet();
  const [values, setValues] = useState({
    surveyNumber: '',
    area: '',
    landType: 'Residential',
    village: '',
    taluk: '',
    district: '',
    state: 'Karnataka',
  });
  const [files, setFiles] = useState<Record<string, File>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const update = (key: keyof typeof values, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (!user?.wallet_address || !address || user.wallet_address.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Connect the wallet linked to your account before submitting.');
      }
      const missing = REQUIRED_DOCUMENTS.filter((type) => !files[type]);
      if (missing.length) throw new Error(`Upload all required documents: ${missing.join(', ')}`);
      const application = await api.applications.create({
        application_type: 'NEW_REGISTRATION',
        survey_number: values.surveyNumber,
        applicant_wallet: user.wallet_address,
        applicant_name: user.name,
        applicant_email: user.email,
        property_details: {
          area: Number(values.area),
          land_type: values.landType,
          village: values.village,
          taluk: values.taluk,
          district: values.district,
          state: values.state,
        },
      });
      const id = application.id || application.application_id || application._id;
      if (!id) throw new Error('The application was created without an identifier.');
      for (const type of REQUIRED_DOCUMENTS) await api.documents.upload(id, files[type], type);
      navigate(`/applications/${id}`);
    } catch (reason) {
      setError((reason as { response?: { data?: { message?: string } } })?.response?.data?.message || (reason as Error).message || 'Unable to submit application.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <main className="mx-auto max-w-4xl space-y-6 p-4 lg:p-8">
        <header><h1 className="text-3xl font-semibold tracking-tight">Register a property</h1><p className="mt-1 text-sm text-[#64748B]">An Admin reviews the application before any blockchain registration takes place.</p></header>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <form onSubmit={(event) => void submit(event)} className="space-y-6">
          <Card><CardHeader><CardTitle>Property information</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="survey">Survey number</Label><Input id="survey" required value={values.surveyNumber} onChange={(event) => update('surveyNumber', event.target.value)} /></div>
            <div><Label htmlFor="area">Area (sq ft)</Label><Input id="area" type="number" min="0.01" step="any" required value={values.area} onChange={(event) => update('area', event.target.value)} /></div>
            <div><Label htmlFor="land-type">Land type</Label><select id="land-type" className="mt-1 w-full rounded-md border p-2" value={values.landType} onChange={(event) => update('landType', event.target.value)}><option>Residential</option><option>Commercial</option><option>Agricultural</option><option>Industrial</option><option>Other</option></select></div>
            {(['village', 'taluk', 'district', 'state'] as const).map((field) => <div key={field}><Label htmlFor={field}>{field[0].toUpperCase() + field.slice(1)}</Label><Input id={field} required={field !== 'state'} value={values[field]} onChange={(event) => update(field, event.target.value)} /></div>)}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Required documents</CardTitle></CardHeader><CardContent className="space-y-4">
            {REQUIRED_DOCUMENTS.map((type) => <label key={type} className="flex flex-col gap-2 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span>{type.replaceAll('_', ' ')}</span><input type="file" required accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt" onChange={(event) => { const file = event.target.files?.[0]; if (file) setFiles((current) => ({ ...current, [type]: file })); }} />
            </label>)}
            <p className="text-xs text-[#64748B]"><Upload className="mr-1 inline h-3 w-3" />Documents are integrity-checked and remain subject to Admin authenticity review.</p>
          </CardContent></Card>
          <Button type="submit" disabled={busy} className="bg-[#0F766E]">{busy ? 'Submitting…' : 'Submit application'}</Button>
        </form>
      </main>
    </Layout>
  );
}
