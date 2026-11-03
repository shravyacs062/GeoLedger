import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { ArrowRight, AlertCircle, Loader2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { api } from '../../../services/api';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';

const TRANSFER_DOCS = [
  { type: 'SALE_DEED', label: 'Sale Deed' },
  { type: 'SELLER_ID_PROOF', label: 'Seller ID Proof' },
  { type: 'BUYER_ID_PROOF', label: 'Buyer ID Proof' },
  { type: 'MUTATION_CERTIFICATE', label: 'Mutation Certificate' },
];

export function PropertyTransfer() {
  const { address } = useWallet();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surveyInput, setSurveyInput] = useState(searchParams.get('survey') || '');
  const [property, setProperty] = useState<any>(null);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newWallet, setNewWallet] = useState('');
  const [saleValue, setSaleValue] = useState('');
  const [transferReason, setTransferReason] = useState('Sale of Property');
  const [files, setFiles] = useState<Record<string, File | null>>({});

  const loadProperty = async (survey: string) => {
    if (!survey) return;
    try {
      const p = await api.properties.getBySurvey(survey);
      setProperty(p);
      setError(null);
    } catch (err: any) {
      setProperty(null);
      setError(err?.response?.data?.message || 'Property not found');
    }
  };

  useEffect(() => {
    const survey = searchParams.get('survey');
    if (survey) {
      setSurveyInput(survey);
      loadProperty(survey);
    }
  }, [searchParams]);

  const handleExecuteTransfer = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!property?.survey_number) throw new Error('Select a registered property first.');
      if (!newWallet) throw new Error('Enter the buyer wallet address.');
      const missing = TRANSFER_DOCS.filter((d) => !files[d.type]);
      if (missing.length) {
        throw new Error(`Upload required documents: ${missing.map((d) => d.label).join(', ')}`);
      }

      const seller = address || user?.wallet_address || property.owner_wallet;
      const res = await api.ownership.transfer({
        survey_number: property.survey_number,
        seller_wallet: seller,
        current_owner: seller,
        applicant_wallet: seller,
        buyer_wallet: newWallet,
        new_owner: newWallet,
        buyer_name: newOwnerName,
        consideration_amount: Number(saleValue) || 0,
        reason: transferReason,
      });

      const appId = res?.application_id || res?._id || res?.id;
      for (const doc of TRANSFER_DOCS) {
        const file = files[doc.type];
        if (file) await api.documents.upload(appId, file, doc.type);
      }

      setShowConfirmation(false);
      navigate(`/applications/${appId}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Transfer failed');
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 lg:p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#0F172A] mb-2">Ownership Transfer</h1>
          <p className="text-[#64748B]">Transfer registered property to a new owner after document review and admin approval</p>
        </div>

        <div className="space-y-6">
          <Card className="border-[#E2E8F0]">
            <CardHeader>
              <CardTitle>Select Property</CardTitle>
              <CardDescription>Survey number of the property you currently own</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <Input
                value={surveyInput}
                onChange={(e) => setSurveyInput(e.target.value)}
                placeholder="SN-DEMO-001"
              />
              <Button type="button" variant="outline" onClick={() => loadProperty(surveyInput.trim())}>
                Load Property
              </Button>
            </CardContent>
          </Card>

          {property && (
            <Card className="border-[#E2E8F0]">
              <CardHeader>
                <CardTitle>Current Ownership</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#64748B]">Survey Number</p>
                  <p className="font-medium">{property.survey_number}</p>
                </div>
                <div>
                  <p className="text-[#64748B]">Property ID</p>
                  <p className="font-medium">{property.property_id}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[#64748B]">Owner Wallet</p>
                  <p className="font-mono text-xs break-all">{property.owner_wallet}</p>
                </div>
                <div>
                  <p className="text-[#64748B]">Area</p>
                  <p className="font-medium">{property.area ? `${property.area} sq ft` : '—'}</p>
                </div>
                <div>
                  <p className="text-[#64748B]">Status</p>
                  <p className="font-medium">{property.status}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-[#E2E8F0]">
            <CardHeader>
              <CardTitle>New Owner Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>New Owner Name *</Label>
                <Input className="mt-2" value={newOwnerName} onChange={(e) => setNewOwnerName(e.target.value)} />
              </div>
              <div>
                <Label>New Owner Wallet *</Label>
                <Input className="mt-2 font-mono text-sm" value={newWallet} onChange={(e) => setNewWallet(e.target.value)} placeholder="0x..." />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Sale Value (optional)</Label>
                  <Input className="mt-2" type="number" value={saleValue} onChange={(e) => setSaleValue(e.target.value)} />
                </div>
                <div>
                  <Label>Reason *</Label>
                  <Input className="mt-2" value={transferReason} onChange={(e) => setTransferReason(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0]">
            <CardHeader>
              <CardTitle>Required Transfer Documents</CardTitle>
              <CardDescription>All four documents must be uploaded before admin can approve</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {TRANSFER_DOCS.map((doc) => (
                <div key={doc.type} className="flex items-center justify-between border border-[#E2E8F0] rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium">{doc.label}</p>
                    <p className="text-xs text-[#64748B]">{files[doc.type]?.name || 'Not uploaded'}</p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm text-[#0F766E] cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Upload
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.txt"
                      onChange={(e) =>
                        setFiles((prev) => ({ ...prev, [doc.type]: e.target.files?.[0] || null }))
                      }
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

          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/properties">Cancel</Link>
            </Button>
            <Button
              className="bg-[#0F766E] hover:bg-[#0F766E]/90"
              disabled={!property || loading}
              onClick={() => setShowConfirmation(true)}
            >
              Initiate Transfer <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Transfer Application</DialogTitle>
            <DialogDescription>
              This submits an application for admin review. Ownership changes only after approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p><span className="text-[#64748B]">Survey:</span> {property?.survey_number}</p>
            <p><span className="text-[#64748B]">New owner:</span> {newOwnerName || '—'}</p>
            <p className="font-mono text-xs break-all">{newWallet}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirmation(false)}>Cancel</Button>
            <Button className="flex-1 bg-[#0F766E] hover:bg-[#0F766E]/90" disabled={loading} onClick={handleExecuteTransfer}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Application'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
