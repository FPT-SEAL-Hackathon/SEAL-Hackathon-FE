import { api } from "@/lib/api/apiClient";
import { CriteriaTemplate } from "../types/template";

export const criteriaTemplateService = {
    getAll: () => api.get<CriteriaTemplate[]>("/api/v1/criteria/templates"),
}

