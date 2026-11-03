import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common.Authorization;
  }
}

client.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export const api = {
  auth: {
    register: async (walletAddress: string) => {
      try {
        const res = await client.post('/auth/register', { wallet_address: walletAddress });
        return res.data?.data;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 409) return null;
        console.warn('Wallet registration skipped', err);
        return null;
      }
    },
    registerAccount: async (data: {
      email: string;
      password: string;
      full_name?: string;
      phone?: string;
      wallet_address?: string;
    }) => {
      const res = await client.post('/auth/register', data);
      return res.data?.data;
    },
    login: async (email: string, password: string) => {
      const res = await client.post('/auth/login', { email, password });
      return res.data?.data;
    },
    adminLogin: async (email: string, password: string) => {
      const res = await client.post('/auth/admin/login', { email, password });
      return res.data?.data;
    },
    me: async () => {
      const res = await client.get('/auth/me');
      return res.data?.data;
    },
    updateProfile: async (data: Record<string, unknown>) => {
      const res = await client.put('/auth/profile', data);
      return res.data?.data;
    },
    logout: async () => {
      const res = await client.post('/auth/logout');
      return res.data;
    },
    listUsers: async () => {
      const res = await client.get('/auth/users');
      return res.data?.data || [];
    },
    setRole: async (userId: string, role: string) => {
      const res = await client.put(`/auth/users/${userId}/role`, { role });
      return res.data?.data;
    },
  },

  dashboard: {
    admin: async () => {
      const res = await client.get('/dashboard/admin');
      return res.data?.data;
    },
    user: async () => {
      const res = await client.get('/dashboard/user');
      return res.data?.data;
    },
  },

  notifications: {
    list: async () => {
      const res = await client.get('/notifications');
      return res.data?.data || [];
    },
    markRead: async (id: string) => {
      const res = await client.post(`/notifications/${id}/read`);
      return res.data?.data;
    },
    markAllRead: async () => {
      const res = await client.post('/notifications/read-all');
      return res.data?.data;
    },
  },

  valuation: {
    estimate: async (data: Record<string, unknown>) => {
      const res = await client.post('/valuation/estimate', data);
      return res.data?.data;
    },
    getParams: async () => {
      const res = await client.get('/valuation/params');
      return res.data?.data;
    },
    updateParams: async (data: Record<string, unknown>) => {
      const res = await client.put('/valuation/params', data);
      return res.data?.data;
    },
  },

  qr: {
    get: async (identifier: string) => {
      const res = await client.get(`/qr/property/${identifier}`);
      return res.data?.data;
    },
    generate: async (data: { survey_number?: string; property_id?: string }) => {
      const res = await client.post('/qr/generate', data);
      return res.data?.data;
    },
  },

  properties: {
    list: async () => {
      const res = await client.get('/properties');
      return res.data?.data || [];
    },
    getBySurvey: async (surveyNumber: string) => {
      const res = await client.get(`/properties/${surveyNumber}`);
      return res.data?.data;
    },
    create: async (data: any) => {
      const res = await client.post('/properties', data);
      return res.data?.data;
    },
  },

  applications: {
    list: async (status?: string, applicantWallet?: string, applicationType?: string) => {
      const params: any = {};
      if (status) params.status = status;
      if (applicantWallet) params.applicant_wallet = applicantWallet;
      if (applicationType) params.application_type = applicationType;
      const res = await client.get('/applications', { params });
      return res.data?.data || [];
    },
    get: async (id: string) => {
      const res = await client.get(`/applications/${id}`);
      return res.data?.data;
    },
    create: async (data: any) => {
      const res = await client.post('/applications', data);
      return res.data?.data;
    },
    updateStatus: async (id: string, data: { status: string; rejection_reason?: string; verification_summary?: any }) => {
      const res = await client.put(`/applications/${id}/status`, data);
      return res.data?.data;
    },
    approve: async (id: string) => {
      const res = await client.post(`/applications/${id}/approve`);
      return res.data?.data;
    },
    reject: async (id: string, rejection_reason: string) => {
      const res = await client.post(`/applications/${id}/reject`, { rejection_reason });
      return res.data?.data;
    },
    requestDocuments: async (id: string, remarks: string, required_documents?: string[]) => {
      const res = await client.post(`/applications/${id}/request-documents`, {
        remarks,
        required_documents,
      });
      return res.data?.data;
    },
  },

  documents: {
    upload: async (formDataOrAppId: FormData | string, maybeFile?: File, docType?: string) => {
      let data: FormData;
      if (formDataOrAppId instanceof FormData) {
        data = formDataOrAppId;
      } else {
        data = new FormData();
        data.append('application_id', formDataOrAppId);
        if (maybeFile) data.append('file', maybeFile);
        if (docType) data.append('document_type', docType);
      }
      const res = await client.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data?.data;
    },
    getByApp: async (applicationId: string) => {
      const res = await client.get(`/documents/application/${applicationId}`);
      return res.data?.data || [];
    },
    getByProperty: async (propertyId: string) => {
      const res = await client.get(`/documents/property/${propertyId}`);
      return res.data?.data || [];
    },
    delete: async (documentId: string) => {
      const res = await client.delete(`/documents/${documentId}`);
      return res.data;
    },
    getDownloadUrl: (documentId: string) => {
      return `${BASE_URL}/documents/download/${documentId}`;
    },
  },

  verification: {
    verify: async (documentId: string) => {
      const res = await client.post(`/verification/document/${documentId}`);
      return res.data?.data;
    },
    review: async (documentId: string, status: string, remarks?: string) => {
      const res = await client.post(`/verification/document/${documentId}/review`, { status, remarks });
      return res.data?.data;
    },
  },

  ownership: {
    submitTransfer: async (data: any) => {
      const res = await client.post('/ownership/transfer', data);
      return res.data?.data;
    },
    transfer: async (data: any) => {
      const res = await client.post('/ownership/transfer', data);
      return res.data?.data;
    },
    getHistory: async (propertyId: string) => {
      const res = await client.get(`/ownership/history/${propertyId}`);
      return res.data?.data || [];
    },
  },

  gis: {
    getBySurvey: async (surveyNumber: string) => {
      const res = await client.get(`/gis/property/${surveyNumber}`);
      return res.data?.data;
    },
  },

  blockchain: {
    getProperty: async (id: string) => {
      const res = await client.get(`/blockchain/property/${id}`);
      return res.data?.data;
    },
    register: async (propertyId: string, walletAddress: string) => {
      const res = await client.post('/blockchain/register', { property_id: propertyId, wallet_address: walletAddress });
      return res.data?.data;
    },
    transfer: async (propertyId: string, newOwner: string) => {
      const res = await client.post('/blockchain/transfer', { property_id: propertyId, new_owner: newOwner });
      return res.data?.data;
    },
    getTransactions: async () => {
      const res = await client.get('/blockchain/transactions');
      return res.data?.data || [];
    },
  },

  publicVerify: {
    verifyProperty: async (identifier: string) => {
      const res = await client.get(`/verify/property/${identifier}`);
      return res.data?.data;
    },
  },
};
