import { request } from "@/lib/api/apiClient";

export type ConsultationStatus = "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "RESOLVED" | "REJECTED" | "CANCELLED";
export type ConsultationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface MentorProfileResponse {
  mentorId: string;
  fullName: string;
  email: string;
  avatar?: string;
  department?: string;
  specialization?: string;
  bio?: string;
  categoryId: string;
  categoryName: string;
}

export interface ConsultationRequestResponse {
  id: string;
  eventId: string;
  eventName: string;
  categoryId: string;
  categoryName: string;
  teamId: string;
  teamName: string;
  mentorId: string;
  mentorName: string;
  createdByUserId: string;
  createdByName: string;
  title: string;
  description: string;
  priority: ConsultationPriority;
  status: ConsultationStatus;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  lastMessagePreview?: string;
  unreadCount?: number;
}

export interface ConsultationMessageResponse {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  content: string;
  attachmentUrl?: string;
  createdAt: string;
  seenAt?: string;
}

export interface CreateConsultationRequest {
  title: string;
  description: string;
  priority: ConsultationPriority;
  attachmentUrl?: string;
  mentorId?: string;
}

export interface MessageRequest {
  content: string;
  attachmentUrl?: string;
}

export interface AssignedCategoryResponse {
  categoryId: string;
  categoryName: string;
  eventId: string;
  eventName: string;
  numberOfTeams: number;
  numberOfOpenRequests: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const consultationService = {
  // Coordinator
  assignMentor: (categoryId: string, mentorId: string) =>
    request(`/api/v1/categories/${categoryId}/mentors/${mentorId}`, { method: "POST" }),
  
  removeMentor: (categoryId: string, mentorId: string) =>
    request(`/api/v1/categories/${categoryId}/mentors/${mentorId}`, { method: "DELETE" }),
    
  getMentorsOfCategory: (categoryId: string): Promise<MentorProfileResponse[]> =>
    request(`/api/v1/categories/${categoryId}/mentors`, { method: "GET" }),

  // Mentor
  getAssignedCategories: (): Promise<AssignedCategoryResponse[]> =>
    request(`/api/v1/mentor/categories`, { method: "GET" }),

  getMentorRequests: (params?: { categoryId?: string; teamId?: string; status?: string; priority?: string; page?: number; size?: number }): Promise<Page<ConsultationRequestResponse>> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) query.append(key, String(value));
      });
    }
    return request(`/api/v1/mentor/consultation-requests?${query.toString()}`, { method: "GET" });
  },

  acceptRequest: (requestId: string): Promise<ConsultationRequestResponse> =>
    request(`/api/v1/mentor/consultation-requests/${requestId}/accept`, { method: "PUT" }),

  rejectRequest: (requestId: string, reason: string): Promise<ConsultationRequestResponse> =>
    request(`/api/v1/mentor/consultation-requests/${requestId}/reject`, { method: "PUT", body: JSON.stringify({ reason }) }),

  markInProgress: (requestId: string): Promise<ConsultationRequestResponse> =>
    request(`/api/v1/mentor/consultation-requests/${requestId}/in-progress`, { method: "PUT" }),

  resolveRequest: (requestId: string): Promise<ConsultationRequestResponse> =>
    request(`/api/v1/mentor/consultation-requests/${requestId}/resolve`, { method: "PUT" }),

  // Team
  getMyMentor: (): Promise<MentorProfileResponse[]> =>
    request(`/api/v1/teams/my-mentor`, { method: "GET" }),

  createRequest: (data: CreateConsultationRequest): Promise<ConsultationRequestResponse> =>
    request(`/api/v1/consultation-requests`, { method: "POST", body: JSON.stringify(data) }),

  getMyTeamRequests: (params?: { status?: string; page?: number; size?: number }): Promise<Page<ConsultationRequestResponse>> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) query.append(key, String(value));
      });
    }
    return request(`/api/v1/consultation-requests/my-team?${query.toString()}`, { method: "GET" });
  },

  cancelRequest: (requestId: string): Promise<ConsultationRequestResponse> =>
    request(`/api/v1/consultation-requests/${requestId}/cancel`, { method: "PUT" }),

  // Shared
  getRequestDetail: (requestId: string): Promise<ConsultationRequestResponse> =>
    request(`/api/v1/consultation-requests/${requestId}`, { method: "GET" }),

  getMessages: (requestId: string): Promise<ConsultationMessageResponse[]> =>
    request(`/api/v1/consultation-requests/${requestId}/messages`, { method: "GET" }),

  sendMessage: (requestId: string, data: MessageRequest): Promise<ConsultationMessageResponse> =>
    request(`/api/v1/consultation-requests/${requestId}/messages`, { method: "POST", body: JSON.stringify(data) }),
};
