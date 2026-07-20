import { ApiError, api } from "@/lib/api/apiClient";
import type { ReliabilityMetricResponse } from "@/features/research/api/researchService";

export interface JudgingDTO {
  id: string;
  submissionId: string;
  roundJudgeId: string;
  judgeName: string;
  roundCriterionId: string;
  criterionName: string;
  scoreValue: number;
  comment: string;
  scoredAt: string;
  updatedAt: string;
  isCalibration: boolean;
}

export interface ScoreSubmissionDTO {
  submissionId: string;
  roundCriterionId: string;
  scoreValue: number;
  comment?: string;
  isCalibration?: boolean;
}

export interface UpdateScoreSubmissionDTO {
  judgingId: string;
  scoreValue: number;
  comment?: string;
  isCalibration?: boolean;
  reason: string;
}

export interface EvaluationAuditLogDTO {
  id: string;
  eventId: string;
  actionType: string;
  actorUserId: string;
  judgingId: string;
  teamId: string;
  submissionId: string;
  oldValue: string;
  newValue: string;
  reason: string;
  createdAt: string;
}

function isMissingStaticResource(error: unknown) {
  return error instanceof ApiError
    && (error.status === 404
      || error.status === 500
      || error.details?.exceptionClass === "org.springframework.web.servlet.resource.NoResourceFoundException");
}

async function getWithFallbacks<T>(paths: string[]) {
  let lastError: unknown;
  for (const path of paths) {
    try {
      return await api.get<T>(path);
    } catch (error) {
      lastError = error;
      if (!isMissingStaticResource(error)) throw error;
    }
  }
  throw lastError;
}

async function getOptionalWithFallbacks<T>(paths: string[], emptyValue: T) {
  try {
    return await getWithFallbacks<T>(paths);
  } catch (error) {
    if (isMissingStaticResource(error)) return emptyValue;
    throw error;
  }
}

export const judgingService = {
  recordScores: (scores: ScoreSubmissionDTO[]) =>
    api.post<{ message: string }>("/api/v1/judging", scores),
  updateScores: (updates: UpdateScoreSubmissionDTO[]) =>
    api.patch<{ message: string }>("/api/v1/judging", updates),
  deleteScores: (submissionId: string, reason?: string) =>
    api.delete<{ message: string }>(`/api/v1/judging/submission/${submissionId}${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`),
  getBySubmission: (submissionId: string) =>
    api.get<JudgingDTO[]>(`/api/v1/judging/submission/${submissionId}`),
  getByJudge: (judgeUserId: string) =>
    api.get<JudgingDTO[]>(`/api/v1/judging/judge/${judgeUserId}`),
  getAuditLogs: (eventId: string) =>
    api.get<EvaluationAuditLogDTO[]>(`/api/v1/judging/audit-logs/event/${eventId}`),
  getCalibrationMetrics: (eventId?: string, roundId?: string, categoryId?: string) => {
    const params = new URLSearchParams();
    if (eventId) params.append("eventId", eventId);
    if (roundId) params.append("roundId", roundId);
    if (categoryId) params.append("categoryId", categoryId);
    const query = params.toString();
    const pathEventId = eventId || "all";
    const suffix = query ? `?${query}` : "";
    return getOptionalWithFallbacks<ReliabilityMetricResponse[]>([
      `/api/v1/judging/events/${pathEventId}/calibration-metrics${suffix}`,
      `/api/v1/research/calibration-metrics${suffix}`,
      `/api/v1/research/reliability-metrics${suffix}`,
    ], []);
  },
};
