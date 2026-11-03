import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../../services/api';
import { useWallet } from '../../context/useWallet';
import { useAuth } from '../../context/useAuth';

export function PropertyRegistration() {
  const navigate = useNavigate();
  const { address } = useWallet();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [applicationType, setApplicationType] = useState<'NEW_REGISTRATION' | 'INHERITANCE_TRANSFER'>('NEW_REGISTRATION');

  const [formData, setFormData] = useState({
    surveyNumber: '',
    propertyId: '',
    location: '',
    area: '',
    district: '',
    latitude: '',
    longitude: '',
    ownerName: user?.name || '',
    governmentId: '',
    contactNumber: '',
    email: user?.email || '',
    walletAddress: address || user?.wallet_address || '',
    residentialAddress: '',
  });

  const [files, setFiles] = useState<{ [key: string]: File }>({});

  const updateField = (field: string, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleFileUpload = (docName: string, file: File) => {
    setFiles((prev) => ({ ...prev, [docName]: file }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
<<<<<<< Updated upstream
      const missing = documents.filter((d) => d.required && !files[d.name]);
      if (missing.length) {
        throw new Error(`Upload required documents: ${missing.map((d) => d.label).join(', ')}`);
      }
      if (!(address || formData.walletAddress)) {
        throw new Error('Wallet address is required. Connect MetaMask or enter it in Owner Information.');
      }

=======
      setError('');
      const requiredFiles = applicationType === 'NEW_REGISTRATION'
        ? ['SALE_DEED', 'ID_PROOF', 'MUTATION_CERTIFICATE']
        : ['DEATH_CERTIFICATE', 'LEGAL_HEIR_CERTIFICATE', 'FAMILY_TREE', 'NOC_FROM_LEGAL_HEIRS', 'MUTATION_CERTIFICATE', 'OWNERSHIP_PROOF', 'NEW_OWNER_ID_PROOF'];
      const missingFiles = requiredFiles.filter((type) => !files[type]);
      if (!formData.surveyNumber.trim() || !formData.location.trim() || !formData.area || Number(formData.area) <= 0) {
        setError('Enter a survey number, location, and positive land area.');
        return;
      }
      if (!formData.ownerName.trim() || !formData.email.trim()) {
        setError('Enter the applicant name and email address.');
        return;
      }
      if (!/^0x[a-fA-F0-9]{40}$/.test(address || formData.walletAddress)) {
        setError('Link a valid Ethereum wallet in your profile before submitting.');
        return;
      }
      if (missingFiles.length) {
        setError(`Upload all required documents before submitting: ${missingFiles.join(', ')}`);
        return;
      }
>>>>>>> Stashed changes
      const app = await api.applications.create({
        survey_number: formData.surveyNumber,
        application_type: applicationType,
        applicant_name: formData.ownerName,
        applicant_email: formData.email,
        applicant_id: formData.governmentId,
        applicant_wallet: address || formData.walletAddress,
        wallet_address: address || formData.walletAddress,
        applicant_email: formData.email,
        applicant_phone: formData.contactNumber,
        party_details: {
          applicant_name: formData.ownerName,
          applicant_email: formData.email,
          applicant_phone: formData.contactNumber,
          government_id: formData.governmentId,
          residential_address: formData.residentialAddress,
        },
        property_details: {
          area: Number(formData.area),
          land_type: 'Residential',
          location: formData.location,
          village: formData.location.split(',')[0],
          district: formData.district,
          taluk: '',
          coordinates: { lat: formData.latitude, lon: formData.longitude },
        },
      });

      const appId = app._id || app.application_id || app.id;
<<<<<<< Updated upstream
      for (const [docType, file] of Object.entries(files)) {
        await api.documents.upload(appId, file, docType);
=======
      for (const docType of requiredFiles) {
        await api.documents.upload(appId, files[docType], docType);
>>>>>>> Stashed changes
      }
      navigate(`/applications/${appId}`);
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error).message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: 'Property Details', completed: false },
    { id: 2, title: 'Owner Information', completed: false },
    { id: 3, title: 'Document Upload', completed: false },
    { id: 4, title: 'Review & Submit', completed: false },
  ];

  const documents = [
<<<<<<< Updated upstream
    { name: 'SALE_DEED', label: 'Sale Deed', required: true },
    { name: 'ID_PROOF', label: 'Owner ID Proof', required: true },
    { name: 'MUTATION_CERTIFICATE', label: 'Mutation Certificate', required: true },
=======
    ...(applicationType === 'NEW_REGISTRATION'
      ? ['SALE_DEED', 'ID_PROOF', 'MUTATION_CERTIFICATE']
      : ['DEATH_CERTIFICATE', 'LEGAL_HEIR_CERTIFICATE', 'FAMILY_TREE', 'NOC_FROM_LEGAL_HEIRS', 'MUTATION_CERTIFICATE', 'OWNERSHIP_PROOF', 'NEW_OWNER_ID_PROOF'])
      .map((name) => ({ name, required: true })),
>>>>>>> Stashed changes
  ];

  return (
    <Layout>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#0F172A] mb-2">{applicationType === 'NEW_REGISTRATION' ? 'Register New Property' : 'Apply for Inheritance Transfer'}</h1>
          <p className="text-[#64748B]">Submit an application for registrar review. Blockchain registration happens only after approval.</p>
          <label className="mt-4 block max-w-sm text-sm font-medium text-[#334155]">
            Application workflow
            <select className="mt-1 block w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2"
              value={applicationType} onChange={(event) => {
                setApplicationType(event.target.value as typeof applicationType);
                setFiles({});
                setError('');
              }}>
              <option value="NEW_REGISTRATION">New land registration</option>
              <option value="INHERITANCE_TRANSFER">Inheritance transfer</option>
            </select>
          </label>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    currentStep === step.id
                      ? 'bg-[#0F766E] text-white'
                      : currentStep > step.id
                      ? 'bg-[#16A34A] text-white'
                      : 'bg-[#E2E8F0] text-[#64748B]'
                  }`}>
                    {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                  </div>
                  <div className="hidden sm:block flex-1">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-[#0F172A]' : 'text-[#64748B]'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block h-0.5 flex-1 mx-4 ${
                    currentStep > step.id ? 'bg-[#16A34A]' : 'bg-[#E2E8F0]'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="border-[#E2E8F0]">
              <CardHeader>
                <CardTitle className="text-[#0F172A]">
                  {currentStep === 1 && 'Property Details'}
                  {currentStep === 2 && 'Owner Information'}
                  {currentStep === 3 && 'Document Upload'}
                  {currentStep === 4 && 'Review & Submit'}
                </CardTitle>
                <CardDescription className="text-[#64748B]">
                  {currentStep === 1 && 'Enter the basic details of the property'}
                  {currentStep === 2 && 'Provide owner and wallet information'}
                  {currentStep === 3 && 'Upload required legal documents'}
                  {currentStep === 4 && 'Review all information before submitting'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Step 1: Property Details */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="survey-number">Survey Number *</Label>
                        <Input
                          id="survey-number"
                          placeholder="e.g., SN-2023-4521"
                          className="mt-2 border-[#E2E8F0]"
                          value={formData.surveyNumber}
                          onChange={(e) => updateField('surveyNumber', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="property-id">Property ID</Label>
                        <Input
                          id="property-id"
                          placeholder={formData.surveyNumber ? `GL-${formData.surveyNumber}` : 'Auto-generated'}
                          disabled
                          className="mt-2 bg-[#F8FAFC]"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="location">Location / Address *</Label>
                      <Textarea
                        id="location"
                        placeholder="Enter full address with district and block details"
                        className="mt-2 border-[#E2E8F0]"
                        rows={3}
                        value={formData.location}
                        onChange={(e) => updateField('location', e.target.value)}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="area">Total Area (sq ft) *</Label>
                        <Input
                          id="area"
                          type="number"
                          placeholder="e.g., 2500"
                          className="mt-2 border-[#E2E8F0]"
                          value={formData.area}
                          onChange={(e) => updateField('area', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="district">District *</Label>
                        <Input
                          id="district"
                          placeholder="e.g., North District"
                          className="mt-2 border-[#E2E8F0]"
                          value={formData.district}
                          onChange={(e) => updateField('district', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="latitude">Latitude *</Label>
                        <Input
                          id="latitude"
                          placeholder="e.g., 28.7041"
                          className="mt-2 border-[#E2E8F0]"
                          value={formData.latitude}
                          onChange={(e) => updateField('latitude', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="longitude">Longitude *</Label>
                        <Input
                          id="longitude"
                          placeholder="e.g., 77.1025"
                          className="mt-2 border-[#E2E8F0]"
                          value={formData.longitude}
                          onChange={(e) => updateField('longitude', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Owner Information */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="owner-name">Owner Full Name *</Label>
                      <Input
                        id="owner-name"
                        placeholder="Enter full legal name"
                        className="mt-2 border-[#E2E8F0]"
                        value={formData.ownerName}
                        onChange={(e) => updateField('ownerName', e.target.value)}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="owner-id">Government ID *</Label>
                        <Input
                          id="owner-id"
                          placeholder="Aadhaar / Passport / License"
                          className="mt-2 border-[#E2E8F0]"
                          value={formData.governmentId}
                          onChange={(e) => updateField('governmentId', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="owner-phone">Contact Number *</Label>
                        <Input
                          id="owner-phone"
                          type="tel"
                          placeholder="+91 XXXXX XXXXX"
                          className="mt-2 border-[#E2E8F0]"
                          value={formData.contactNumber}
                          onChange={(e) => updateField('contactNumber', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="owner-email">Email Address *</Label>
                      <Input
                        id="owner-email"
                        type="email"
                        placeholder="owner@example.com"
                        className="mt-2 border-[#E2E8F0]"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="wallet-address">Wallet Address *</Label>
                      <Input
                        id="wallet-address"
                        placeholder="Connect MetaMask"
                        className="mt-2 border-[#E2E8F0] font-mono text-sm bg-[#F8FAFC]"
                        value={formData.walletAddress}
                        readOnly
                      />
                      <p className="text-xs text-[#64748B] mt-2">Filled from your connected MetaMask account. This becomes the on-chain owner.</p>
                    </div>

                    <div>
                      <Label htmlFor="owner-address">Residential Address *</Label>
                      <Textarea
                        id="owner-address"
                        placeholder="Enter complete residential address"
                        className="mt-2 border-[#E2E8F0]"
                        rows={3}
                        value={formData.residentialAddress}
                        onChange={(e) => updateField('residentialAddress', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Document Upload */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    {documents.map((doc, index) => (
                      <div key={index} className="border border-[#E2E8F0] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[#0F766E]" />
                            <div>
                              <p className="font-medium text-[#0F172A]">{doc.label}</p>
                              {doc.required && (
                                <span className="text-xs text-[#DC2626]">Required</span>
                              )}
                            </div>
                          </div>
                          {files[doc.name] && (
                            <span className="text-xs text-[#16A34A] font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              {files[doc.name].name}
                            </span>
                          )}
                        </div>
                        <label
                          htmlFor={`doc-input-${index}`}
                          className="border-2 border-dashed border-[#E2E8F0] rounded-lg p-6 text-center hover:border-[#0F766E] transition-colors cursor-pointer block"
                        >
                          <input
                            type="file"
                            id={`doc-input-${index}`}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(doc.name, e.target.files[0]);
                              }
                            }}
                          />
                          <Upload className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
                          <p className="text-sm text-[#0F172A] mb-1">
                            {files[doc.name] ? files[doc.name].name : `Upload ${doc.name.replaceAll('_', ' ')}`}
                          </p>
                          <p className="text-xs text-[#64748B]">PDF, JPEG, PNG (max 16MB)</p>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {/* Step 4: Review */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-6">
                      <h3 className="font-medium text-[#0F172A] mb-4">Property Information</h3>
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-[#64748B]">Survey Number:</dt>
                          <dd className="text-[#0F172A] font-medium">{formData.surveyNumber}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-[#64748B]">Location:</dt>
                          <dd className="text-[#0F172A] font-medium">{formData.location}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-[#64748B]">Area:</dt>
                          <dd className="text-[#0F172A] font-medium">{formData.area} sq ft</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-6">
                      <h3 className="font-medium text-[#0F172A] mb-4">Owner Information</h3>
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-[#64748B]">Name:</dt>
                          <dd className="text-[#0F172A] font-medium">{formData.ownerName}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-[#64748B]">Wallet:</dt>
                          <dd className="text-[#0F172A] font-mono text-xs">{formData.walletAddress}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-[#64748B]">Contact:</dt>
                          <dd className="text-[#0F172A] font-medium">{formData.contactNumber}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded-lg p-4 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-[#38BDF8] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-[#0F172A]">Blockchain Transaction</p>
                        <p className="text-xs text-[#64748B] mt-1">
                          Your application and documents will be reviewed first. Blockchain registration happens only after registrar approval.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-[#E2E8F0]">
                  {error && <p role="alert" className="w-full text-sm text-red-700">{error}</p>}
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="border-[#E2E8F0]"
                    >
                      Previous
                    </Button>
                  )}
                  {currentStep < 4 ? (
                    <Button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="bg-[#0F766E] hover:bg-[#0F766E]/90 sm:ml-auto"
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-[#0F766E] hover:bg-[#0F766E]/90 sm:ml-auto"
                    >
                      {submitting ? 'Submitting Application...' : 'Submit Registration'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Sidebar */}
          <div>
            <Card className="border-[#E2E8F0]">
              <CardHeader>
                <CardTitle className="text-[#0F172A]">Registration Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-[#0F172A] mb-2">Required Documents</h4>
                  <ul className="text-sm text-[#64748B] space-y-1">
                    <li>• Registration Document</li>
                    <li>• Mutation Certificate</li>
                    <li>• Owner ID Proof</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0]">
                  <h4 className="font-medium text-[#0F172A] mb-2">Processing Time</h4>
                  <p className="text-sm text-[#64748B]">Usually 24-48 hours for verification and blockchain confirmation</p>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0]">
                  <h4 className="font-medium text-[#0F172A] mb-2">Need Help?</h4>
                  <p className="text-sm text-[#64748B] mb-3">Contact our support team for assistance</p>
                  <Button variant="outline" className="w-full border-[#E2E8F0]">
                    Support Center
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
