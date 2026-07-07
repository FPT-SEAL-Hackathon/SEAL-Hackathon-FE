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

function bodyIsFormData(body: RequestInit["body"]) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function normalizeHeaders(headersInit?: HeadersInit): Record<string, string> {
  if (!headersInit) return {};
  if (headersInit instanceof Headers) return Object.fromEntries(headersInit.entries());
  if (Array.isArray(headersInit)) return Object.fromEntries(headersInit);
  return { ...headersInit };
}

function hasHeader(headers: Record<string, string>, name: string) {
  const normalizedName = name.toLowerCase();
  return Object.keys(headers).some(key => key.toLowerCase() === normalizedName);
}

function removeHeader(headers: Record<string, string>, name: string) {
  const normalizedName = name.toLowerCase();
  Object.keys(headers).forEach(key => {
    if (key.toLowerCase() === normalizedName) delete headers[key];
  });
}

function buildRequestHeaders(options: RequestInit, token: string | null, includeJsonContentType = true) {
  const headers = normalizeHeaders(options.headers);
  if (includeJsonContentType && !bodyIsFormData(options.body) && !hasHeader(headers, "Content-Type")) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    removeHeader(headers, "Authorization");
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function logApiRequest(url: string, authenticated: boolean, token: string | null, headers: Record<string, string>) {
  if (!import.meta.env.DEV) return;
  console.debug("[api]", {
    url,
    authenticated,
    hasToken: !!token,
    hasAuthorization: hasHeader(headers, "Authorization"),
  });
}

// ─── API Error ──────────────────────────────────────────────────────────────
export type ParsedApiError = {
  message: string;
  fieldErrors?: Record<string, string>;
  status?: number;
  code?: string;
};

type BackendErrorBody = {
  status?: number;
  statusCode?: number;
  error?: string;
  code?: string;
  message?: string;
  errors?: Record<string, string>;
  details?: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringRecord(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, typeof item === "string" ? item : String(item)]),
  );
}

export class ApiError extends Error {
  public code?: string;
  public fieldErrors?: Record<string, string>;
  public details?: Record<string, unknown>;

  constructor(
    public status: number,
    message: string,
    options: { code?: string; fieldErrors?: Record<string, string>; details?: Record<string, unknown> } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;
    this.fieldErrors = options.fieldErrors;
    this.details = options.details;
  }
}

export function parseApiError(error: unknown): ParsedApiError {
  if (error instanceof ApiError) {
    return {
      message: messageForStatus(error.status, error.code, error.message),
      fieldErrors: error.fieldErrors,
      status: error.status,
      code: error.code,
    };
  }

  if (isRecord(error) && isRecord(error.response)) {
    const status = typeof error.response.status === "number" ? error.response.status : undefined;
    const data = isRecord(error.response.data) ? error.response.data as BackendErrorBody : undefined;
    const fieldErrors = toStringRecord(data?.errors);
    const code = data?.error ?? data?.code;
    return {
      message: messageForStatus(status, code, data?.message),
      fieldErrors,
      status,
      code,
    };
  }

  if (error instanceof TypeError) {
    return { message: "Network error. Please check your connection." };
  }

  if (error instanceof Error) {
    return { message: error.message || "Request failed." };
  }

  return { message: "Unexpected error. Please try again." };
}

function messageForStatus(status?: number, code?: string, message?: string) {
  if (status === 401) return message || "Your session has expired. Please login again.";
  if (status === 403) return message || "You do not have permission to perform this action.";
  if (status === 409 || code === "REGISTRATION_CONFLICT") return message || "This action conflicts with the current resource state.";
  if (code === "DUPLICATE_RESOURCE") return message || "Duplicate resource.";
  if (status === 500) return "Server error. Please try again later.";
  if (code === "BAD_REQUEST") return message || "Bad request.";
  return message || "Request failed.";
}

function apiErrorMessageForStatus(status: number, code?: string, message?: string) {
  if (status === 401) return message || "Session expired. Please log in again.";
  if (status === 403) return message || "Forbidden.";
  if (status === 409 || code === "DUPLICATE_RESOURCE") return message || "Duplicate resource.";
  if (status === 500) return message || "Server error.";
  return message || `Request failed (${status})`;
}

// ─── Internal fetch with auto-refresh ───────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function getJwtExpiryMs(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized)) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

function tokenNeedsRefresh(token: string): boolean {
  const expiryMs = getJwtExpiryMs(token);
  if (!expiryMs) return false;
  return expiryMs - Date.now() < 30_000;
}

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

async function getUsableAccessToken(): Promise<string | null> {
  const token = getAccessToken();
  if (!token || !tokenNeedsRefresh(token)) return token;

  if (!isRefreshing) {
    isRefreshing = true;
    const newToken = await attemptRefresh();
    isRefreshing = false;
    refreshQueue.forEach(cb => cb(newToken));
    refreshQueue = [];
    return newToken;
  }

  return new Promise<string | null>((resolve) => {
    refreshQueue.push(resolve);
  });
}

// ─── Core request function ───────────────────────────────────────────────────
export async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;
  const initialToken = authenticated ? await getUsableAccessToken() : null;

  const doFetch = (token: string | null) => {
    const headers = buildRequestHeaders(options, authenticated ? token : null);
    logApiRequest(url, authenticated, token, headers);
    return fetch(url, {
      ...options,
      headers,
    });
  };

  let res = await doFetch(initialToken);

  // Auto-refresh on 401
  if (res.status === 401 && authenticated) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await attemptRefresh();
      isRefreshing = false;
      refreshQueue.forEach(cb => cb(newToken));
      refreshQueue = [];

      if (!newToken) throw new ApiError(401, "Session expired. Please log in again.");
      res = await doFetch(newToken);
    } else {
      const newToken = await new Promise<string | null>((resolve) => {
        refreshQueue.push(resolve);
      });
      if (!newToken) throw new ApiError(401, "Session expired. Please log in again.");
      res = await doFetch(newToken);
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code: string | undefined;
    let fieldErrors: Record<string, string> | undefined;
    let details: Record<string, unknown> | undefined;
    try {
      const err = await res.json() as BackendErrorBody;
      code = err.error ?? err.code;
      fieldErrors = toStringRecord(err.errors);
      details = err.details;
      message = apiErrorMessageForStatus(res.status, code, err.message ?? err.error ?? message);
    } catch { /* ignore */ }
    throw new ApiError(res.status, message, { code, fieldErrors, details });
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
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;
  const initialToken = authenticated ? await getUsableAccessToken() : null;

  const doFetch = (token: string | null) => {
    const headers = {
      Accept: "*/*",
      ...buildRequestHeaders(options, authenticated ? token : null, false),
    };
    logApiRequest(url, authenticated, token, headers);
    return fetch(url, {
      ...options,
      headers,
    });
  };

  let res = await doFetch(initialToken);

  if (res.status === 401 && authenticated) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await attemptRefresh();
      isRefreshing = false;
      refreshQueue.forEach(cb => cb(newToken));
      refreshQueue = [];

      if (!newToken) throw new ApiError(401, "Session expired. Please log in again.");
      res = await doFetch(newToken);
    } else {
      const newToken = await new Promise<string | null>((resolve) => {
        refreshQueue.push(resolve);
      });
      if (!newToken) throw new ApiError(401, "Session expired. Please log in again.");
      res = await doFetch(newToken);
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code: string | undefined;
    let fieldErrors: Record<string, string> | undefined;
    let details: Record<string, unknown> | undefined;
    try {
      const err = await res.json() as BackendErrorBody;
      code = err.error ?? err.code;
      fieldErrors = toStringRecord(err.errors);
      details = err.details;
      message = apiErrorMessageForStatus(res.status, code, err.message ?? err.error ?? message);
    } catch { /* ignore */ }
    throw new ApiError(res.status, message, { code, fieldErrors, details });
  }

  return res.blob();
}

// ─── Convenience wrappers ────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string, auth = true) => request<T>(path, { method: "GET" }, auth),
  post: <T>(path: string, body: unknown, auth = true) =>
    request<T>(path, { method: "POST", body: bodyIsFormData(body as RequestInit["body"]) ? body as BodyInit : JSON.stringify(body) }, auth),
  put: <T>(path: string, body: unknown, auth = true) =>
    request<T>(path, { method: "PUT", body: bodyIsFormData(body as RequestInit["body"]) ? body as BodyInit : JSON.stringify(body) }, auth),
  patch: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: "PATCH", body: bodyIsFormData(body as RequestInit["body"]) ? body as BodyInit : body ? JSON.stringify(body) : undefined }, auth),
  delete: <T>(path: string, auth = true) => request<T>(path, { method: "DELETE" }, auth),
  blob: (path: string, auth = true) => requestBlob(path, { method: "GET" }, auth),
};
