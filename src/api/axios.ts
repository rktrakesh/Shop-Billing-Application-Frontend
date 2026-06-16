import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "@/config/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ── Request interceptor: attach JWT ──────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("rkt_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Silent token refresh ───────────────────────────────────────
// If multiple requests fail with 401 at once, only refresh once and let
// the rest wait for that same in-flight refresh.
let refreshPromise: Promise<string | null> | null = null;

function performLogout() {
  localStorage.removeItem("rkt_token");
  localStorage.removeItem("rkt_refresh_token");
  localStorage.removeItem("rkt_user");
  window.location.href = "/login";
  toast.error("Session expired. Please login again.");
}

async function refreshAccessToken(): Promise<string | null> {
  const storedRefreshToken = localStorage.getItem("rkt_refresh_token");
  if (!storedRefreshToken) return null;

  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken: storedRefreshToken }, { headers: { "Content-Type": "application/json" } });
    const data = response.data?.data;
    if (!data?.token || !data?.refreshToken) return null;

    // Update storage so subsequent requests use the new tokens
    localStorage.setItem("rkt_token", data.token);
    localStorage.setItem("rkt_refresh_token", data.refreshToken);
    try {
      const storedUser = localStorage.getItem("rkt_user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.token = data.token;
        user.refreshToken = data.refreshToken;
        localStorage.setItem("rkt_user", JSON.stringify(user));
      }
    } catch {
      // non-fatal — token storage above is what matters for requests
    }

    return data.token;
  } catch {
    return null;
  }
}

// ── Response interceptor: handle errors globally ─────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "An unexpected error occurred";
    const originalRequest = error.config;

    if (status === 401) {
      // Don't try to refresh if this 401 *was* the refresh call itself,
      // or if we've already retried this request once.
      const isRefreshCall = originalRequest?.url?.includes("/api/auth/refresh");
      const isLoginCall = originalRequest?.url?.includes("/api/auth/login");

      if (!isRefreshCall && !isLoginCall && !originalRequest?._retried) {
        originalRequest._retried = true;

        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }

        const newToken = await refreshPromise;
        if (newToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        }
      }

      performLogout();
    } else if (status === 403) {
      toast.error("You do not have permission to perform this action.");
    } else if (status === 404) {
      // Let individual pages handle 404
    } else if (status === 500) {
      toast.error("Server error. Please try again later.");
    } else if (!error.response) {
      toast.error("Network error. Check if the backend is running.");
    } else if (status !== 404) {
      toast.error(message);
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
