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

/** Tiến độ chấm bài mẫu của một giám khảo trong vòng hiệu chuẩn. */
export interface CalibrationJudgeStatus {
  judgeUserId: string;
  judgeName: string;
  email: string;
  sampleCount: number;
  /** Số bài mẫu đã chấm ĐỦ mọi tiêu chí. */
  completedSampleCount: number;
  scoredCriterionCount: number;
  expectedCriterionCount: number;
  completed: boolean;
  lastScoredAt: string | null;
}

export interface EvaluationAuditLogDTO {
  id: string;
  eventId: string;
  eventName?: string;
  actionType: string;
  actorUserId: string;
  actorName?: string;
  judgingId: string;
  teamId: string;
  teamName?: string;
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
  deleteScores: (submissionId: string, reason?: string) => {
    if (!submissionId || submissionId === "undefined") return Promise.reject("Invalid submissionId");
    return api.delete<{ message: string }>(`/api/v1/judging/submission/${submissionId}${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`);
  },
  getBySubmission: (submissionId: string) => {
    if (!submissionId || submissionId === "undefined") return Promise.resolve([]);
    return api.get<JudgingDTO[]>(`/api/v1/judging/submission/${submissionId}`);
  },
  getPublishedBySubmission: (submissionId: string) => {
    if (!submissionId || submissionId === "undefined") return Promise.resolve([]);
    return api.get<JudgingDTO[]>(`/api/v1/judging/team-submission/${submissionId}/published`);
  },
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

  /** Ai đã/chưa chấm xong bài mẫu của một vòng hiệu chuẩn (Organizer/Admin). */
  getCalibrationStatus: (roundId: string) =>
    api.get<CalibrationJudgeStatus[]>(`/api/v1/judging/rounds/${roundId}/calibration-status`),

  /** Nhắc những giám khảo chưa hoàn thành. Trả về số người đã được nhắc. */
  remindCalibrationJudges: (roundId: string) =>
    api.post<{ remindedCount: number; message: string }>(
      `/api/v1/judging/rounds/${roundId}/calibration-reminder`,
      {},
    ),
};
