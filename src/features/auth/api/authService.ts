import { normalizeRole, type Role } from "@/auth/rbac/roles";
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
  id: string;
  email: string;
  fullName: string;
  phone: string;
  userType: string;
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

export function userTypeToRole(userType: string): Role {
  const role = normalizeRole(userType);
  if (!role) {
    throw new Error(`Unsupported user type: ${userType}`);
  }
  return role;
}

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
