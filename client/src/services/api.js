import axios from "axios";
import { getToken, clearToken } from "./tokenStore.js";

// Central axios instance. Defaults to the relative "/api" path, which the
// Vite dev server proxies to the backend (see vite.config.js) — avoiding CORS
// and any hardcoded host. Override with VITE_API_URL only if needed.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Attach the in-memory JWT (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 responses, clear the session and bounce to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearToken();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
