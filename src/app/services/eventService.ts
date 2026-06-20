import { api } from "./apiClient";

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

export const eventService = {
  getAll: () => api.get<EventResponse[]>("/api/v1/events"),
  getById: (id: string) => api.get<EventResponse>(`/api/v1/event/${id}`),
  create: (data: CreateEventRequest) => api.post<EventResponse>("/api/v1/event", data),
  update: (id: string, data: UpdateEventRequest) => api.put<EventResponse>(`/api/v1/event/${id}`, data),
  updateStatus: (id: string, data: UpdateEventStatusRequest) => api.patch<EventResponse>(`/api/v1/event/status/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/event/${id}`),
};
