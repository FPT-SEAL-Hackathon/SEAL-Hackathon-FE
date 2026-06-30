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
  categoryId: string;
  mentorId: string;
  assignedAt: string;
}

interface BackendEnvelope<T> {
  data?: T;
  statusCode?: number;
  message?: string;
}

function unwrapList<T>(response: T[] | BackendEnvelope<T[]>): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  throw new Error(response.message ?? "Unexpected categories response from server.");
}

export const categoryService = {
  getByEvent: async (eventId: string) =>
    unwrapList(await api.get<CategoryResponse[] | BackendEnvelope<CategoryResponse[]>>(`/api/v1/categories/categories/${eventId}`, false)),
  getById: (id: string) =>
    api.get<CategoryResponse>(`/api/v1/categories/category/${id}`),
  create: (eventId: string, data: CreateCategoryRequest) =>
    api.post<CategoryResponse>(`/api/v1/categories/category/${eventId}`, data),
  update: (id: string, data: UpdateCategoryRequest) =>
    api.put<CategoryResponse>(`/api/v1/categories/category/${id}`, data),
  delete: (id: string) =>
    api.delete(`/api/v1/categories/category/${id}`),
  assignMentors: (categoryId: string, mentorIds: string[]) =>
    api.post<CategoryMentorResponse[]>(`/api/v1/category/mentor/${categoryId}`, { mentorIds }),
};
