import { api } from "./apiClient";

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

export const categoryService = {
  getByEvent: (eventId: string) =>
    api.get<CategoryResponse[]>(`/api/v1/categories/categories/${eventId}`),
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
