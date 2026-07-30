import { api, ApiError } from "@/lib/api/apiClient";
import { AssignMentorsRequest, Category, CategoryMentor, CategoryRequest, Mentor } from "../types/category";

type BackendCategoryExpert = Partial<CategoryMentor> & {
    categoryExpertId?: string;
    expertId?: string;
    expertName?: string;
    expertEmail?: string;
};

type BackendMentor = Partial<Mentor> & {
    id?: string;
    userId?: string;
    judgeId?: string;
    name?: string;
    role?: string;
    roleName?: string;
};

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
    create: async (
        eventId: string,
        body: CategoryRequest
    ) => unwrapItem(await api.post<Category | BackendEnvelope<Category>>(`/api/v1/category/${eventId}`, body)),

    getByEvent: async (eventId: string) => unwrapList(await withLegacyFallback(
        () => api.get<Category[] | BackendEnvelope<Category[]>>(`/api/v1/categories/${eventId}`),
        () => api.get<Category[] | BackendEnvelope<Category[]>>(`/api/v1/categories/categories/${eventId}`),
    )).filter(category => category.isActive !== false),
    getById: async (id: string) => unwrapItem(await api.get<Category | BackendEnvelope<Category>>(`/api/v1/category/${id}`)),

    update: async (
        id: string,
        body: CategoryRequest
    ) => unwrapItem(await api.put<Category | BackendEnvelope<Category>>(`/api/v1/category/${id}`, body)),

    delete: (id: string) => api.delete<void>(`/api/v1/category/${id}`),

    // Sends { expertIds: [...] } – the backend expects this field name
    assignMentor: (
        categoryId: string,
        body: AssignMentorsRequest
    ) => api.post<BackendCategoryExpert | BackendCategoryExpert[]>(
        `/api/v1/category/expert/${categoryId}`,
        {
            expertIds: body.expertIds ?? body.mentorIds ?? [],
            mentorIds: body.mentorIds ?? body.expertIds ?? [],
            userIds: body.expertIds ?? body.mentorIds ?? [],
        }
    ).then(res => {
        const items = Array.isArray(res) ? res : [res];
        return items.map(normalizeCategoryMentor);
    }),

    getMentors: (categoryId: string) => api.get<BackendCategoryExpert[]>(`/api/v1/category/experts/${categoryId}`)
        .then(items => (Array.isArray(items) ? items : []).map(normalizeCategoryMentor)),

    removeMentor: (categoryId: string, mentorId: string) =>
        api.delete(`/api/v1/category/expert/${categoryId}/${mentorId}`),

    // Normalises the response so `id` is always populated from userId/judgeId/id.
    getAllMentors: async (): Promise<Mentor[]> => {
        const raw = await api.get<BackendMentor[]>("/api/v1/users/mentors");
        const list = Array.isArray(raw) ? raw : [];
        return list.map(u => ({
            id: String(u.userId ?? u.judgeId ?? u.id ?? ""),
            fullName: u.fullName ?? u.name ?? u.email ?? "Unknown",
            email: u.email ?? "",
            phone: u.phone ?? "",
            role: u.role,
            roleName: u.roleName,
        }));
    },
};
