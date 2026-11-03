import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  MapPin,
  ShieldCheck,
  Download,
  RefreshCw,
  XCircle,
  Check,
  Upload,
} from 'lucide-react';

import { Layout } from '../Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { api } from '../../../services/api';
import { useAuth } from '../../context/useAuth';

const STATUS_LABELS: Record<string, string> = {
  VERIFIED: 'Verified',
  REJECTED: 'Verification Failed',
  REQUIRES_MANUAL_REVIEW: 'Requires Manual Review',
  PENDING: 'Pending Verification',
};

export function ApplicationDetails() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { isAdmin } = useAuth();
  const [app, setApp] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const loadData = async () => {
    if (!applicationId) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const [appData, docsData] = await Promise.all([
        api.applications.get(applicationId),
        api.documents.getByApp(applicationId),
      ]);
      setApp(appData);
      setDocuments(docsData);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [applicationId]);

  const handleVerifyAllDocs = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      for (const doc of documents) {
        await api.verification.review(doc.document_id || doc._id, 'VERIFIED', 'Verified by authorized reviewer');
      }
      setSuccessMsg('All submitted documents verified successfully.');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Document verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await api.applications.approve(applicationId!);
      setApp(res);
      setSuccessMsg('Application approved and successfully anchored to the blockchain!');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.applications.reject(applicationId!, reason);
      setSuccessMsg('Application marked as REJECTED.');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestDocs = async () => {
    const remarks = prompt('What additional documents or corrections are required?');
    if (!remarks) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.applications.requestDocuments(applicationId!, remarks);
      setSuccessMsg('Additional documents requested from applicant.');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Request failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadDoc = async (docType: string, file: File | null) => {
    if (!file || !applicationId) return;
    setUploadingType(docType);
    setErrorMsg(null);
    try {
      await api.documents.upload(applicationId, file, docType);
      setSuccessMsg(`${docType.replaceAll('_', ' ')} uploaded.`);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploadingType(null);
    }
  };

  const handleReviewDoc = async (docId: string, status: string) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.verification.review(docId, status, `Marked ${status} by Admin`);
      setSuccessMsg(`Document ${status}`);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Review failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4 lg:p-8 py-24 text-center text-sm text-[#64748B]">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#0F766E]" />
          <p className="mt-4">Loading application record...</p>
        </div>
      </Layout>
    );
  }

  if (!app) {
    return (
      <Layout>
        <div className="p-4 lg:p-8 py-12 text-center">
          <p className="text-red-600">Application not found.</p>
          <Link to="/applications" className="mt-4 inline-block">
            <Button variant="outline">Back to Applications</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const isCompleted = app.status === 'COMPLETED';
  const isApproved = app.status === 'APPROVED';
  const isVerified = app.status === 'VERIFIED';
  const allDocsVerified = documents.length > 0 && documents.every((d) => d.verification_status === 'VERIFIED');

  return (
    <Layout>
      <div className="p-4 lg:p-8 space-y-8">
        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <Link to="/applications" className="flex items-center text-sm text-[#64748B] hover:text-[#0F172A]">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Applications
          </Link>
          <Button variant="outline" size="sm" onClick={loadData} className="border-[#CBD5E1]">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
            {successMsg}
          </div>
        )}

        {/* Header Summary */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold text-[#0F172A]">{app.application_type?.replace(/_/g, ' ')}</h1>
              <Badge className="border-0 bg-[#ECFDF5] text-[#0F766E] text-xs font-semibold">
                {app.status}
              </Badge>
            </div>
            <p className="text-sm text-[#64748B]">
              Application ID: <span className="font-mono text-[#0F766E]">{app._id || applicationId}</span> • Survey: <strong>{app.survey_number}</strong>
            </p>
          </div>

          {/* Action buttons for Authorized Officer (admin only) */}
          <div className="flex flex-wrap gap-2">
            {isAdmin && !isCompleted && app.status !== 'REJECTED' && (
              <>
                {!allDocsVerified && (
                  <Button
                    onClick={handleVerifyAllDocs}
                    disabled={actionLoading || documents.length === 0}
                    variant="outline"
                    className="border-[#0F766E] text-[#0F766E] hover:bg-[#CCFBF1]"
                  >
                    <Check className="mr-1.5 h-4 w-4" />
                    Verify Documents
                  </Button>
                )}

                <Button
                  onClick={handleApprove}
                  disabled={actionLoading || (!isVerified && !allDocsVerified)}
                  className="bg-[#0F766E] hover:bg-[#115E59]"
                >
                  <ShieldCheck className="mr-1.5 h-4 w-4" />
                  {actionLoading ? 'Processing On-Chain...' : 'Approve & Execute On-Chain'}
                </Button>

                <Button
                  onClick={handleRequestDocs}
                  disabled={actionLoading}
                  variant="outline"
                  className="border-[#E2E8F0]"
                >
                  <FileText className="mr-1.5 h-4 w-4" />
                  Request Documents
                </Button>

                <Button
                  onClick={handleReject}
                  disabled={actionLoading}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="mr-1.5 h-4 w-4" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Blockchain Confirmation Banner */}
        {isCompleted && (
          <Card className="border-[#86EFAC] bg-[#F0FDF4]">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-emerald-900">Blockchain Ownership Confirmed</h4>
                  <p className="text-xs text-emerald-700">
                    This application has completed authorized off-chain verification and been permanently recorded onto the GeoLedger smart contract.
                  </p>
                  <div className="mt-2 space-y-1 font-mono text-[11px] text-emerald-800">
                    <p>Tx Hash: <strong>{app.blockchain_transaction_hash}</strong></p>
                    <p>Block Number: <strong>{app.blockchain_block_number || 'Confirmed'}</strong></p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grid: Application Info & Documents */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: Details */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="border-[#E2E8F0]">
              <CardHeader>
                <CardTitle className="text-base text-[#0F172A]">Application Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-[#F1F5F9] pb-2">
                  <span className="text-[#64748B]">Survey Number</span>
                  <span className="font-medium text-[#0F172A]">{app.survey_number}</span>
                </div>
                <div className="flex justify-between border-b border-[#F1F5F9] py-2">
                  <span className="text-[#64748B]">Property ID</span>
                  <span className="font-medium text-[#0F172A]">{app.property_id || app.survey_number}</span>
                </div>
                <div className="flex justify-between border-b border-[#F1F5F9] py-2">
                  <span className="text-[#64748B]">Applicant Wallet</span>
                  <span className="font-mono text-[#0F766E] truncate max-w-[140px]">{app.applicant_wallet}</span>
                </div>
                <div className="flex justify-between border-b border-[#F1F5F9] py-2">
                  <span className="text-[#64748B]">Government Ref</span>
                  <span className="font-mono text-[#0F172A]">{app.government_reference || 'GOV-VERIF'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#64748B]">Date Created</span>
                  <span className="text-[#0F172A]">{new Date(app.created_at).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Action to view GIS */}
            <Card className="border-[#E2E8F0] p-4 text-center">
              <Link to={`/search?survey=${encodeURIComponent(app.survey_number)}`}>
                <Button variant="outline" className="w-full text-xs">
                  <MapPin className="mr-1.5 h-3.5 w-3.5 text-[#0F766E]" />
                  View Parcel on GIS Map
                </Button>
              </Link>
            </Card>
          </div>

          {/* Right Column: Submitted Documents & Verification */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="border-[#E2E8F0]">
              <CardHeader>
                <CardTitle className="text-base text-[#0F172A]">Submitted Legal Documents</CardTitle>
                <CardDescription>
                  SHA-256 integrity hash, extraction results, and admin review actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Missing required docs upload */}
                {(app.required_documents || []).length > 0 && (
                  <div className="space-y-2 rounded-lg border border-dashed border-[#CBD5E1] p-4">
                    <p className="text-sm font-medium text-[#0F172A]">Document checklist / upload</p>
                    {(app.required_documents || []).map((docType: string) => {
                      const existing = documents.find((d) => d.document_type === docType);
                      return (
                        <div key={docType} className="flex items-center justify-between gap-2 text-sm">
                          <div>
                            <p className="font-medium">{docType.replaceAll('_', ' ')}</p>
                            <p className="text-xs text-[#64748B]">
                              {existing
                                ? STATUS_LABELS[existing.verification_status] || existing.verification_status
                                : 'Missing — upload required'}
                            </p>
                          </div>
                          {(!existing ||
                            ['REJECTED', 'REQUIRES_MANUAL_REVIEW'].includes(existing.verification_status) ||
                            app.status === 'DOCUMENTS_PENDING' ||
                            app.correction_requested) && (
                            <label className="inline-flex items-center gap-1 text-[#0F766E] cursor-pointer text-xs">
                              <Upload className="w-3.5 h-3.5" />
                              {uploadingType === docType ? 'Uploading…' : existing ? 'Replace' : 'Upload'}
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg,.txt"
                                disabled={!!uploadingType}
                                onChange={(e) => handleUploadDoc(docType, e.target.files?.[0] || null)}
                              />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {documents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#64748B]">
                    No documents uploaded yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => {
                      const isDocVerified = doc.verification_status === 'VERIFIED';
                      const docId = doc.document_id || doc._id;
                      return (
                        <div
                          key={docId}
                          className="flex flex-col gap-3 rounded-lg border border-[#E2E8F0] p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <FileText className="h-4 w-4 text-[#0F766E]" />
                                <p className="font-semibold text-sm text-[#0F172A]">
                                  {doc.document_type?.replace(/_/g, ' ')}
                                </p>
                                <Badge
                                  className={`text-[10px] border-0 ${
                                    isDocVerified ? 'bg-[#ECFDF5] text-[#0F766E]' : 'bg-[#FEF3C7] text-[#B45309]'
                                  }`}
                                >
                                  {STATUS_LABELS[doc.verification_status] || doc.verification_status}
                                </Badge>
                              </div>
                              <p className="text-xs text-[#64748B]">
                                File: {doc.filename} • Size: {Math.round((doc.file_size || 1024) / 1024)} KB
                              </p>
                              <p className="font-mono text-[10px] text-[#475569] break-all">
                                SHA-256: <span className="text-[#0F766E]">{doc.document_hash}</span>
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <a
                                href={api.documents.getDownloadUrl(docId)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Button variant="outline" size="sm" className="h-8 text-xs">
                                  <Download className="mr-1 h-3.5 w-3.5" />
                                  Download
                                </Button>
                              </a>
                              {isAdmin && !isDocVerified && (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs bg-[#0F766E] hover:bg-[#0F766E]/90"
                                    disabled={actionLoading}
                                    onClick={() => handleReviewDoc(docId, 'VERIFIED')}
                                  >
                                    Verify
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs text-red-600"
                                    disabled={actionLoading}
                                    onClick={() => handleReviewDoc(docId, 'REJECTED')}
                                  >
                                    Reject Doc
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          {doc.extracted_fields && Object.keys(doc.extracted_fields).length > 0 && (
                            <div className="bg-[#F8FAFC] rounded p-2 text-[11px] grid sm:grid-cols-2 gap-1">
                              {Object.entries(doc.extracted_fields).map(([k, v]) => (
                                <p key={k}><span className="text-[#64748B]">{k}:</span> {String(v)}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
