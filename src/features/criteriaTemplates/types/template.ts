import { UserResponse } from "@/features/auth/api/authService";

export interface CriteriaTemplate {
    templateId: string;
    criterionName: string;
    description: string;
    defaultWeight: number;
    maxScore: number;
    isActivce: boolean;
    createdBy: UserResponse;
    createdAt: string;
}
