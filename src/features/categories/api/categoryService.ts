import { api, ApiError } from "@/lib/api/apiClient";

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
  mentorName?: string;
  mentorEmail?: string;
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

function unwrapItem<T>(response: T | BackendEnvelope<T>): T {
  if (typeof response === "object" && response !== null && "data" in response && response.data !== undefined) {
    return response.data;
  }
  return response as T;
}

async function withLegacyFallback<T>(request: () => Promise<T>, legacyRequest: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    const isMissingRoute = error instanceof ApiError
      && error.status === 404
      && /no static resource/i.test(error.message);
    if (!isMissingRoute) throw error;
    return legacyRequest();
  }
}

export const categoryService = {
  getByEvent: async (eventId: string) =>
    unwrapList(await withLegacyFallback(
      () => api.get<CategoryResponse[] | BackendEnvelope<CategoryResponse[]>>(`/api/v1/categories/${eventId}`),
      () => api.get<CategoryResponse[] | BackendEnvelope<CategoryResponse[]>>(`/api/v1/categories/categories/${eventId}`),
    )),
  getById: async (id: string) =>
    unwrapItem(await withLegacyFallback(
      () => api.get<CategoryResponse | BackendEnvelope<CategoryResponse>>(`/api/v1/category/${id}`),
      () => api.get<CategoryResponse | BackendEnvelope<CategoryResponse>>(`/api/v1/categories/category/${id}`),
    )),
  create: async (eventId: string, data: CreateCategoryRequest) =>
    unwrapItem(await withLegacyFallback(
      () => api.post<CategoryResponse | BackendEnvelope<CategoryResponse>>(`/api/v1/category/${eventId}`, data),
      () => api.post<CategoryResponse | BackendEnvelope<CategoryResponse>>(`/api/v1/categories/category/${eventId}`, data),
    )),
  update: async (id: string, data: UpdateCategoryRequest) =>
    unwrapItem(await withLegacyFallback(
      () => api.put<CategoryResponse | BackendEnvelope<CategoryResponse>>(`/api/v1/category/${id}`, data),
      () => api.put<CategoryResponse | BackendEnvelope<CategoryResponse>>(`/api/v1/categories/category/${id}`, data),
    )),
  delete: (id: string) =>
    withLegacyFallback(
      () => api.delete(`/api/v1/category/${id}`),
      () => api.delete(`/api/v1/categories/category/${id}`),
    ),
  assignMentors: (categoryId: string, mentorIds: string[]) =>
    api.post<CategoryMentorResponse[]>(`/api/v1/category/mentor/${categoryId}`, { mentorIds }),
  getMentors: (categoryId: string) =>
    withLegacyFallback(
      () => api.get<CategoryMentorResponse[]>(`/api/v1/category/mentors/${categoryId}`),
      () => api.get<CategoryMentorResponse[]>(`/api/v1/category/mentor/${categoryId}`),
    ),
};
