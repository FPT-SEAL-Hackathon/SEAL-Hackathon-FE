import { api } from "@/lib/api/apiClient";

export interface ConsensusMatrixResponse {
  /** Một dòng = một (bài mẫu × tiêu chí). Round hiệu chuẩn có thể có nhiều bài mẫu. */
  submissionId: string;
  sampleLabel: string;
  criteriaName: string;
  median: number;
  minScore: number;
  maxScore: number;
  standardDeviation: number;
  /** Điểm tối đa của tiêu chí — dùng để chuẩn hoá khi so sánh giữa các tiêu chí khác thang. */
  maxPossibleScore: number;
  status: string;
  /** Điểm của TẤT CẢ giám khảo (không kèm danh tính) để vẽ phân bố. */
  scoreDistribution: number[];
  judgeScores: Record<string, number>;
}

export interface VarianceReportResponse {
  roundId: string;
  roundName: string;
  categoryId: string;
  categoryName: string;
  submissionId: string;
  teamId: string | null;
  teamName: string | null;
  roundCriterionId: string;
  criterionName: string;
  judgeCount: number;
  meanScore: number;
  /**
   * null khi KHÔNG TÍNH ĐƯỢC (bài chỉ có 1 giám khảo chấm) — khác hẳn 0 nghĩa là
   * "các giám khảo chấm y hệt nhau". Phải hiển thị "—", đừng quy về 0.
   */
  standardDeviation: number | null;
  scoreRange: number;
  variance: number | null;
}

export interface ReliabilityMetricResponse {
  judgeUserId: string;
  judgeName: string;
  scoredItemCount: number;
  comparableScoreCount: number;
  calibrationScoreCount: number;
  averageScore: number;
  minScore: number;
  maxScore: number;
  biasFromPeerMean: number;
  averageAbsoluteDeviation: number;
  rootMeanSquareDeviation: number;
}

export const researchService = {
  exportUrl: (eventId: string, type: string = "dashboard") => {
    return `${import.meta.env.VITE_API_URL || ""}/api/v1/research/events/${eventId}/export?type=${type}`;
  },
  getConsensusMatrix: async (roundId: string): Promise<ConsensusMatrixResponse[]> => {
    return await api.get(`/api/v1/research/calibration/matrix/${roundId}`);
  },
  getVarianceReport: async (params: { eventId?: string; roundId?: string; categoryId?: string }) => {
    const query = new URLSearchParams();
    if (params.eventId) query.append("eventId", params.eventId);
    if (params.roundId) query.append("roundId", params.roundId);
    if (params.categoryId) query.append("categoryId", params.categoryId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return await api.get<VarianceReportResponse[]>(`/api/v1/research/variance-report${suffix}`);
  },
  exportCalibrationCsvUrl: (roundId: string) => {
    return `${import.meta.env.VITE_API_URL || ""}/api/v1/research/calibration/export/${roundId}`;
  },
  /**
   * Tải CSV hiệu chuẩn. PHẢI dùng fetch + Bearer rồi tải bằng blob, KHÔNG được
   * `window.open(url)`: cửa sổ mới không mang theo header Authorization nên endpoint
   * (@PreAuthorize) trả 401 và người dùng chỉ thấy một tab trắng. Cùng cách làm với
   * phần xuất dữ liệu ở AdminDashboard.
   */
  downloadCalibrationCsv: async (roundId: string, accessToken: string | null) => {
    const response = await fetch(researchService.exportCalibrationCsvUrl(roundId), {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(message || `Export failed (${response.status})`);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `calibration_round_${roundId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  },
};
