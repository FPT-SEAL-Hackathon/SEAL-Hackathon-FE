import { API_BASE_URL, api } from "@/lib/api/apiClient";

export type ProblemDownloadType = "csv" | "zip";

export interface SubmissionResponse {
  submissionId: string;
  teamId: string;
  teamName: string;
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

export type CreateSampleSubmissionRequest = Omit<CreateSubmissionRequest, "teamId">;

export interface SubmissionDisqualificationResponse {
  disqualificationId: string;
  submissionId: string;
  reason: string;
  disqualifiedById: string;
  disqualifiedAt: string;
  reversed: boolean;
}

const enc = encodeURIComponent;

function problemPath(roundId: string, type?: ProblemDownloadType) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  const query = params.toString();
  return `/api/v1/student-downloads/rounds/${enc(roundId)}/problem${query ? `?${query}` : ""}`;
}

export const submissionService = {
  // Submission Management
  submit: (data: CreateSubmissionRequest) =>
    api.post<SubmissionResponse>("/api/v1/submissions", data),

  submitWork: (data: CreateSubmissionRequest) =>
    api.post<SubmissionResponse>("/api/v1/submissions", data),

  submitSample: (data: CreateSampleSubmissionRequest) =>
    api.post<SubmissionResponse>("/api/v1/admin/calibration-sample-submissions", data),

  submitCalibrationSample: (data: CreateSampleSubmissionRequest) =>
    api.post<SubmissionResponse>("/api/v1/admin/calibration-sample-submissions", data),

  getByTeamAndRound: (teamId: string, roundId: string) =>
    api.get<SubmissionResponse>(`/api/v1/teams/${enc(teamId)}/rounds/${enc(roundId)}/submission`),

  getSubmissionByTeamAndRound: (teamId: string, roundId: string) =>
    api.get<SubmissionResponse>(`/api/v1/teams/${enc(teamId)}/rounds/${enc(roundId)}/submission`),

  // Admin submission APIs
  getByRound: (roundId: string) =>
    api.get<SubmissionResponse[]>(`/api/v1/admin/rounds/${enc(roundId)}/submissions`),

  getSubmissionsByRound: (roundId: string) =>
    api.get<SubmissionResponse[]>(`/api/v1/admin/rounds/${enc(roundId)}/submissions`),

  getUnreviewByRound: (roundId: string) =>
    api.get<SubmissionResponse[]>(`/api/v1/admin/rounds/${enc(roundId)}/unreview-submissions`),

  getUnreviewSubmissionsByRound: (roundId: string) =>
    api.get<SubmissionResponse[]>(`/api/v1/admin/rounds/${enc(roundId)}/unreview-submissions`),

  getByEvent: (eventId: string) =>
    api.get<SubmissionResponse[]>(`/api/v1/admin/events/${enc(eventId)}/submissions`),

  getSubmissionsByEvent: (eventId: string) =>
    api.get<SubmissionResponse[]>(`/api/v1/admin/events/${enc(eventId)}/submissions`),

  disqualify: (submissionId: string, reason: string) =>
    api.post<SubmissionDisqualificationResponse>(`/api/v1/admin/submissions/${enc(submissionId)}/disqualify`, { reason }),

  disqualifySubmission: (submissionId: string, reason: string) =>
    api.post<SubmissionDisqualificationResponse>(`/api/v1/admin/submissions/${enc(submissionId)}/disqualify`, { reason }),

  // Student Downloads. Blob methods include Bearer auth through apiClient.
  downloadProblem: (roundId: string, type?: ProblemDownloadType) =>
    api.blob(problemPath(roundId, type)),

  downloadProblemCsvBlob: (roundId: string) =>
    api.blob(`/api/v1/student-downloads/rounds/${enc(roundId)}/problem-csv`),

  downloadProblemZipBlob: (roundId: string) =>
    api.blob(`/api/v1/student-downloads/rounds/${enc(roundId)}/problem-zip`),

  getProblemDownloadUrl: (roundId: string, type?: ProblemDownloadType) =>
    `${API_BASE_URL}${problemPath(roundId, type)}`,

  downloadProblemCsv: (roundId: string) =>
    `${API_BASE_URL}/api/v1/student-downloads/rounds/${enc(roundId)}/problem-csv`,

  downloadProblemZip: (roundId: string) =>
    `${API_BASE_URL}/api/v1/student-downloads/rounds/${enc(roundId)}/problem-zip`,
};
