import { API_BASE_URL, api } from "@/lib/api/apiClient";

export interface SubmissionResponse {
  submissionId: string;
  teamId: string;
  roundId: string;
  submissionStatusId: string;
  submissionStatusName: string;
  repositoryUrl: string;
  demoUrl: string;
  reportUrl: string;
  slideUrl: string;
  repoMetadataJson: string;
  repoLastCommitAt: string;
  repoStarCount: number;
  repoForkCount: number;
  submittedAt: string;
  lastUpdatedAt: string;
  submittedByUserId: string;
  notes: string;
}

export interface CreateSubmissionRequest {
  teamId: string;
  roundId: string;
  repositoryUrl?: string;
  demoUrl?: string;
  reportUrl?: string;
  slideUrl?: string;
  notes?: string;
}

export interface SubmissionDisqualificationResponse {
  disqualificationId: string;
  submissionId: string;
  reason: string;
  disqualifiedById: string;
  disqualifiedAt: string;
  reversed: boolean;
}

export const submissionService = {
  // Upsert (submit or update) — POST always, backend handles insert vs update
  submit: (data: CreateSubmissionRequest) =>
    api.post<SubmissionResponse>("/api/v1/submissions", data),
  getByTeamAndRound: (teamId: string, roundId: string) =>
    api.get<SubmissionResponse>(`/api/v1/teams/${teamId}/rounds/${roundId}/submission`),

  // Admin
  getByRound: (roundId: string) =>
    api.get<SubmissionResponse[]>(`/api/v1/admin/rounds/${roundId}/submissions`),
  getByEvent: (eventId: string) =>
    api.get<SubmissionResponse[]>(`/api/v1/admin/events/${eventId}/submissions`),
  disqualify: (submissionId: string, reason: string) =>
    api.post<SubmissionDisqualificationResponse>(`/api/v1/admin/submissions/${submissionId}/disqualify`, { reason }),

  // Student downloads
  downloadProblemCsv: (roundId: string) =>
    `${API_BASE_URL}/api/v1/student-downloads/rounds/${roundId}/problem-csv`,
  downloadProblemZip: (roundId: string) =>
    `${API_BASE_URL}/api/v1/student-downloads/rounds/${roundId}/problem-zip`,
};
