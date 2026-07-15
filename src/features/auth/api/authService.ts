import { API_BASE_URL, api, clearTokens, getAccessToken, getRefreshToken, saveUser, setTokens } from "@/lib/api/apiClient";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  studentCode: string;
  universityName: string;
  userTypeId: string;
}

export const REGISTER_USER_TYPES = [
  {
    label: "FPT Student",
    value: "10000000-0000-0000-0000-000000000001",
  },
  {
    label: "External Student",
    value: "10000000-0000-0000-0000-000000000002",
  },
] as const;

export interface UserResponse {
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  roleName?: string;
  accountStatus: string;
  accountStatusName?: string;
  fptStudentCode?: string;
  externalStudentCode?: string;
  universityName?: string;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export interface TokenResponse {
  accessToken: string;
}

type RawUserResponse = UserResponse & {
  id?: string;
  userType?: string;
  userTypeName?: string;
  studentCode?: string;
};

function normalizeAuthUser(raw: RawUserResponse): UserResponse {
  const role = raw.role ?? raw.userType ?? "";
  return {
    userId: raw.userId ?? raw.id ?? "",
    email: raw.email,
    fullName: raw.fullName,
    phone: raw.phone,
    role,
    roleName: raw.roleName ?? raw.userTypeName,
    accountStatus: raw.accountStatus,
    accountStatusName: raw.accountStatusName,
    fptStudentCode: raw.fptStudentCode ?? (role === "FPT_STUDENT" ? raw.studentCode : undefined),
    externalStudentCode: raw.externalStudentCode ?? (role === "EXTERNAL_STUDENT" ? raw.studentCode : undefined),
    universityName: raw.universityName,
    createdAt: raw.createdAt,
  };
}

function storeSession(res: LoginResponse & { user: RawUserResponse }): LoginResponse {
  const normalized = { ...res, user: normalizeAuthUser(res.user) };
  setTokens(normalized.accessToken, normalized.refreshToken);
  saveUser(normalized.user);
  return normalized;
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await api.post<LoginResponse & { user: RawUserResponse }>("/api/v1/auth/login", data, false);
  return storeSession(res);
}

export async function register(data: RegisterRequest): Promise<UserResponse> {
  return api.post<UserResponse>("/auth/register", data, false);
}

export async function logout(): Promise<void> {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (accessToken && refreshToken) {
    try {
      await api.post<void>("/auth/logout", { refreshToken });
    } catch {
      // Clear local session even if the backend logout call fails.
    }
  }
  clearTokens();
}

export async function refreshAccessToken(): Promise<TokenResponse> {
  const refreshToken = getRefreshToken();
  const response = await api.post<TokenResponse & { refreshToken?: string }>("/auth/refresh", { refreshToken }, false);
  if (response.accessToken && refreshToken) {
    setTokens(response.accessToken, response.refreshToken ?? refreshToken);
  }
  return response;
}

export async function verifyEmail(token: string): Promise<string> {
  return api.get<string>(`/auth/verify-email?token=${encodeURIComponent(token)}`, false);
}

// ─── Google OAuth ────────────────────────────────────────────────────────────

/**
 * URL để redirect trình duyệt (KHÔNG gọi bằng fetch/axios) sang backend
 * để bắt đầu luồng Google OAuth.
 */
export function getGoogleLoginUrl(): string {
  return `${API_BASE_URL}/oauth2/authorization/google`;
}

/**
 * Đổi code trao đổi một lần (backend phát sau khi Google xác thực xong)
 * lấy phiên đăng nhập — cùng hình dạng response với login thường.
 */
export async function exchangeOAuthCode(code: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse & { user: RawUserResponse }>(
    "/api/v1/auth/oauth2/exchange",
    { code },
    false,
  );
  return storeSession(res);
}

// ─── Current user / profile ─────────────────────────────────────────────────

export async function getCurrentUser(): Promise<UserResponse> {
  const res = await api.get<RawUserResponse>("/api/v1/users/me");
  const normalized = normalizeAuthUser(res);
  saveUser(normalized);
  return normalized;
}

export interface CompleteProfileRequest {
  role: "FPT_STUDENT" | "EXTERNAL_STUDENT";
  fullName: string;
  phone?: string;
  fptStudentCode?: string;
  externalStudentCode?: string;
  universityName?: string;
}

export async function completeProfile(data: CompleteProfileRequest): Promise<UserResponse> {
  const res = await api.put<RawUserResponse>("/api/v1/users/me/complete-profile", data);
  const normalized = normalizeAuthUser(res);
  saveUser(normalized);
  return normalized;
}

// ─── Account link/merge ──────────────────────────────────────────────────────

export interface LinkCandidate {
  email: string;
  fullName: string;
  role: string;
  roleName?: string;
  matchedBy: string;
}

export async function getLinkCandidates(): Promise<LinkCandidate[]> {
  return api.get<LinkCandidate[]>("/api/v1/users/me/link-candidates");
}

export interface LinkLocalAccountRequest {
  targetEmail: string;
  password: string;
}

export async function linkLocalAccount(data: LinkLocalAccountRequest): Promise<LoginResponse> {
  const res = await api.post<LoginResponse & { user: RawUserResponse }>(
    "/api/v1/users/me/link-local-account",
    data,
  );
  return storeSession(res);
}

// ─── Password ────────────────────────────────────────────────────────────────

export interface SetPasswordRequest {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

export async function setPassword(data: SetPasswordRequest): Promise<{ success: boolean; message: string }> {
  return api.post<{ success: boolean; message: string }>("/api/v1/users/me/set-password", data);
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  return api.post<{ success: boolean; message: string }>("/api/v1/auth/forgot-password", { email }, false);
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export async function resetPassword(data: ResetPasswordRequest): Promise<{ success: boolean; message: string }> {
  return api.post<{ success: boolean; message: string }>("/api/v1/auth/reset-password", data, false);
}
