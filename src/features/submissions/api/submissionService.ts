import { API_BASE_URL, api } from "@/lib/api/apiClient";

export type ProblemDownloadType = "csv" | "zip";

export interface SubmissionRepositoryResponse {
  submissionRepositoryId: string;
  submissionId: string;
  provider: string;
  externalId?: string;
  repositoryUrl: string;
  owner?: string;
  repositoryName?: string;
  fullName?: string;
  description?: string;
  visibility?: string;
  defaultBranch?: string;
  primaryLanguage?: string;
  repositoryCreatedAt?: string;
  repositoryUpdatedAt?: string;
  lastPushedAt?: string;
  externalUrl?: string;
  lastSyncStatus: string;
  lastSynchronizedAt?: string;
  errorCode?: string;
  errorMessage?: string;
  starCount?: number;
  forkCount?: number;
  openIssuesCount?: number;
  // Development activity (best-effort; co the thieu neu call phu that bai). Tham khao, khong tinh diem.
  languagesJson?: string;       // {"Java": 12345, "TypeScript": 6789} (bytes)
  contributorCount?: number;
  topContributorsJson?: string; // [{"login":"x","contributions":42,"avatarUrl":"..."}]
  commitCount?: number;
  lastCommitSha?: string;
  // Phien ban duoc cham (auto-pin luc nop; Organizer co the ghim lai)
  pinnedCommitSha?: string;
  pinnedAt?: string;
  pinnedByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

// Mot dong trong Organizer "Submission Repositories" overview theo event.
export interface EventSubmissionRepositoryItem {
  submissionId: string;
  teamId?: string;
  teamName?: string;
  // true = bài mẫu của calibration round (Organizer tạo, không thuộc đội thi nào).
  sampleSubmission?: boolean;
  categoryName?: string;
  roundName?: string;
  submittedAt?: string;
  submissionDeadline?: string;
  repositoryUrl?: string;
  repository?: SubmissionRepositoryResponse | null;
  // Chi bao review (khong phai ket luan vi pham): null khi thieu du lieu so sanh.
  lastPushAfterDeadline?: boolean | null;
}

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
  repository?: SubmissionRepositoryResponse;
  submittedAt: string;
  lastUpdatedAt: string;
  submittedByUserId: string;
  notes: string;
  isScoreApproved?: boolean;
  isSampleSubmission?: boolean;
  activeDisqualificationId?: string;
  activeDisqualificationReason?: string;
  activeDisqualifiedById?: string;
  activeDisqualifiedAt?: string;
}

export const SUBMISSION_STATUS_IDS = {
  SUBMITTED: "50000000-0000-0000-0000-000000000002",
  UNDER_REVIEW: "50000000-0000-0000-0000-000000000003",
  DISQUALIFIED: "50000000-0000-0000-0000-000000000004",
  SCORED: "50000000-0000-0000-0000-000000000005",
  IN_PROGRESS: "50000000-0000-0000-0000-000000000006",
} as const;

export type SubmissionStatusKey = keyof typeof SUBMISSION_STATUS_IDS;

const SUBMISSION_STATUS_NAMES: Record<SubmissionStatusKey, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  DISQUALIFIED: "Disqualified",
  SCORED: "Scored",
  IN_PROGRESS: "In Progress",
};

const SUBMISSION_STATUS_NAME_TO_KEY: Record<string, SubmissionStatusKey> = {
  submitted: "SUBMITTED",
  under_review: "UNDER_REVIEW",
  review: "UNDER_REVIEW",
  disqualified: "DISQUALIFIED",
  scored: "SCORED",
  in_progress: "IN_PROGRESS",
  judging: "IN_PROGRESS",
};

export function normalizeSubmissionStatusName(statusName?: string | null): string {
  return String(statusName ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function getSubmissionStatusKey(submission?: Partial<SubmissionResponse> | null): SubmissionStatusKey | null {
  if (submission?.activeDisqualificationId) return "DISQUALIFIED";

  const statusId = String(submission?.submissionStatusId ?? "").toLowerCase();
  const idMatch = (Object.entries(SUBMISSION_STATUS_IDS) as [SubmissionStatusKey, string][])
    .find(([, id]) => id.toLowerCase() === statusId);
  if (idMatch) return idMatch[0];

  const normalizedName = normalizeSubmissionStatusName(submission?.submissionStatusName);
  return SUBMISSION_STATUS_NAME_TO_KEY[normalizedName] ?? null;
}

export function isSubmissionStatus(
  submission: Partial<SubmissionResponse> | null | undefined,
  status: SubmissionStatusKey,
): boolean {
  return getSubmissionStatusKey(submission) === status;
}

export function getSubmissionStatusLabel(submission?: Partial<SubmissionResponse> | null): string {
  const key = getSubmissionStatusKey(submission);
  return key ? SUBMISSION_STATUS_NAMES[key] : (submission?.submissionStatusName ?? "Submitted");
}

export interface SubmissionHistoryResponse extends SubmissionResponse {
  submissionHistoryId: string;
  versionNumber: number;
  snapshotCreatedAt: string;
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

// Chuyển mã trạng thái sync (NOT_SYNCHRONIZED, PARTIAL_SUCCESS...) sang chữ dễ đọc,
// bỏ dấu gạch dưới và title-case (vd "NOT_SYNCHRONIZED" -> "Not Synchronized").
export function formatSyncStatus(status?: string | null): string {
  if (!status) return "Not Synchronized";
  return status
    .toLowerCase()
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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

  getHistoryByTeamAndRound: (teamId: string, roundId: string) =>
    api.get<SubmissionHistoryResponse[]>(`/api/v1/teams/${enc(teamId)}/rounds/${enc(roundId)}/submission/history`),

  getSubmissionHistoryByTeamAndRound: (teamId: string, roundId: string) =>
    api.get<SubmissionHistoryResponse[]>(`/api/v1/teams/${enc(teamId)}/rounds/${enc(roundId)}/submission/history`),

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

  getHistoryBySubmissionId: (submissionId: string) =>
    api.get<SubmissionHistoryResponse[]>(`/api/v1/admin/submissions/${enc(submissionId)}/history`),

  getSubmissionHistoryBySubmissionId: (submissionId: string) =>
    api.get<SubmissionHistoryResponse[]>(`/api/v1/admin/submissions/${enc(submissionId)}/history`),

  // Repository Metadata APIs
  validateRepositoryUrl: (repositoryUrl: string) =>
    api.post<SubmissionRepositoryResponse>("/api/v1/submissions/repository/validate", { repositoryUrl }),

  getSubmissionRepository: (submissionId: string) =>
    api.get<SubmissionRepositoryResponse>(`/api/v1/submissions/${enc(submissionId)}/repository`),

  syncSubmissionRepository: (submissionId: string) =>
    api.post<SubmissionRepositoryResponse>(`/api/v1/submissions/${enc(submissionId)}/repository/sync`, {}),

  // README raw markdown, lazy — chi goi khi nguoi dung mo.
  getRepositoryReadme: (submissionId: string) =>
    api.get<{ content: string | null }>(`/api/v1/submissions/${enc(submissionId)}/repository/readme`),

  // Organizer (event creator) overview of all submission repositories in an event.
  getEventSubmissionRepositories: (eventId: string) =>
    api.get<EventSubmissionRepositoryItem[]>(`/api/v1/events/${enc(eventId)}/submission-repositories`),

  exportEventSubmissionRepositoriesCsv: (eventId: string) =>
    api.blob(`/api/v1/events/${enc(eventId)}/submission-repositories/export`),

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
