import { UserResponse } from "@/features/auth/api/authService";

export interface Round {
    roundId: string;
    categoryId: string;
    roundName: string;
    description: string;
    roundOrder: number;
    roundStatusId: string;
    startDate: string | null;
    endDate: string | null;
    submissionDeadline: string | null;
    judgingDeadline: string | null;
    appealStartTime?: string | null;
    appealEndTime?: string | null;
    advancementTopN: number | null;
    isCalibrationRound: boolean;
}

export interface RoundStatus {
    statusId: string;
    statusName: string;
}

export interface RoundCriteria {
    roundCriterionId: string;
    roundId: string;
    eventCriterionId: string;
    criterionName: string;
    description: string;
    weight: number; 
    maxScore: number;
    sortOrder: number;
}

export interface Judge {
    judgeId: string;
    userId?: string;
    fullName: string;
    email: string;
    phone: string;
    role?: string;
    roleName?: string;
}

export interface RoundJudge {
    roundJudgeId: string;
    roundId: string;
    judgeId: string;
    fullName: string;
    email: string;
    phone: string;
    assignedAt: string;
    assignedById: string;
}

export interface RoundRequest {
    roundName: string;
    description?: string;
    roundOrder: number;
    roundStatusId?: string;
    startDate?: string | null;
    endDate?: string | null;
    submissionDeadline?: string | null;
    judgingDeadline?: string | null;
    appealStartTime?: string | null;
    appealEndTime?: string | null;
    advancementTopN?: number | null;
    isCalibrationRound: boolean;
}

export interface ImportEventCriteriaRequest {
    eventCriterionIds: string[];
}

export interface UpdateRoundCriterionRequest {
    weight: number;
    maxScore: number;
}

export interface AssignJudgesRequest {
    judgeIds: string[];
}

