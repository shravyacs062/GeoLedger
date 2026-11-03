import { useState, useEffect } from 'react';
<<<<<<< Updated upstream
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
=======
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
>>>>>>> Stashed changes
import { Layout } from '../Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { ArrowRight, AlertCircle, Loader2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { api } from '../../../services/api';
<<<<<<< Updated upstream
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';

const TRANSFER_DOCS = [
  { type: 'SALE_DEED', label: 'Sale Deed' },
  { type: 'SELLER_ID_PROOF', label: 'Seller ID Proof' },
  { type: 'BUYER_ID_PROOF', label: 'Buyer ID Proof' },
  { type: 'MUTATION_CERTIFICATE', label: 'Mutation Certificate' },
];
=======
import { useWallet } from '../../context/useWallet';
>>>>>>> Stashed changes

export function PropertyTransfer() {
  const { address } = useWallet();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
<<<<<<< Updated upstream
  const [error, setError] = useState<string | null>(null);
  const [surveyInput, setSurveyInput] = useState(searchParams.get('survey') || '');
  const [property, setProperty] = useState<any>(null);
=======
  const [error, setError] = useState('');
  const [files, setFiles] = useState<Record<string, File>>({});
  const [property, setProperty] = useState({
    surveyNumber: searchParams.get('survey') || '',
    propertyId: '',
    location: '',
    area: '',
    registrationDate: '',
    ownerName: '',
    ownerWallet: address || '',
  });

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      setSurveyInput(survey);
      loadProperty(survey);
=======
      api.properties.getBySurvey(survey).then((p) => {
        if (p) {
          setProperty({
            surveyNumber: p.survey_number || survey,
            propertyId: p.property_id || `PROP-${survey}`,
            location: `${p.village || 'Block A'}, ${p.taluk || 'Taluk'}, ${p.district || 'Mysuru'}`,
            area: `${p.area || 2500} sq ft`,
            registrationDate: 'March 15, 2023',
            ownerName: 'Current Legal Owner',
            ownerWallet: p.owner_wallet || address || '',
          });
        }
      }).catch((err) => {
        setError(err?.response?.data?.message || 'Property could not be loaded. Select a registered property from My Properties.');
      });
>>>>>>> Stashed changes
    }
  }, [searchParams, address]);

  const handleExecuteTransfer = async () => {
    try {
      setLoading(true);
<<<<<<< Updated upstream
      setError(null);
      if (!property?.survey_number) throw new Error('Select a registered property first.');
      if (!newWallet) throw new Error('Enter the buyer wallet address.');
      const missing = TRANSFER_DOCS.filter((d) => !files[d.type]);
      if (missing.length) {
        throw new Error(`Upload required documents: ${missing.map((d) => d.label).join(', ')}`);
=======
      setError('');
      if (!property.surveyNumber) {
        setError('Select a registered property before requesting a transfer.');
        return;
      }
      if (!newOwnerName.trim() || !/^0x[a-fA-F0-9]{40}$/.test(newWallet)) {
        setError('Enter the buyer name and a valid buyer wallet address.');
        return;
      }
      const requiredFiles = ['SALE_DEED', 'SELLER_ID_PROOF', 'BUYER_ID_PROOF', 'MUTATION_CERTIFICATE'];
      const missing = requiredFiles.filter((type) => !files[type]);
      if (missing.length) {
        setError(`Upload the required transfer documents: ${missing.join(', ')}`);
        return;
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream

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
=======
      const appId = res?.application_id || res?._id;
      if (appId) {
        for (const type of requiredFiles) {
          await api.documents.upload(appId, files[type], type);
        }
        setShowConfirmation(false);
        navigate(`/applications/${appId}`);
      } else {
        throw new Error('Transfer application was created without an application ID.');
      }
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error).message || 'Transfer failed');
>>>>>>> Stashed changes
    } finally {
      setLoading(false);
    }
  };

<<<<<<< Updated upstream
=======
  const verificationSteps = [
    { id: 1, title: 'Owner Verification', status: 'pending', time: 'Checked on submission' },
    { id: 2, title: 'Document Check', status: 'pending', time: 'Registrar review required' },
    { id: 3, title: 'Blockchain Validation', status: 'pending', time: 'After approval' },
    { id: 4, title: 'Transfer Execution', status: 'pending', time: 'After approval' },
  ];

>>>>>>> Stashed changes
  return (
    <Layout>
      <div className="p-4 lg:p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#0F172A] mb-2">Ownership Transfer</h1>
<<<<<<< Updated upstream
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
=======
          <p className="text-[#64748B]">Submit a transfer request for registrar review. Ownership changes on-chain only after approval.</p>
          {!property.surveyNumber && <Link to="/properties" className="mt-2 inline-block text-sm text-[#0F766E] underline">Choose a property from My Properties</Link>}
          {error && <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Transfer Form */}
          <div className="lg:col-span-2">
            <Card className="border-[#E2E8F0] mb-6">
              <CardHeader>
                <CardTitle className="text-[#0F172A]">Property Information</CardTitle>
                <CardDescription className="text-[#64748B]">Current ownership details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-[#F8FAFC] rounded-lg p-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#64748B] mb-1">Survey Number</p>
                      <p className="font-medium text-[#0F172A]">{property.surveyNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#64748B] mb-1">Property ID</p>
                      <p className="font-medium text-[#0F172A]">{property.propertyId}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-[#0F172A]">Required transfer documents</p>
                    {['SALE_DEED', 'SELLER_ID_PROOF', 'BUYER_ID_PROOF', 'MUTATION_CERTIFICATE'].map((type) => (
                      <label key={type} className="block rounded-md border border-[#E2E8F0] p-3 text-sm">
                        <span className="font-medium">{type.replaceAll('_', ' ')}</span>
                        <input required type="file" accept=".pdf,.png,.jpg,.jpeg" className="mt-2 block w-full text-sm"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) setFiles((current) => ({ ...current, [type]: file }));
                          }} />
                      </label>
                    ))}
                  </div>

                  <div>
                    <p className="text-sm text-[#64748B] mb-1">Location</p>
                    <p className="font-medium text-[#0F172A]">{property.location}</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#64748B] mb-1">Total Area</p>
                      <p className="font-medium text-[#0F172A]">{property.area}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#64748B] mb-1">Registration Date</p>
                      <p className="font-medium text-[#0F172A]">{property.registrationDate}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E2E8F0]">
                    <p className="text-sm text-[#64748B] mb-1">Current Owner</p>
                    <p className="font-medium text-[#0F172A]">{property.ownerName}</p>
                    <p className="font-mono text-sm text-[#64748B] mt-1 break-all">{property.ownerWallet}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
>>>>>>> Stashed changes

          {property && (
            <Card className="border-[#E2E8F0]">
              <CardHeader>
                <CardTitle>Current Ownership</CardTitle>
              </CardHeader>
<<<<<<< Updated upstream
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
=======
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="new-owner-name">New Owner Name *</Label>
                    <Input
                      id="new-owner-name"
                      placeholder="Enter full legal name"
                      className="mt-2 border-[#E2E8F0]"
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="new-wallet">New Owner Wallet Address *</Label>
                    <Input
                      id="new-wallet"
                      placeholder="0x..."
                      className="mt-2 border-[#E2E8F0] font-mono text-sm"
                      value={newWallet}
                      onChange={(e) => setNewWallet(e.target.value)}
                    />
                    <p className="text-xs text-[#64748B] mt-2">
                      The new owner must provide their wallet address to receive ownership
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="transfer-date">Transfer Date *</Label>
                      <Input id="transfer-date" type="date" defaultValue="2026-10-15" className="mt-2 border-[#E2E8F0]" />
                    </div>
                    <div>
                      <Label htmlFor="sale-value">Sale Value (Optional)</Label>
                      <Input
                        id="sale-value"
                        type="number"
                        placeholder="₹ 0.00"
                        className="mt-2 border-[#E2E8F0]"
                        value={saleValue}
                        onChange={(e) => setSaleValue(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="transfer-reason">Reason for Transfer *</Label>
                    <Input
                      id="transfer-reason"
                      placeholder="e.g., Sale, Inheritance, Gift"
                      className="mt-2 border-[#E2E8F0]"
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                    />
                  </div>

                  <div className="bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded-lg p-4 flex gap-3">
                    <FileCheck className="w-5 h-5 text-[#38BDF8] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">Verification Required</p>
                      <p className="text-xs text-[#64748B] mt-1">
                        Documents and registered owner details are reviewed first. Blockchain ownership updates only after registrar approval.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button variant="outline" className="border-[#E2E8F0]">
                      <Link to="/properties">Cancel</Link>
                    </Button>
                    <Button
                      onClick={() => setShowConfirmation(true)}
                      className="bg-[#0F766E] hover:bg-[#0F766E]/90 sm:ml-auto"
                    >
                      Initiate Transfer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
          <div className="space-y-4 py-4">
            <div className="bg-[#F8FAFC] rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Property / Survey:</span>
                <span className="font-medium text-[#0F172A]">{property.surveyNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">From:</span>
                <span className="font-mono text-xs text-[#0F172A] truncate max-w-[200px]">{property.ownerWallet}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">To:</span>
                <span className="font-mono text-xs text-[#0F172A] truncate max-w-[200px]">{newWallet}</span>
              </div>
            </div>

            <div className="bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-lg p-3 flex gap-2">
              <FileCheck className="w-4 h-4 text-[#DC2626] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#64748B]">
                This submits a transfer application for review. It does not immediately change blockchain ownership.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                className="flex-1 border-[#E2E8F0]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecuteTransfer}
                disabled={loading}
                className="flex-1 bg-[#0F766E] hover:bg-[#0F766E]/90"
              >
                {loading ? 'Submitting Application...' : 'Submit for Review'}
              </Button>
            </div>
>>>>>>> Stashed changes
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
