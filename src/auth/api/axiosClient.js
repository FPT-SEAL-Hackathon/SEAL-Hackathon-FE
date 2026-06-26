import axios from "axios";
import { REFRESH_KEY, TOKEN_KEY } from "@/lib/api/apiClient";

function normalizeApiBaseUrl(value) {
  const raw = (value || "http://localhost:8080").trim().replace(/\/+$/, "");
  return raw.replace(/\/api\/v1$/i, "").replace(/\/api$/i, "");
}

const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL
);

const PUBLIC_OR_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/verify-email",
  "/api/v1/public/",
];

function isPublicOrAuthRequest(url = "") {
  return PUBLIC_OR_AUTH_PATHS.some((path) => url.startsWith(path));
}

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const requestUrl = config.url || "";
    if (token && !isPublicOrAuthRequest(requestUrl)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isPublicOrAuthRequest(requestUrl)
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem(REFRESH_KEY);
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem(TOKEN_KEY, data.accessToken);
        
        if (data.refreshToken) {
          localStorage.setItem(REFRESH_KEY, data.refreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return axiosClient(originalRequest);
      } catch (err) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem("seal_user");
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }
    
    // Format error response
    const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred.";
    return Promise.reject(new Error(errorMessage));
  }
);

export default axiosClient;
