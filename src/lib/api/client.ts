/* @module: api/client — Centralized Typed API Client for LifeDrop Platform */

export function resolveApiBaseUrl(): string {
  const env = (import.meta as any).env || {};
  const rawUrl: string | undefined = env.VITE_API_BASE_URL || env.VITE_API_URL;

  if (env.PROD) {
    if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === '') {
      const err =
        '[LifeDrop Config Error] Missing VITE_API_BASE_URL environment variable in production! ' +
        'Please configure VITE_API_BASE_URL in your Vercel Project Settings (e.g. https://lifedrop-api.onrender.com/api/v1).';
      console.error(err);
      return '';
    }
  }

  const url = rawUrl && rawUrl.trim() !== '' ? rawUrl.trim() : 'http://localhost:5001/api/v1';
  const cleanUrl = url.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;
}

const API_BASE_URL = resolveApiBaseUrl();

// Token storage keys
const ACCESS_TOKEN_KEY = 'lifedrop_access_token';
const REFRESH_TOKEN_KEY = 'lifedrop_refresh_token';

// Normalize Blood Group between Prisma and UI
export function normalizeBloodGroup(group: string): string {
  const map: Record<string, string> = {
    O_POS: 'O+',
    O_NEG: 'O-',
    A_POS: 'A+',
    A_NEG: 'A-',
    B_POS: 'B+',
    B_NEG: 'B-',
    AB_POS: 'AB+',
    AB_NEG: 'AB-',
  };
  return map[group] || group;
}

export function toPrismaBloodGroup(group: string): string {
  const map: Record<string, string> = {
    'O+': 'O_POS',
    'O-': 'O_NEG',
    'A+': 'A_POS',
    'A-': 'A_NEG',
    'B+': 'B_POS',
    'B-': 'B_NEG',
    'AB+': 'AB_POS',
    'AB-': 'AB_NEG',
  };
  return map[group] || group;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
      this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    }
  }

  setTokens(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        this.refreshToken = refreshToken;
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  getAccessToken() {
    return this.accessToken;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<T> {
    if (!API_BASE_URL) {
      const configError =
        'Configuration Error: VITE_API_BASE_URL is not configured. ' +
        'Please set VITE_API_BASE_URL in your hosting environment settings (e.g. Vercel) to point to your Render backend API.';
      console.error(`[LifeDrop API Client] ${configError}`);
      throw new Error(configError);
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized with token refresh
      if (response.status === 401 && !isRetry && this.refreshToken && !endpoint.includes('/auth/refresh')) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          return this.request<T>(endpoint, options, true);
        }
      }

      const json = await response.json();

      if (!response.ok) {
        const errorDetails =
          Array.isArray(json.errors) && json.errors.length > 0
            ? json.errors
                .map((e: any) => `${e.field ? `${e.field}: ` : ''}${e.message}`)
                .join(', ')
            : null;
        throw new Error(errorDetails || json.message || `API error ${response.status}`);
      }

      return json.data !== undefined ? json.data : json;
    } catch (err: any) {
      throw err;
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (this.isRefreshing || !this.refreshToken || !API_BASE_URL) return false;
    this.isRefreshing = true;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!res.ok) {
        this.clearTokens();
        return false;
      }

      const json = await res.json();
      const { accessToken, refreshToken } = json.data || json;
      this.setTokens(accessToken, refreshToken);
      return true;
    } catch {
      this.clearTokens();
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  // --- API Modules ---

  auth = {
    register: (data: any) =>
      this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (identifier: string, password?: string, role?: string) =>
      this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password, role }),
      }),
    requestOtp: (phone: string, purpose?: string) =>
      this.request('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ phone, purpose }),
      }),
    verifyOtp: (phone: string, code: string) =>
      this.request('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      }),
    getMe: () => this.request('/auth/me'),
    logout: () => {
      const token = this.refreshToken;
      this.clearTokens();
      return this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: token }),
      });
    },
    verifyAdminPasskey: (passkey: string) =>
      this.request('/auth/admin-passkey', {
        method: 'POST',
        body: JSON.stringify({ passkey }),
      }),
  };

  users = {
    getMe: () => this.request('/users/me'),
    updateMe: (data: any) =>
      this.request('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  };

  donors = {
    list: (params?: { bloodGroup?: string; city?: string; isEligible?: boolean }) => {
      const qs = new URLSearchParams(params as any).toString();
      return this.request(`/donors${qs ? `?${qs}` : ''}`);
    },
    getById: (id: string) => this.request(`/donors/${id}`),
    updateAvailability: (data: any) =>
      this.request('/donors/me/availability', { method: 'PATCH', body: JSON.stringify(data) }),
    updateConsent: (data: any) =>
      this.request('/donors/me/consent', { method: 'PATCH', body: JSON.stringify(data) }),
    getHistory: () => this.request('/donors/me/donation-history'),
  };

  hospitals = {
    list: (params?: { city?: string; verifiedOnly?: boolean }) => {
      const qs = new URLSearchParams(params as any).toString();
      return this.request(`/hospitals${qs ? `?${qs}` : ''}`);
    },
    getById: (id: string) => this.request(`/hospitals/${id}`),
    getMe: () => this.request('/hospitals/me'),
    updateMe: (data: any) =>
      this.request('/hospitals/me', { method: 'PATCH', body: JSON.stringify(data) }),
  };

  bloodBanks = {
    list: (params?: { city?: string; verifiedOnly?: boolean }) => {
      const qs = new URLSearchParams(params as any).toString();
      return this.request(`/blood-banks${qs ? `?${qs}` : ''}`);
    },
    getById: (id: string) => this.request(`/blood-banks/${id}`),
    getMe: () => this.request('/blood-banks/me'),
    updateMe: (data: any) =>
      this.request('/blood-banks/me', { method: 'PATCH', body: JSON.stringify(data) }),
    getInventory: (id: string) => this.request(`/blood-banks/${id}/inventory`),
  };

  inventory = {
    getMyInventory: () => this.request('/inventory'),
    addStock: (data: any) =>
      this.request('/inventory/stock', { method: 'POST', body: JSON.stringify(data) }),
    adjustStock: (data: any) =>
      this.request('/inventory/adjustments', { method: 'POST', body: JSON.stringify(data) }),
    getTransactions: (limit = 50) => this.request(`/inventory/transactions?limit=${limit}`),
    getExpiring: (days = 30) => this.request(`/inventory/expiring?days=${days}`),
  };

  requests = {
    list: (params?: any) => {
      const qs = new URLSearchParams(params).toString();
      return this.request(`/blood-requests${qs ? `?${qs}` : ''}`);
    },
    getById: (id: string) => this.request(`/blood-requests/${id}`),
    create: (data: any) =>
      this.request('/blood-requests', { method: 'POST', body: JSON.stringify(data) }),
    donorRespond: (requestId: string, response: 'ACCEPT' | 'DECLINE', reason?: string) =>
      this.request(`/blood-requests/${requestId}/responses`, {
        method: 'POST',
        body: JSON.stringify({ response, reason }),
      }),
    donorCancelCommitment: (requestId: string, reason?: string) =>
      this.request(`/blood-requests/${requestId}/cancel-commitment`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    bloodBankReserve: (requestId: string, units: number) =>
      this.request(`/blood-requests/${requestId}/reservations`, {
        method: 'POST',
        body: JSON.stringify({ units }),
      }),
    directRequisition: (requestId: string, bloodBankId: string, units?: number) =>
      this.request(`/blood-requests/${requestId}/direct-requisition`, {
        method: 'POST',
        body: JSON.stringify({ bloodBankId, units }),
      }),
    bloodBankConfirmSupply: (requestId: string) =>
      this.request(`/blood-requests/${requestId}/confirm-supply`, {
        method: 'POST',
      }),
    cancel: (requestId: string, reason?: string) =>
      this.request(`/blood-requests/${requestId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    fulfill: (requestId: string) =>
      this.request(`/blood-requests/${requestId}/fulfill`, { method: 'POST' }),
    delete: (requestId: string) =>
      this.request(`/blood-requests/${requestId}`, { method: 'DELETE' }),
  };

  donations = {
    confirm: (data: any) =>
      this.request('/donations/confirm', { method: 'POST', body: JSON.stringify(data) }),
    markNoShow: (requestId: string, donorId: string) =>
      this.request('/donations/mark-no-show', {
        method: 'POST',
        body: JSON.stringify({ requestId, donorId }),
      }),
    markNotCompleted: (requestId: string, donorId: string, reason: string) =>
      this.request('/donations/mark-not-completed', {
        method: 'POST',
        body: JSON.stringify({ requestId, donorId, reason }),
      }),
    getMyDonations: () => this.request('/donations/me'),
  };

  campaigns = {
    list: (city?: string) =>
      this.request(`/campaigns${city ? `?city=${encodeURIComponent(city)}` : ''}`),
    getById: (id: string) => this.request(`/campaigns/${id}`),
    create: (data: any) =>
      this.request('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
    register: (id: string) =>
      this.request(`/campaigns/${id}/register`, { method: 'POST' }),
    deregister: (id: string) =>
      this.request(`/campaigns/${id}/register`, { method: 'DELETE' }),
    getRegistrations: (id: string) => this.request(`/campaigns/${id}/registrations`),
  };

  appointments = {
    book: (data: { bloodBankId: string; date: string; timeSlot: string }) =>
      this.request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    getMy: () => this.request('/appointments/me'),
    getFacility: () => this.request('/appointments/facility'),
    getById: (id: string) => this.request(`/appointments/${id}`),
    reschedule: (id: string, data: { date: string; timeSlot: string }) =>
      this.request(`/appointments/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify(data) }),
    cancel: (id: string, reason?: string) =>
      this.request(`/appointments/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
    updateStatus: (id: string, status: string) =>
      this.request(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  };

  notifications = {
    list: () => this.request('/notifications'),
    markRead: (id: string) => this.request(`/notifications/${id}/read`, { method: 'PATCH' }),
    readAll: () => this.request('/notifications/read-all', { method: 'POST' }),
  };

  feedback = {
    submit: (data: any) =>
      this.request('/feedback', { method: 'POST', body: JSON.stringify(data) }),
    list: () => this.request('/feedback'),
  };

  reports = {
    fileReport: (data: any) =>
      this.request('/reports', { method: 'POST', body: JSON.stringify(data) }),
  };

  admin = {
    getDashboard: () => this.request('/admin/dashboard'),
    listUsers: (role?: string) =>
      this.request(`/admin/users${role ? `?role=${role}` : ''}`),
    updateUserStatus: (id: string, status: string, reason?: string) =>
      this.request(`/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      }),
    listHospitals: () => this.request('/admin/hospitals'),
    updateHospitalVerification: (id: string, status: string, reason?: string) =>
      this.request(`/admin/hospitals/${id}/verification`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      }),
    listBloodBanks: () => this.request('/admin/blood-banks'),
    updateBloodBankVerification: (id: string, status: string, reason?: string) =>
      this.request(`/admin/blood-banks/${id}/verification`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      }),
    listReports: () => this.request('/admin/reports'),
    resolveReport: (id: string, status: string, actionTaken?: string) =>
      this.request(`/admin/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, actionTaken }),
      }),
    listAuditLogs: (limit = 100) => this.request(`/admin/audit-logs?limit=${limit}`),
    replyFeedback: (id: string, message: string, status?: string) =>
      this.request(`/admin/feedback/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message, status }),
      }),
  };

  facilityApplications = {
    submit: (data: any) =>
      this.request('/facility-applications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    checkStatus: (referenceNumber: string, email?: string) =>
      this.request(
        `/facility-applications/status/${encodeURIComponent(referenceNumber)}${
          email ? `?email=${encodeURIComponent(email)}` : ''
        }`
      ),
    checkStatusWithCredentials: (data: { identifier: string; password?: string }) =>
      this.request('/facility-applications/check-status', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    submitAdditionalInfo: (referenceNumber: string, data: { responseNotes: string; additionalDocs?: any[] }) =>
      this.request(
        `/facility-applications/status/${encodeURIComponent(referenceNumber)}/additional-info`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),
    list: (params?: { status?: string; facilityType?: string; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.facilityType) q.set('facilityType', params.facilityType);
      if (params?.search) q.set('search', params.search);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      const str = q.toString();
      return this.request(`/facility-applications${str ? `?${str}` : ''}`);
    },
    getById: (id: string) => this.request(`/facility-applications/${id}`),
    markUnderReview: (id: string, notes?: string) =>
      this.request(`/facility-applications/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    requestInfo: (id: string, query: string) =>
      this.request(`/facility-applications/${id}/request-info`, {
        method: 'POST',
        body: JSON.stringify({ query }),
      }),
    reject: (id: string, reason: string) =>
      this.request(`/facility-applications/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    approve: (id: string, notes?: string) =>
      this.request(`/facility-applications/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    verifyToken: (token: string) =>
      this.request(`/facility-applications/activation/${encodeURIComponent(token)}`),
    completeActivation: (token: string, password: string) =>
      this.request(`/facility-applications/activation/${encodeURIComponent(token)}`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
    suspend: (id: string, reason: string) =>
      this.request(`/facility-applications/${id}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  };
}

export const api = new ApiClient();
export default api;
