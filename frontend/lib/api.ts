import { 
  ScreeningDetail, 
  AnalyticsData, 
  DomainInfo, 
  DocumentTypeInfo, 
  PersonRecord, 
  NotificationItem, 
  UserProfile 
} from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export const api = {
  async getDomains(): Promise<DomainInfo[]> {
    const res = await fetch(`${API_BASE}/domains`);
    if (!res.ok) throw new Error('Failed to fetch domains');
    return res.json();
  },

  async getDocumentTypes(): Promise<DocumentTypeInfo[]> {
    const res = await fetch(`${API_BASE}/documents/types`);
    if (!res.ok) throw new Error('Failed to fetch document types');
    return res.json();
  },

  // ================= PERSON & SUBJECT METHODS =================
  async createOrGetPerson(referenceId: string, domain: string, metadataInfo?: Record<string, any>, userId?: string): Promise<PersonRecord> {
    const res = await fetch(`${API_BASE}/persons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference_id: referenceId,
        domain,
        metadata_info: metadataInfo || {},
        user_id: userId
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create or find person' }));
      throw new Error(err.detail || 'Failed to create or find person');
    }
    return res.json();
  },

  async checkPersonReference(referenceId: string, domain?: string): Promise<{ exists: boolean; person_id?: string; reference_id: string; domain?: string; status?: string; screening_count?: number; metadata_info?: Record<string, any> }> {
    const url = domain 
      ? `${API_BASE}/persons/check?reference_id=${encodeURIComponent(referenceId)}&domain=${encodeURIComponent(domain)}`
      : `${API_BASE}/persons/check?reference_id=${encodeURIComponent(referenceId)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to check reference ID');
    return res.json();
  },

  async getPerson(personId: string): Promise<PersonRecord> {
    const res = await fetch(`${API_BASE}/persons/${personId}`);
    if (!res.ok) throw new Error('Failed to fetch person record');
    return res.json();
  },

  async getPersonScreenings(personId: string): Promise<ScreeningDetail[]> {
    const res = await fetch(`${API_BASE}/persons/${personId}/screenings`);
    if (!res.ok) throw new Error('Failed to fetch person screenings');
    return res.json();
  },

  // ================= SCREENING METHODS =================
  async createScreening(
    domain: string,
    documentType: string,
    isDemo = false,
    personName = "Screening Subject",
    travelReference?: Record<string, any>
  ): Promise<{ id: string }> {
    const res = await fetch(`${API_BASE}/screenings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain,
        document_type: documentType,
        is_demo: isDemo,
        person_name: personName,
        travel_reference: travelReference
      })
    });
    if (!res.ok) throw new Error('Failed to create screening session');
    return res.json();
  },

  async uploadDocument(screeningId: string, file: File | Blob, docRole = 'primary_document', filename = 'document.jpg'): Promise<any> {
    const formData = new FormData();
    formData.append('file', file, filename);
    formData.append('doc_role', docRole);

    const res = await fetch(`${API_BASE}/screenings/${screeningId}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async startAnalysis(screeningId: string, isTamperedSimulation = false): Promise<any> {
    const res = await fetch(`${API_BASE}/screenings/${screeningId}/analyze?is_tampered_simulation=${isTamperedSimulation}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to trigger AI analysis');
    return res.json();
  },

  async getScreeningStatus(screeningId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/screenings/${screeningId}/status`);
    if (!res.ok) throw new Error('Failed to poll status');
    return res.json();
  },

  async getScreeningDetail(screeningId: string): Promise<ScreeningDetail> {
    const res = await fetch(`${API_BASE}/screenings/${screeningId}`);
    if (!res.ok) throw new Error('Failed to fetch screening details');
    return res.json();
  },

  async listScreenings(filters?: { domain?: string; document_type?: string; risk_level?: string; search?: string; limit?: number }): Promise<ScreeningDetail[]> {
    const params = new URLSearchParams();
    if (filters?.domain) params.append('domain', filters.domain);
    if (filters?.document_type) params.append('document_type', filters.document_type);
    if (filters?.risk_level) params.append('risk_level', filters.risk_level);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const res = await fetch(`${API_BASE}/screenings?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to list screenings');
    return res.json();
  },

  async getScreening(screeningId: string): Promise<ScreeningDetail> {
    return this.getScreeningDetail(screeningId);
  },

  async downloadReport(screeningId: string): Promise<void> {
    const url = `${API_BASE}/screenings/${screeningId}/report`;
    window.open(url, '_blank');
  },

  getReportPdfUrl(screeningId: string): string {
    return `${API_BASE}/screenings/${screeningId}/report`;
  },

  // ================= NOTIFICATIONS METHODS =================
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch(`${API_BASE}/notifications`);
    if (!res.ok) return [];
    return res.json();
  },

  async getUnreadNotificationsCount(): Promise<number> {
    const res = await fetch(`${API_BASE}/notifications/unread-count`);
    if (!res.ok) return 0;
    const data = await res.json();
    return data.unread_count || 0;
  },

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'POST' });
  },

  async markAllNotificationsRead(): Promise<void> {
    await fetch(`${API_BASE}/notifications/mark-all-read`, { method: 'POST' });
  },

  // ================= PROFILE & SETTINGS METHODS =================
  async getMyProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/me`);
    if (!res.ok) {
      return {
        id: 'officer-1',
        email: 'officer@docshield.ai',
        full_name: 'Security Officer',
        role: 'analyst',
        domain: 'airport_security',
        organization: 'DocShield Security Command',
        created_at: new Date().toISOString(),
        screenings_completed: 0,
        status: 'Active & Authorized'
      };
    }
    return res.json();
  },

  async updateProfile(data: Partial<UserProfile>): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  async getSystemSettings(): Promise<{ preferences: Record<string, any> }> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) return { preferences: {} };
    return res.json();
  },

  async updateSystemSettings(preferences: Record<string, any>): Promise<any> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences })
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // ================= ANALYTICS & DIAGNOSTICS =================
  async getAnalytics(domain?: string): Promise<AnalyticsData> {
    const url = domain ? `${API_BASE}/analytics?domain=${domain}` : `${API_BASE}/analytics`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async getModelsStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/models/status`);
    if (!res.ok) throw new Error('Failed to fetch models status');
    return res.json();
  },

  async verifyFacesDirect(docFile: File, liveFile: File): Promise<any> {
    const formData = new FormData();
    formData.append('document_photo', docFile);
    formData.append('live_selfie', liveFile);

    const res = await fetch(`${API_BASE}/face-verification`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Direct face verification failed');
    return res.json();
  },

  // ================= NAMESPACE ALIASES FOR COMPONENT CONVENIENCE =================
  screenings: {
    create: async (data: { domain: string; document_type: string; person_name?: string; is_demo?: boolean; travel_reference?: any }) => {
      return api.createScreening(data.domain, data.document_type, data.is_demo, data.person_name, data.travel_reference);
    },
    uploadDocument: async (screeningId: string, file: File | Blob, docRole = 'primary_document', filename = 'document.jpg') => {
      return api.uploadDocument(screeningId, file, docRole, filename);
    },
    analyze: async (screeningId: string, isTampered = false) => {
      return api.startAnalysis(screeningId, isTampered);
    },
    get: async (screeningId: string) => {
      return api.getScreeningDetail(screeningId);
    },
    status: async (screeningId: string) => {
      return api.getScreeningStatus(screeningId);
    }
  },
};
