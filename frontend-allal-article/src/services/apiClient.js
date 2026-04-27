import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";
const TIMEOUT  = Number(process.env.REACT_APP_API_TIMEOUT) || 15000;

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT + tenant ID on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const tenantId = localStorage.getItem("tenantId");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  if (tenantId) config.headers["X-Tenant-ID"] = tenantId;
  return config;
});

// Global 401 handler → redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("tenantId");
      window.location.href = "/authentication/sign-in";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
