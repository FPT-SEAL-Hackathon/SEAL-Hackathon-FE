import { api } from "@/lib/api/apiClient";

export type UserRole =
  | "FPT_STUDENT"
  | "EXTERNAL_STUDENT"
  | "ORGANIZER"
  | "INTERNAL_JUDGE"
  | "GUEST_JUDGE"
  | "ROLE_FPT_STUDENT"
  | "ROLE_EXTERNAL_STUDENT"
  | "ROLE_ORGANIZER"
  | "ROLE_INTERNAL_JUDGE"
  | "ROLE_GUEST_JUDGE"
  | string;

export type UserStatus =
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED"
  | "TEMPORARY"
  | "UNVERIFIED"
  | string;

export interface UserManagementUser {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  roleName?: string | null;
  fptStudentCode?: string | null;
  externalStudentCode?: string | null;
  universityName?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  teamStatus?: string | null;
  accountStatus: string;
  accountStatusName?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserQueryParams {
  search?: string;
  role?: string;
  teamId?: string;
  teamName?: string;
  accountStatus?: string;
  joinedFrom?: string;
  joinedTo?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  accountStatus: string;
  password: string;
  fptStudentCode?: string;
  externalStudentCode?: string;
  universityName?: string;
  accountExpiresAt?: string;
}

export interface UpdateUserRequest {
  fullName: string;
  phone?: string;
  role?: string;
  accountStatus?: string;
  fptStudentCode?: string;
  externalStudentCode?: string;
  universityName?: string;
  accountExpiresAt?: string;
}

export interface UpdateUserStatusRequest {
  accountStatus: string;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export interface PaginatedUsersResponse {
  content: UserManagementUser[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

type BackendUser = {
  id?: string;
  userId?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  roleName?: string;
  userType?: string;
  userTypeName?: string;
  teamId?: string;
  teamName?: string;
  teamStatus?: string;
  team?: { teamId?: string | null; teamName?: string | null; name?: string | null; status?: string | null; teamStatus?: string | null } | null;
  fptStudentCode?: string | null;
  externalStudentCode?: string | null;
  universityName?: string | null;
  status?: string;
  accountStatus?: string;
  accountStatusName?: string;
  emailVerified?: boolean;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type BackendPage<T> = {
  content?: T[];
  data?: T[] | BackendPage<T>;
  users?: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  currentPage?: number;
  page?: number;
  size?: number;
  message?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeUser(raw: BackendUser): UserManagementUser {
  const userId = raw.userId ?? raw.id ?? "";
  const team = raw.team;
  const teamName = raw.teamName ?? team?.teamName ?? team?.name ?? null;
  return {
    userId: String(userId),
    fullName: raw.fullName ?? raw.name ?? raw.email ?? "Unnamed user",
    email: raw.email ?? "",
    phone: raw.phone || undefined,
    role: raw.role ?? raw.userType ?? raw.userTypeName ?? "UNKNOWN",
    roleName: raw.roleName ?? raw.userTypeName ?? null,
    fptStudentCode: raw.fptStudentCode ?? null,
    externalStudentCode: raw.externalStudentCode ?? null,
    universityName: raw.universityName ?? null,
    teamId: raw.teamId ?? team?.teamId ?? null,
    teamName,
    teamStatus: raw.teamStatus ?? team?.teamStatus ?? team?.status ?? null,
    accountStatus: raw.accountStatus ?? raw.status ?? raw.accountStatusName ?? "UNKNOWN",
    accountStatusName: raw.accountStatusName ?? null,
    emailVerified: raw.emailVerified ?? raw.isEmailVerified,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function unwrapUsers(response: BackendUser[] | BackendPage<BackendUser>): PaginatedUsersResponse {
  if (Array.isArray(response)) {
    const content = response.map(normalizeUser);
    return {
      content,
      totalElements: content.length,
      totalPages: 1,
      number: 0,
      size: content.length,
    };
  }

  const data = response.data;
  if (Array.isArray(data)) {
    const content = data.map(normalizeUser);
    return {
      content,
      totalElements: response.totalElements ?? content.length,
      totalPages: response.totalPages ?? 1,
      number: response.number ?? response.currentPage ?? response.page ?? 0,
      size: response.size ?? content.length,
    };
  }

  if (isRecord(data) && Array.isArray((data as BackendPage<BackendUser>).content)) {
    const page = data as BackendPage<BackendUser>;
    const content = (page.content ?? []).map(normalizeUser);
    return {
      content,
      totalElements: page.totalElements ?? response.totalElements ?? content.length,
      totalPages: page.totalPages ?? response.totalPages ?? 1,
      number: page.number ?? page.currentPage ?? page.page ?? 0,
      size: page.size ?? response.size ?? content.length,
    };
  }

  const source = response.content ?? response.users ?? [];
  const content = source.map(normalizeUser);
  return {
    content,
    totalElements: response.totalElements ?? content.length,
    totalPages: response.totalPages ?? 1,
    number: response.number ?? response.currentPage ?? response.page ?? 0,
    size: response.size ?? content.length,
  };
}

function toQuery(params: UserQueryParams) {
  const allowedSortFields = new Set(["createdAt", "updatedAt", "fullName", "email", "role", "accountStatus"]);
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      if (key === "sortBy" && !allowedSortFields.has(String(value))) return;
      query.set(key, String(value));
    }
  });
  if (!query.has("sortBy")) query.set("sortBy", "createdAt");
  if (!query.has("sortDir")) query.set("sortDir", "desc");
  return query.toString();
}

function unwrapUser(response: BackendUser | { data?: BackendUser }) {
  if ("data" in response && response.data) return normalizeUser(response.data);
  return normalizeUser(response as BackendUser);
}

export const userService = {
  getUsers: async (params: UserQueryParams = {}) => {
    const qs = toQuery(params);
    return unwrapUsers(await api.get<BackendUser[] | BackendPage<BackendUser>>(
      `/api/v1/users${qs ? `?${qs}` : ""}`,
    ));
  },

  getUserById: async (userId: string) =>
    unwrapUser(await api.get<BackendUser | { data?: BackendUser }>(`/api/v1/users/${userId}`)),

  createUser: async (payload: CreateUserRequest) =>
    unwrapUser(await api.post<BackendUser | { data?: BackendUser }>("/api/v1/users", payload)),

  updateUser: async (userId: string, payload: UpdateUserRequest) =>
    unwrapUser(await api.put<BackendUser | { data?: BackendUser }>(`/api/v1/users/${userId}`, payload)),

  updateUserStatus: async (userId: string, payload: UpdateUserStatusRequest) =>
    unwrapUser(await api.patch<BackendUser | { data?: BackendUser }>(`/api/v1/users/${userId}/status`, payload)),

  updateUserRole: async (userId: string, payload: UpdateUserRoleRequest) =>
    unwrapUser(await api.patch<BackendUser | { data?: BackendUser }>(`/api/v1/users/${userId}/role`, payload)),

  deleteUser: (userId: string) =>
    api.delete<void>(`/api/v1/users/${userId}`),
};

// ─── Self-service profile (any authenticated user) ────────────────────────────

export interface UpdateMyProfileRequest {
  fullName?: string;
  phone?: string;
  universityName?: string;
}

export interface MyProfileResponse {
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  universityName?: string;
  fptStudentCode?: string;
  externalStudentCode?: string;
  accountStatus: string;
  createdAt?: string;
}

export const meService = {
  getMe: () => api.get<MyProfileResponse>("/api/v1/me"),
  updateMe: (data: UpdateMyProfileRequest) =>
    api.put<MyProfileResponse>("/api/v1/me", data),
};
