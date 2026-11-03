import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { AlertCircle, Loader2, Upload } from 'lucide-react';
import { isAxiosError } from 'axios';
import { api } from '../../../services/api';
import { useAuth } from '../../context/useAuth';
import { useWallet } from '../../context/useWallet';

const REQUIRED_DOCS = [
  'DEATH_CERTIFICATE',
  'LEGAL_HEIR_CERTIFICATE',
  'FAMILY_TREE',
  'NOC_FROM_LEGAL_HEIRS',
  'MUTATION_CERTIFICATE',
  'OWNERSHIP_PROOF',
  'NEW_OWNER_ID_PROOF',
];

export function InheritanceTransfer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { address } = useWallet();

  const [surveyNumber, setSurveyNumber] = useState(searchParams.get('survey') || '');
  const [deceasedName, setDeceasedName] = useState('');
  const [deceasedWallet, setDeceasedWallet] = useState('');
  const [relationship, setRelationship] = useState('');
  const [heirName, setHeirName] = useState(user?.name || '');
  const [heirWallet, setHeirWallet] = useState('');
  const [heirsText, setHeirsText] = useState('');
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setFile = (docType: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [docType]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const linkedHeirWallet = heirWallet || address || user?.wallet_address || '';
      if (!surveyNumber || !linkedHeirWallet) {
        throw new Error('Survey number and heir wallet are required');
      }
      const missing = REQUIRED_DOCS.filter((d) => !files[d]);
      if (missing.length) {
        throw new Error(`Upload all required documents. Missing: ${missing.join(', ')}`);
      }

      const legal_heirs = heirsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, rel] = line.split(',').map((s) => s.trim());
          return { name, relationship: rel || '' };
        });

      const app = await api.applications.create({
        application_type: 'INHERITANCE_TRANSFER',
        survey_number: surveyNumber,
        applicant_wallet: linkedHeirWallet,
        applicant_name: heirName,
        applicant_email: user?.email,
        deceased_owner_name: deceasedName,
        deceased_owner_wallet: deceasedWallet || undefined,
        relationship,
        legal_heirs,
        heir_wallet: linkedHeirWallet,
        party_details: {
          applicant_name: heirName,
          applicant_email: user?.email,
          relationship,
          deceased_owner_name: deceasedName,
          deceased_owner_wallet: deceasedWallet,
          legal_heirs,
          buyer: { wallet_address: linkedHeirWallet, name: heirName },
        },
      });

      const appId = app.id || app.application_id;
      for (const docType of REQUIRED_DOCS) {
        const file = files[docType];
        if (!file) continue;
        await api.documents.upload(appId, file, docType);
      }

      navigate(`/applications/${appId}`);
    } catch (err: unknown) {
      const message = isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message || err.message
        : err instanceof Error ? err.message : undefined;
      setError(message || 'Failed to submit inheritance application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 lg:p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#0F172A] mb-2">Inheritance Transfer</h1>
          <p className="text-[#64748B]">
            Transfer ownership due to death of the registered owner. All legal heir documents are required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-[#E2E8F0]">
            <CardHeader>
              <CardTitle>Deceased Owner & Property</CardTitle>
              <CardDescription>Identify the registered property and deceased owner</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Survey Number / Property ID</Label>
                <Input value={surveyNumber} onChange={(e) => setSurveyNumber(e.target.value)} required placeholder="SN-DEMO-001" />
              </div>
              <div className="space-y-2">
                <Label>Deceased Owner Name</Label>
                <Input value={deceasedName} onChange={(e) => setDeceasedName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Deceased Owner Wallet (if known)</Label>
                <Input value={deceasedWallet} onChange={(e) => setDeceasedWallet(e.target.value)} placeholder="0x..." />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0]">
            <CardHeader>
              <CardTitle>Applicant / Legal Heir</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Applicant Name</Label>
                <Input value={heirName} onChange={(e) => setHeirName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Relationship to Deceased</Label>
                <Input value={relationship} onChange={(e) => setRelationship(e.target.value)} required placeholder="Son / Daughter / Spouse" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Heir Wallet Address</Label>
                <Input value={heirWallet || address || user?.wallet_address || ''} onChange={(e) => setHeirWallet(e.target.value)} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>All Legal Heirs (one per line: Name, Relationship)</Label>
                <Textarea
                  value={heirsText}
                  onChange={(e) => setHeirsText(e.target.value)}
                  placeholder={"Ravi Kumar, Son\nPriya Kumar, Daughter"}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0]">
            <CardHeader>
              <CardTitle>Required Legal Documents</CardTitle>
              <CardDescription>PDF or image. Automated verification runs after upload.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {REQUIRED_DOCS.map((docType) => (
                <div key={docType} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-[#E2E8F0] rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">{docType.replaceAll('_', ' ')}</p>
                    <p className="text-xs text-[#64748B]">{files[docType]?.name || 'Not uploaded'}</p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm text-[#0F766E] cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Upload
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.txt"
                      onChange={(e) => setFile(docType, e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          {error && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-[#DC2626] mt-0.5" />
              <p className="text-sm text-[#991B1B]">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="bg-[#0F766E] hover:bg-[#0F766E]/90">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Inheritance Application
          </Button>
        </form>
      </div>
    </Layout>
  );
}
