import { api, clearTokens, getRefreshToken, saveUser, setTokens } from "@/lib/api/apiClient";

// ─── Types (aligned with backend spec) ──────────────────────────────────────
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
  userTypeId?: string; // optional UUID — defaults to student on backend
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  userType: string;       // e.g. "STUDENT", "JUDGE", "MENTOR", "ORGANIZER"
  accountStatus: string;
  studentCode: string;
  universityName: string;
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

// ─── Map backend userType string → frontend role key ────────────────────────
const USER_TYPE_MAP: Record<string, string> = {
  student:    "member",
  member:     "member",
  leader:     "leader",
  team_leader:"leader",
  judge:      "judge",
  mentor:     "mentor",
  organizer:  "admin",
  admin:      "admin",
  research:   "admin",
  researcher: "admin",
};

export function userTypeToRole(userType: string): string {
  return USER_TYPE_MAP[userType.toLowerCase()] ?? "member";
}

// ─── Auth API calls ──────────────────────────────────────────────────────────
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/auth/login", data, false);
  setTokens(res.accessToken, res.refreshToken);
  saveUser(res.user);
  return res;
}

export async function register(data: RegisterRequest): Promise<UserResponse> {
  return api.post<UserResponse>("/auth/register", data, false);
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await api.post<string>("/auth/logout", { refreshToken });
    } catch { /* ignore — clear tokens regardless */ }
  }
  clearTokens();
}

export async function refreshAccessToken(): Promise<TokenResponse> {
  const refreshToken = getRefreshToken();
  return api.post<TokenResponse>("/auth/refresh", { refreshToken }, false);
}

export async function verifyEmail(token: string): Promise<string> {
  return api.get<string>(`/auth/verify-email?token=${token}`, false);
}
