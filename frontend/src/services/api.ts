import axios from 'axios';

export type Property = {
  id?: string;
  _id?: string;
  property_id?: string;
  survey_number?: string;
  owner_wallet?: string | null;
  village?: string;
  taluk?: string;
  district?: string;
  area?: number | string | null;
  land_type?: string;
  status?: string;
  coordinates?: unknown;
};

export type GISLookup = {
  geojson?: GeoJSON.GeoJsonObject;
  found?: boolean;
  status?: string;
  data_source?: string;
  disclaimer?: string;
};

const DEFAULT_API_URL = `${window.location.protocol}//${window.location.hostname}:5000`;
const BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_URL;

const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const api = {
  auth: {
    register: async (data: { name: string; email: string; password: string }) => {
      const response = await client.post('/auth/register', data);
      return response.data?.data;
    },
    login: async (email: string, password: string, role: 'user' | 'admin') => {
      const response = await client.post('/auth/login', { email, password, role });
      return response.data?.data;
    },
    me: async () => {
      const response = await client.get('/auth/me');
      return response.data?.data;
    },
    logout: async () => {
      const response = await client.post('/auth/logout');
      return response.data;
    },
    walletChallenge: async (wallet_address: string) => {
      const response = await client.post('/auth/wallet-challenge', { wallet_address });
      return response.data?.data as { message: string };
    },
    updateProfile: async (data: { name?: string; wallet_address?: string; signature?: string }) => {
      const response = await client.patch('/auth/profile', data);
      return response.data?.data;
    },
    listUsers: async () => {
      const response = await client.get('/auth/users');
      return response.data?.data || [];
    },
    setRole: async (userId: string, role: string) => {
      const response = await client.put(`/auth/users/${encodeURIComponent(userId)}/role`, { role });
      return response.data?.data;
    },
  },

  dashboard: {
    admin: async () => {
      const response = await client.get('/dashboard/admin');
      return response.data?.data;
    },
    user: async () => {
      const response = await client.get('/dashboard/user');
      return response.data?.data;
    },
  },

  notifications: {
    list: async () => {
      const response = await client.get('/notifications');
      return response.data?.data || [];
    },
    markRead: async (id: string) => {
      const response = await client.post(`/notifications/${encodeURIComponent(id)}/read`);
      return response.data?.data;
    },
    markAllRead: async () => {
      const response = await client.post('/notifications/read-all');
      return response.data?.data;
    },
  },

  valuation: {
    estimate: async (data: Record<string, unknown>) => {
      const response = await client.post('/valuation/estimate', data);
      return response.data?.data;
    },
    getParams: async () => {
      const response = await client.get('/valuation/params');
      return response.data?.data;
    },
    updateParams: async (data: Record<string, unknown>) => {
      const response = await client.put('/valuation/params', data);
      return response.data?.data;
    },
  },

  qr: {
    get: async (identifier: string) => {
      const response = await client.get(`/qr/property/${encodeURIComponent(identifier)}`);
      return response.data?.data;
    },
    generate: async (data: { survey_number?: string; property_id?: string }) => {
      const response = await client.post('/qr/generate', data);
      return response.data?.data;
    },
  },

  properties: {
    list: async (): Promise<Property[]> => {
      const response = await client.get('/properties');
      return (response.data?.data || []) as Property[];
    },
    getBySurvey: async (surveyNumber: string) => {
      const response = await client.get(`/properties/${encodeURIComponent(surveyNumber)}`);
      return response.data?.data;
    },
    create: async (data: Record<string, unknown>) => {
      const response = await client.post('/properties', data);
      return response.data?.data;
    },
  },

  applications: {
    list: async (status?: string, applicantWallet?: string, applicationType?: string) => {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      if (applicantWallet) params.applicant_wallet = applicantWallet;
      if (applicationType) params.application_type = applicationType;
      const response = await client.get('/applications', { params });
      return response.data?.data || [];
    },
    get: async (id: string) => {
      const response = await client.get(`/applications/${encodeURIComponent(id)}`);
      return response.data?.data;
    },
    create: async (data: Record<string, unknown>) => {
      const response = await client.post('/applications', data);
      return response.data?.data;
    },
    updateStatus: async (
      id: string,
      data: { status: string; rejection_reason?: string; verification_summary?: Record<string, unknown> },
    ) => {
      const response = await client.put(`/applications/${encodeURIComponent(id)}/status`, data);
      return response.data?.data;
    },
    approve: async (id: string) => {
      const response = await client.post(`/applications/${encodeURIComponent(id)}/approve`);
      return response.data?.data;
    },
    reject: async (id: string, rejection_reason: string) => {
      const response = await client.post(`/applications/${encodeURIComponent(id)}/reject`, { rejection_reason });
      return response.data?.data;
    },
    requestDocuments: async (id: string, remarks: string, required_documents?: string[]) => {
      const response = await client.post(`/applications/${encodeURIComponent(id)}/request-documents`, {
        remarks,
        required_documents,
      });
      return response.data?.data;
    },
  },

  documents: {
    upload: async (formDataOrAppId: FormData | string, maybeFile?: File, docType?: string) => {
      const data = formDataOrAppId instanceof FormData ? formDataOrAppId : new FormData();
      if (!(formDataOrAppId instanceof FormData)) {
        data.append('application_id', formDataOrAppId);
        if (maybeFile) data.append('file', maybeFile);
        if (docType) data.append('document_type', docType);
      }
      const response = await client.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data?.data;
    },
    getByApp: async (applicationId: string) => {
      const response = await client.get(`/documents/application/${encodeURIComponent(applicationId)}`);
      return response.data?.data || [];
    },
    getByProperty: async (propertyId: string) => {
      const response = await client.get(`/documents/property/${encodeURIComponent(propertyId)}`);
      return response.data?.data || [];
    },
    list: async () => {
      const response = await client.get('/documents');
      return response.data?.data || [];
    },
    delete: async (documentId: string) => {
      const response = await client.delete(`/documents/${encodeURIComponent(documentId)}`);
      return response.data;
    },
    getDownloadUrl: (documentId: string) =>
      `${BASE_URL}/documents/download/${encodeURIComponent(documentId)}`,
  },

  verification: {
    verify: async (documentId: string) => {
      const response = await client.post(`/verification/document/${encodeURIComponent(documentId)}`);
      return response.data?.data;
    },
    review: async (documentId: string, status: string, remarks?: string) => {
      const response = await client.post(
        `/verification/document/${encodeURIComponent(documentId)}/review`,
        { status, remarks },
      );
      return response.data?.data;
    },
  },

  ownership: {
    submitTransfer: async (data: Record<string, unknown>) => {
      const response = await client.post('/ownership/transfer', data);
      return response.data?.data;
    },
    transfer: async (data: Record<string, unknown>) => {
      const response = await client.post('/ownership/transfer', data);
      return response.data?.data;
    },
    getHistory: async (propertyId: string) => {
      const response = await client.get(`/ownership/history/${encodeURIComponent(propertyId)}`);
      return response.data?.data || [];
    },
  },

  gis: {
    getBySurvey: async (surveyNumber: string): Promise<GISLookup> => {
      const response = await client.get(`/gis/property/${encodeURIComponent(surveyNumber)}`);
      return response.data?.data as GISLookup;
    },
  },

  blockchain: {
    getProperty: async (id: string) => {
      const response = await client.get(`/blockchain/property/${encodeURIComponent(id)}`);
      return response.data?.data;
    },
    register: async (propertyId: string, walletAddress: string) => {
      const response = await client.post('/blockchain/register', {
        property_id: propertyId,
        wallet_address: walletAddress,
      });
      return response.data?.data;
    },
    transfer: async (propertyId: string, newOwner: string) => {
      const response = await client.post('/blockchain/transfer', {
        property_id: propertyId,
        new_owner: newOwner,
      });
      return response.data?.data;
    },
    getTransactions: async () => {
      const response = await client.get('/blockchain/transactions');
      return response.data?.data || [];
    },
  },

  publicVerify: {
    verifyProperty: async (identifier: string) => {
      const response = await client.get(`/verify/property/${encodeURIComponent(identifier)}`);
      return response.data?.data;
    },
  },
};
