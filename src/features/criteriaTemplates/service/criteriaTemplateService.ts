import { api } from "@/lib/api/apiClient";
import { TemplateRequest, CriteriaTemplate } from "../types/template";

export const criteriaTemplateService = {
    getAllActive: () => api.get<CriteriaTemplate[]>("/api/v1/criteria/templates"),

    create: (body: TemplateRequest) => api.post<CriteriaTemplate>(
        "/api/v1/criteria/template",
        body
    ),

    update: (
        id: string,
        body: TemplateRequest
    ) => api.put<CriteriaTemplate>(
        `/api/v1/criteria/template/${id}`,
        body
    ),

    delete: (id: string) => api.delete<void>(`/api/v1/criteria/template/${id}`),
}

