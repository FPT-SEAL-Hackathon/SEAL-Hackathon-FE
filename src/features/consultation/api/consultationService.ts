import { request } from "@/lib/api/apiClient";

export type ConsultationStatus = "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "RESOLVED" | "REJECTED" | "CANCELLED";
export type ConsultationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface MentorProfileResponse {
  mentorId: string;
  expertId?: string;
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

}

export interface MessageRequest {
  content: string;
  attachmentUrl?: string;
}

export interface TeamMentorNoteResponse {
  requestId: string;
  mentorId: string;
  note: string;
  updatedAt?: string;
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

type BackendMentorProfileResponse = Partial<MentorProfileResponse> & {
  expertId?: string;
};

type BackendConsultationRequestResponse = Partial<ConsultationRequestResponse>;

function normalizeMentorProfile(item: BackendMentorProfileResponse): MentorProfileResponse {
  const mentorId = item.mentorId ?? item.expertId ?? "";
  return {
    ...item,
    mentorId,
    expertId: item.expertId ?? mentorId,
    fullName: item.fullName ?? "",
    email: item.email ?? "",
    categoryId: item.categoryId ?? "",
    categoryName: item.categoryName ?? "",
  };
}

function normalizeConsultationRequest(item: BackendConsultationRequestResponse): ConsultationRequestResponse {
  return {
    ...item,
    id: item.id ?? "",
    eventId: item.eventId ?? "",
    eventName: item.eventName ?? "",
    categoryId: item.categoryId ?? "",
    categoryName: item.categoryName ?? "",
    teamId: item.teamId ?? "",
    teamName: item.teamName ?? "",
    createdByUserId: item.createdByUserId ?? "",
    createdByName: item.createdByName ?? "",
    title: item.title ?? "",
    description: item.description ?? "",
    priority: item.priority ?? "MEDIUM",
    status: item.status ?? "PENDING",
    createdAt: item.createdAt ?? "",
    updatedAt: item.updatedAt ?? "",
  };
}

function normalizePage<TIn, TOut>(page: Page<TIn>, normalize: (item: TIn) => TOut): Page<TOut> {
  return {
    ...page,
    content: (page.content ?? []).map(normalize),
  };
}



export const consultationService = {
  // Coordinator
  assignMentor: (categoryId: string, mentorId: string) =>
    request(`/api/v1/categories/${categoryId}/experts/${mentorId}`, { method: "POST" }),
  
  removeMentor: (categoryId: string, mentorId: string) =>
    request(`/api/v1/categories/${categoryId}/experts/${mentorId}`, { method: "DELETE" }),
    
  getMentorsOfCategory: (categoryId: string): Promise<MentorProfileResponse[]> =>
    request<BackendMentorProfileResponse[]>(`/api/v1/categories/${categoryId}/experts`, { method: "GET" })
      .then(items => items.map(normalizeMentorProfile)),

  // Mentor
  getAssignedCategories: (): Promise<AssignedCategoryResponse[]> =>
    request(`/api/v1/expert/categories`, { method: "GET" }),

  getMentorRequests: (params?: { categoryId?: string; teamId?: string; status?: string; priority?: string; page?: number; size?: number }): Promise<Page<ConsultationRequestResponse>> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) query.append(key, String(value));
      });
    }
    return request<Page<BackendConsultationRequestResponse>>(`/api/v1/expert/consultation-requests?${query.toString()}`, { method: "GET" })
      .then(page => normalizePage(page, normalizeConsultationRequest));
  },

  acceptRequest: (requestId: string): Promise<ConsultationRequestResponse> =>
    request<BackendConsultationRequestResponse>(`/api/v1/expert/consultation-requests/${requestId}/accept`, { method: "PUT" })
      .then(normalizeConsultationRequest),

  rejectRequest: (requestId: string, reason: string): Promise<ConsultationRequestResponse> =>
    request<BackendConsultationRequestResponse>(`/api/v1/expert/consultation-requests/${requestId}/reject`, { method: "PUT", body: JSON.stringify({ reason }) })
      .then(normalizeConsultationRequest),

  markInProgress: (requestId: string): Promise<ConsultationRequestResponse> =>
    request<BackendConsultationRequestResponse>(`/api/v1/expert/consultation-requests/${requestId}/in-progress`, { method: "PUT" })
      .then(normalizeConsultationRequest),

  resolveRequest: (requestId: string): Promise<ConsultationRequestResponse> =>
    request<BackendConsultationRequestResponse>(`/api/v1/expert/consultation-requests/${requestId}/resolve`, { method: "PUT" })
      .then(normalizeConsultationRequest),

  getTeamNote: (requestId: string): Promise<TeamMentorNoteResponse> =>
    request(`/api/v1/expert/consultation-requests/${requestId}/note`, { method: "GET" }),
    
  updateTeamNote: (requestId: string, note: string): Promise<TeamMentorNoteResponse> =>
    request(`/api/v1/expert/consultation-requests/${requestId}/note`, { method: "PUT", body: JSON.stringify({ note }) }),

  // Team
  getMyTeamMentorNotes: (requestId: string): Promise<TeamMentorNoteResponse[]> =>
    request(`/api/v1/consultation-requests/${requestId}/mentor-notes`, { method: "GET" }),

  getMyMentor: (): Promise<MentorProfileResponse[]> =>
    request<BackendMentorProfileResponse[]>(`/api/v1/teams/my-experts`, { method: "GET" })
      .then(items => items.map(normalizeMentorProfile)),

  createRequest: (data: CreateConsultationRequest): Promise<ConsultationRequestResponse> =>
    request<BackendConsultationRequestResponse>(`/api/v1/consultation-requests`, { method: "POST", body: JSON.stringify(data) })
      .then(normalizeConsultationRequest),

  getMyTeamRequests: (params?: { status?: string; page?: number; size?: number }): Promise<Page<ConsultationRequestResponse>> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) query.append(key, String(value));
      });
    }
    return request<Page<BackendConsultationRequestResponse>>(`/api/v1/consultation-requests/my-team?${query.toString()}`, { method: "GET" })
      .then(page => normalizePage(page, normalizeConsultationRequest));
  },

  cancelRequest: (requestId: string): Promise<ConsultationRequestResponse> =>
    request<BackendConsultationRequestResponse>(`/api/v1/consultation-requests/${requestId}/cancel`, { method: "PUT" })
      .then(normalizeConsultationRequest),

  // Shared
  getRequestDetail: (requestId: string): Promise<ConsultationRequestResponse> =>
    request<BackendConsultationRequestResponse>(`/api/v1/consultation-requests/${requestId}`, { method: "GET" })
      .then(normalizeConsultationRequest),

  getMessages: (requestId: string): Promise<ConsultationMessageResponse[]> =>
    request(`/api/v1/consultation-requests/${requestId}/messages?_t=${Date.now()}`, { method: "GET" }),

  sendMessage: (requestId: string, data: MessageRequest): Promise<ConsultationMessageResponse> =>
    request(`/api/v1/consultation-requests/${requestId}/messages`, { method: "POST", body: JSON.stringify(data) }),
};
