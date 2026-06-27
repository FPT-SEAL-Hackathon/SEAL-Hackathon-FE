function normalizeApiBaseUrl(value?: string): string {
  const raw = (value ?? "").trim().replace(/\/+$/, "");
  if (!raw) {
    throw new Error("Missing VITE_API_URL environment variable.");
  }
  return raw.replace(/\/api\/v1$/i, "").replace(/\/api$/i, "");
}

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_URL,
);

// ─── Token helpers ──────────────────────────────────────────────────────────
export const TOKEN_KEY = "seal_access_token";
export const REFRESH_KEY = "seal_refresh_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}
export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}
export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem("seal_user");
}
export function saveUser(user: object) {
  localStorage.setItem("seal_user", JSON.stringify(user));
}
export function loadUser<T>(): T | null {
  const raw = localStorage.getItem("seal_user");
  return raw ? (JSON.parse(raw) as T) : null;
}

// ─── API Error ──────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Internal fetch with auto-refresh ───────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function attemptRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) { clearTokens(); return null; }
    const data = await res.json();
    const newAccess: string = data.accessToken;
    const nextRefresh: string = data.refreshToken ?? getRefreshToken()!;
    setTokens(newAccess, nextRefresh);
    return newAccess;
  } catch {
    clearTokens();
    return null;
  }
}

// ─── Core request function ───────────────────────────────────────────────────
export async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authenticated) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const doFetch = (token?: string) =>
    fetch(`${API_BASE_URL}${normalizedPath}`, {
      ...options,
      headers: token ? { ...headers, Authorization: `Bearer ${token}` } : headers,
    });

  let res = await doFetch();

  // Auto-refresh on 401
  if (res.status === 401 && authenticated) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await attemptRefresh();
      isRefreshing = false;
      refreshQueue.forEach(cb => newToken && cb(newToken));
      refreshQueue = [];

      if (!newToken) throw new ApiError(401, "Session expired. Please log in again.");
      res = await doFetch(newToken);
    } else {
      const newToken = await new Promise<string>((resolve) => {
        refreshQueue.push(resolve);
      });
      res = await doFetch(newToken);
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      message = err.message ?? err.error ?? message;
    } catch { /* ignore */ }
    throw new ApiError(res.status, message);
  }

  // Handle empty responses (204, DELETE, etc.)
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return undefined as T;
  return res.json() as Promise<T>;
}

export async function requestBlob(
  path: string,
  options: RequestInit = {},
  authenticated = true,
): Promise<Blob> {
  const headers: Record<string, string> = {
    Accept: "*/*",
    ...(options.headers as Record<string, string>),
  };

  if (authenticated) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const doFetch = (token?: string) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: token ? { ...headers, Authorization: `Bearer ${token}` } : headers,
    });

  let res = await doFetch();

  if (res.status === 401 && authenticated) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await attemptRefresh();
      isRefreshing = false;
      refreshQueue.forEach(cb => newToken && cb(newToken));
      refreshQueue = [];

      if (!newToken) throw new ApiError(401, "Session expired. Please log in again.");
      res = await doFetch(newToken);
    } else {
      const newToken = await new Promise<string>((resolve) => {
        refreshQueue.push(resolve);
      });
      res = await doFetch(newToken);
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      message = err.message ?? err.error ?? message;
    } catch { /* ignore */ }
    throw new ApiError(res.status, message);
  }

  return res.blob();
}

// ─── Convenience wrappers ────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string, auth = true) => request<T>(path, { method: "GET" }, auth),
  post: <T>(path: string, body: unknown, auth = true) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }, auth),
  put: <T>(path: string, body: unknown, auth = true) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }, auth),
  patch: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }, auth),
  delete: <T>(path: string, auth = true) => request<T>(path, { method: "DELETE" }, auth),
  blob: (path: string, auth = true) => requestBlob(path, { method: "GET" }, auth),
};
