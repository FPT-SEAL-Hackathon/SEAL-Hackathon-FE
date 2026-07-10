import { UserResponse } from "@/features/auth/api/authService";

export interface CriteriaTemplate {
    templateId: string;
    criterionName: string;
    description: string;
    defaultWeight: number;
    maxScore: number;
    isActive: boolean;
    createdBy: UserResponse;
    createdAt: string;
}

export interface TemplateRequest {
    criterionName: string;
    description: string;
    defaultWeight: number;
    maxScore: number;
}

