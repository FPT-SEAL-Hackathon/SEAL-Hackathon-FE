import { api } from "@/lib/api/apiClient";

export interface EventResponse {
  eventId: string;
  eventName: string;
  description: string;
  location: string;
  bannerImageUrl: string;
  eventStatusId: string;
  registrationStart: string;
  registrationEnd: string;
  eventStartDate: string;
  eventEndDate: string;
  maxTeamSize: number;
  minTeamSize: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  eventName: string;
  description?: string;
  location?: string;
  bannerImageUrl?: string;
  eventStatusId: string;
  registrationStart?: string;
  registrationEnd?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  maxTeamSize?: number;
  minTeamSize?: number;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  eventName: string;
  eventStatusId: string;
}

export interface UpdateEventStatusRequest {
  eventStatusId: string;
}

interface BackendEnvelope<T> {
  data?: T;
  statusCode?: number;
  message?: string;
}

function unwrapList<T>(response: T[] | BackendEnvelope<T[]>): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  throw new Error(response.message ?? "Unexpected events response from server.");
}

export const eventService = {
  getAll: async () => unwrapList(await api.get<EventResponse[] | BackendEnvelope<EventResponse[]>>("/api/v1/events")),
  getById: (id: string) => api.get<EventResponse>(`/api/v1/event/${id}`),
  create: (data: CreateEventRequest) => api.post<EventResponse>("/api/v1/event", data),
  update: (id: string, data: UpdateEventRequest) => api.put<EventResponse>(`/api/v1/event/${id}`, data),
  updateStatus: (id: string, data: UpdateEventStatusRequest) => api.patch<EventResponse>(`/api/v1/event/status/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/event/${id}`),
};
