import { api } from "@/lib/api/apiClient";

export interface ConsensusMatrixResponse {
  criteriaName: string;
  median: number;
  minScore: number;
  maxScore: number;
  standardDeviation: number;
  status: string;
  judgeScores: Record<string, number>;
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
  exportCalibrationCsvUrl: (roundId: string) => {
    return `${import.meta.env.VITE_API_URL || ""}/api/v1/research/calibration/export/${roundId}`;
  }
};
