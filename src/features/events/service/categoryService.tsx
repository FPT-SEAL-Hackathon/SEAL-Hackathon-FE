import { api } from "@/lib/api/apiClient";
import { AssignMentorsRequest, Category, CategoryMentor, CategoryRequest, Mentor } from "../types/category";

type BackendCategoryExpert = Partial<CategoryMentor> & {
    categoryExpertId?: string;
    expertId?: string;
    expertName?: string;
    expertEmail?: string;
};

function normalizeCategoryMentor(item: BackendCategoryExpert): CategoryMentor {
    const categoryMentorId = item.categoryMentorId ?? item.categoryExpertId ?? "";
    const mentorId = item.mentorId ?? item.expertId ?? "";
    return {
        ...item,
        categoryMentorId,
        categoryExpertId: item.categoryExpertId ?? categoryMentorId,
        categoryId: item.categoryId ?? "",
        mentorId,
        expertId: item.expertId ?? mentorId,
        fullName: item.fullName ?? item.expertName ?? "",
        email: item.email ?? item.expertEmail ?? "",
        assignedAt: item.assignedAt ?? "",
    };
}

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
    ) => api.post<BackendCategoryExpert>(
        `/api/v1/category/expert/${categoryId}`,
        { expertIds: body.expertIds ?? body.mentorIds ?? [] }
    ).then(normalizeCategoryMentor),

    getMentors: (categoryId: string) => api.get<BackendCategoryExpert[]>(`/api/v1/category/experts/${categoryId}`)
        .then(items => items.map(normalizeCategoryMentor)),

    getAllMentors: () => api.get<Mentor[]>("/api/v1/users/experts"),
   
}
