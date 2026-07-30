import { api, ApiError } from "@/lib/api/apiClient";

export interface CategoryResponse {
  categoryId: string;
  eventId: string;
  categoryName: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  /**
   * Số đội đang đăng ký trong category (backend trả ở GET theo event và theo id).
   * Chỉ dùng để tham chiếu/cảnh báo mềm khi đặt Advancement Top N — KHÔNG phải ràng buộc
   * cứng, vì round thường được tạo lúc chưa đội nào đăng ký.
   */
  teamCount?: number | null;
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
    unwrapList(await withLegacyFallback(
      () => api.get<CategoryResponse[] | BackendEnvelope<CategoryResponse[]>>(`/api/v1/categories/${eventId}`),
      () => api.get<CategoryResponse[] | BackendEnvelope<CategoryResponse[]>>(`/api/v1/categories/categories/${eventId}`),
    )).filter(category => category.isActive !== false),
  getById: async (id: string) =>
    unwrapItem(await withLegacyFallback(
      () => api.get<CategoryResponse | BackendEnvelope<CategoryResponse>>(`/api/v1/categories/category/${id}`),
      () => api.get<CategoryResponse | BackendEnvelope<CategoryResponse>>(`/api/v1/category/${id}`),
    )),
  create: async (eventId: string, data: CreateCategoryRequest) =>
    unwrapItem(await withLegacyFallback(
      () => api.post<CategoryResponse | BackendEnvelope<CategoryResponse>>(`/api/v1/categories/category/${eventId}`, data),
      () => api.post<CategoryResponse | BackendEnvelope<CategoryResponse>>(`/api/v1/category/${eventId}`, data),
    )),
  update: async (id: string, data: UpdateCategoryRequest) =>
    unwrapItem(await withLegacyFallback(
      () => api.put<CategoryResponse | BackendEnvelope<CategoryResponse>>(`/api/v1/categories/category/${id}`, data),
      () => api.put<CategoryResponse | BackendEnvelope<CategoryResponse>>(`/api/v1/category/${id}`, data),
    )),
  delete: (id: string) =>
    withLegacyFallback(
      () => api.delete(`/api/v1/categories/category/${id}`),
      () => api.delete(`/api/v1/category/${id}`),
    ),
  assignMentors: async (categoryId: string, mentorIds: string[]) =>
    unwrapList(await api.post<BackendCategoryExpertResponse[] | BackendEnvelope<BackendCategoryExpertResponse[]>>(
      `/api/v1/category/expert/${categoryId}`,
      { expertIds: mentorIds, mentorIds, userIds: mentorIds },
    )).map(normalizeCategoryMentor),
  getMentors: async (categoryId: string) =>
    unwrapList(await api.get<BackendCategoryExpertResponse[] | BackendEnvelope<BackendCategoryExpertResponse[]>>(
      `/api/v1/category/experts/${categoryId}`,
    )).map(normalizeCategoryMentor),
  removeMentor: (categoryId: string, mentorId: string) =>
    api.delete(`/api/v1/category/expert/${categoryId}/${mentorId}`),
};
