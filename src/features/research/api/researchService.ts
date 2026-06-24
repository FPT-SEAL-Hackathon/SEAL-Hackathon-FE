import { API_BASE_URL, api } from "@/lib/api/apiClient";

export interface VarianceReportResponse {
  roundId: string;
  roundName: string;
  categoryId: string;
  categoryName: string;
  submissionId: string;
  teamId: string;
  teamName: string;
  roundCriterionId: string;
  criterionName: string;
  judgeCount: number;
  meanScore: number;
  standardDeviation: number;
  scoreRange: number;
  variance: number;
}

export interface ScoreDistributionResponse {
  bucketStart: number;
  bucketEnd: number;
  scoreCount: number;
  percentage: number;
}

export interface ReliabilityMetricResponse {
  judgeUserId: string;
  judgeName: string;
  scoredItemCount: number;
  comparableScoreCount: number;
  calibrationScoreCount: number;
  averageScore: number;
  biasFromPeerMean: number;
  averageAbsoluteDeviation: number;
  rootMeanSquareDeviation: number;
}

export interface ResearchDashboardResponse {
  varianceReport: VarianceReportResponse[];
  scoreDistribution: ScoreDistributionResponse[];
  reliabilityMetrics: ReliabilityMetricResponse[];
}

export interface CalibrationSampleResponse {
  sampleId: string;
  roundId: string;
  roundName: string;
  submissionId: string;
  teamId: string;
  teamName: string;
  referenceScoreJson: string;
  addedById: string;
  addedByName: string;
  addedAt: string;
}

export interface CreateCalibrationSampleRequest {
  roundId: string;
  submissionId: string;
  referenceScoreJson?: string;
}

export interface DataExportLogResponse {
  exportId: string;
  eventId: string;
  eventName: string;
  exportedById: string;
  exportedByName: string;
  exportedAt: string;
  fileFormat: string;
  rowCount: number;
  notes: string;
}

export interface ResearchQuery {
  roundId?: string;
  categoryId?: string;
  bucketSize?: number;
}

export type ResearchExportType =
  | "dashboard"
  | "variance-report"
  | "score-distribution"
  | "reliability-metrics";

function buildQuery(params: ResearchQuery & { type?: string } = {}) {
  const query = new URLSearchParams();
  if (params.roundId) query.set("roundId", params.roundId);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.bucketSize !== undefined) query.set("bucketSize", String(params.bucketSize));
  if (params.type) query.set("type", params.type);
  const text = query.toString();
  return text ? `?${text}` : "";
}

export const researchService = {
  getDashboard: (eventId: string, params?: ResearchQuery) =>
    api.get<ResearchDashboardResponse>(`/api/v1/research/events/${eventId}/dashboard${buildQuery(params)}`),

  getVarianceReport: (eventId: string, params?: Pick<ResearchQuery, "roundId" | "categoryId">) =>
    api.get<VarianceReportResponse[]>(`/api/v1/research/events/${eventId}/variance-report${buildQuery(params)}`),

  getScoreDistribution: (eventId: string, params?: ResearchQuery) =>
    api.get<ScoreDistributionResponse[]>(`/api/v1/research/events/${eventId}/score-distribution${buildQuery(params)}`),

  getReliabilityMetrics: (eventId: string, params?: Pick<ResearchQuery, "roundId" | "categoryId">) =>
    api.get<ReliabilityMetricResponse[]>(`/api/v1/research/events/${eventId}/reliability-metrics${buildQuery(params)}`),

  createCalibrationSample: (data: CreateCalibrationSampleRequest) =>
    api.post<CalibrationSampleResponse>("/api/v1/research/calibration-samples", data),

  getCalibrationSamplesByRound: (roundId: string) =>
    api.get<CalibrationSampleResponse[]>(`/api/v1/research/rounds/${roundId}/calibration-samples`),

  getCalibrationSample: (sampleId: string) =>
    api.get<CalibrationSampleResponse>(`/api/v1/research/calibration-samples/${sampleId}`),

  deleteCalibrationSample: (sampleId: string) =>
    api.delete<void>(`/api/v1/research/calibration-samples/${sampleId}`),

  getExportLogs: (eventId: string) =>
    api.get<DataExportLogResponse[]>(`/api/v1/research/events/${eventId}/export-logs`),

  exportUrl: (eventId: string, params?: ResearchQuery & { type?: ResearchExportType }) =>
    `${API_BASE_URL}/api/v1/research/events/${eventId}/export${buildQuery(params)}`,
};
