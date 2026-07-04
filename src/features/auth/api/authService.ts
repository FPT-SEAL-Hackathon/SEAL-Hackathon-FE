import { api, clearTokens, getAccessToken, getRefreshToken, saveUser, setTokens } from "@/lib/api/apiClient";

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

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await api.post<LoginResponse & { user: RawUserResponse }>("/api/v1/auth/login", data, false);
  const normalized = { ...res, user: normalizeAuthUser(res.user) };
  setTokens(normalized.accessToken, normalized.refreshToken);
  saveUser(normalized.user);
  return normalized;
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
  return api.post<TokenResponse>("/auth/refresh", { refreshToken }, false);
}

export async function verifyEmail(token: string): Promise<string> {
  return api.get<string>(`/auth/verify-email?token=${encodeURIComponent(token)}`, false);
}
