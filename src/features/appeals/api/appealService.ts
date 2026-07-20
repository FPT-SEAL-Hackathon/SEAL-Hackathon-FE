import { api } from '@/lib/api/apiClient';

export interface Appeal {
  appealId: string;
  teamId: string;
  teamName: string;
  eventId: string;
  eventName: string;
  categoryId: string;
  categoryName: string;
  title: string;
  reason: string;
  appealType: 'SCORE_REVIEW' | 'RULE_VIOLATION' | 'TECHNICAL_ISSUE';
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  resolutionNote?: string;
  resolvedBy?: string;
  resolvedByName?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppealRequest {
  eventId: string;
  categoryId: string;
  teamId: string;
  title: string;
  reason: string;
  appealType: 'SCORE_REVIEW' | 'RULE_VIOLATION' | 'TECHNICAL_ISSUE';
}

export interface ResolveAppealRequest {
  status: 'RESOLVED' | 'REJECTED';
  resolutionNote: string;
}

const API_URL = '/api/v1/appeals';

export const appealService = {
  createAppeal: async (data: CreateAppealRequest): Promise<Appeal> => {
    const response = await api.post<{ data: Appeal }>(`${API_URL}`, data);
    return response.data;
  },

  resolveAppeal: async (appealId: string, data: ResolveAppealRequest): Promise<Appeal> => {
    const response = await api.patch<{ data: Appeal }>(`${API_URL}/${appealId}/resolve`, data);
    return response.data;
  },

  getAppealsByTeam: async (teamId: string): Promise<Appeal[]> => {
    const response = await api.get<{ data: Appeal[] }>(`${API_URL}/team/${teamId}`);
    return response.data;
  },

  getAppealsByEvent: async (eventId: string): Promise<Appeal[]> => {
    const response = await api.get<{ data: Appeal[] }>(`${API_URL}/event/${eventId}`);
    return response.data;
  }
};
