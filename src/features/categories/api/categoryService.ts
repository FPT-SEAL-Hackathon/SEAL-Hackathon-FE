import { api } from "@/lib/api/apiClient";

export interface CategoryResponse {
  categoryId: string;
  eventId: string;
  categoryName: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateCategoryRequest {
  categoryName: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  categoryName: string;
  description?: string;
  sortOrder?: number;
}

export interface CategoryMentorResponse {
  categoryMentorId: string;
  categoryExpertId?: string;
  categoryId: string;
  mentorId: string;
  expertId?: string;
  mentorName?: string;
  expertName?: string;
  mentorEmail?: string;
  expertEmail?: string;
  assignedAt: string;
}

interface BackendEnvelope<T> {
  data?: T;
  statusCode?: number;
  message?: string;
}

type BackendCategoryExpertResponse = Partial<CategoryMentorResponse> & {
  categoryExpertId?: string;
  expertId?: string;
  expertName?: string;
  expertEmail?: string;
};

function unwrapList<T>(response: T[] | BackendEnvelope<T[]>): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  throw new Error(response.message ?? "Unexpected categories response from server.");
}

function normalizeCategoryMentor(item: BackendCategoryExpertResponse): CategoryMentorResponse {
  const categoryMentorId = item.categoryMentorId ?? item.categoryExpertId ?? "";
  const mentorId = item.mentorId ?? item.expertId ?? "";
  return {
    ...item,
    categoryMentorId,
    categoryExpertId: item.categoryExpertId ?? categoryMentorId,
    categoryId: item.categoryId ?? "",
    mentorId,
    expertId: item.expertId ?? mentorId,
    mentorName: item.mentorName ?? item.expertName,
    expertName: item.expertName ?? item.mentorName,
    mentorEmail: item.mentorEmail ?? item.expertEmail,
    expertEmail: item.expertEmail ?? item.mentorEmail,
    assignedAt: item.assignedAt ?? "",
  };
}

export const categoryService = {
  getByEvent: async (eventId: string) =>
    unwrapList(await api.get<CategoryResponse[] | BackendEnvelope<CategoryResponse[]>>(`/api/v1/categories/${eventId}`)),
  getById: (id: string) =>
    api.get<CategoryResponse>(`/api/v1/category/${id}`),
  create: (eventId: string, data: CreateCategoryRequest) =>
    api.post<CategoryResponse>(`/api/v1/category/${eventId}`, data),
  update: (id: string, data: UpdateCategoryRequest) =>
    api.put<CategoryResponse>(`/api/v1/category/${id}`, data),
  delete: (id: string) =>
    api.delete(`/api/v1/category/${id}`),
  assignMentors: async (categoryId: string, mentorIds: string[]) =>
    unwrapList(await api.post<BackendCategoryExpertResponse[] | BackendEnvelope<BackendCategoryExpertResponse[]>>(
      `/api/v1/category/expert/${categoryId}`,
      { expertIds: mentorIds },
    )).map(normalizeCategoryMentor),
  getMentors: async (categoryId: string) =>
    unwrapList(await api.get<BackendCategoryExpertResponse[] | BackendEnvelope<BackendCategoryExpertResponse[]>>(
      `/api/v1/category/experts/${categoryId}`,
    )).map(normalizeCategoryMentor),
};
