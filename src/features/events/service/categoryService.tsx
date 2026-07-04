import { api } from "@/lib/api/apiClient";
import { AssignMentorsRequest, Category, CategoryMentor, CategoryRequest, Mentor } from "../types/category";

export const categoryService = {
    create: (
        eventId: string,
        body: CategoryRequest
    ) => api.post<Category>(
        `/api/v1/category/${eventId}`,
        body
    ),

    getByEvent: (eventId: string) => api.get<Category[]>(`/api/v1/categories/${eventId}`),
    getById: (id: string) => api.get<Category>(`api/v1/category/${id}`),

    update: (
        id: string,
        body: CategoryRequest
    ) => api.put<Category>(
        `/api/v1/category/${id}`,
        body
    ),

    delete: (id: string) => api.delete<void>(`/api/v1/category/${id}`),

    assignMentor: (
        categoryId: string,
        body: AssignMentorsRequest
    ) => api.post<CategoryMentor>(
        `/api/v1/category/mentor/${categoryId}`,
        body
    ),

    getMentors: (categoryId: string) => api.get<CategoryMentor[]>(`/api/v1/category/mentors/${categoryId}`),

    getAllMentors: () => api.get<Mentor[]>("/api/v1/users/mentors"),
   
}
