import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";
const TIMEOUT  = Number(process.env.REACT_APP_API_TIMEOUT) || 15000;

// Login sends its own credentials (workspace ID typed on the form). A leftover session in
// localStorage must never override them — a stale tenantId points at a schema that may no
// longer exist, and the backend answers "Invalid credentials" for the wrong schema.
const LOGIN_PATHS = ["/api/auth/login", "/api/platform/auth/login"];

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

// Works for both AxiosHeaders instances and plain header objects
function hasHeader(headers, name) {
  if (!headers) return false;
  if (typeof headers.has === "function") return headers.has(name);
  return Object.keys(headers).some((key) => key.toLowerCase() === name.toLowerCase());
}

// Attach JWT + tenant ID on every request, without clobbering explicit headers
apiClient.interceptors.request.use((config) => {
  const url = config.url ?? "";
  if (LOGIN_PATHS.some((path) => url.includes(path))) return config;

  const token = localStorage.getItem("token");
  const tenantId = localStorage.getItem("tenantId");
  if (token && !hasHeader(config.headers, "Authorization")) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  if (tenantId && !hasHeader(config.headers, "X-Tenant-ID")) {
    config.headers["X-Tenant-ID"] = tenantId;
  }
  return config;
});

// Unwrap ApiResponse envelope {success, data, message, timestamp} → r.data = payload
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === "object" && "success" in body && "data" in body) {
      response.data = body.data;
    }
    return response;
  },
  (error) => {
    const url = error.config?.url ?? "";
    const status = error.response?.status;
    const emptyForbiddenResponse = status === 403 && !error.response?.data;
    const staleTenantSession = status === 401 || emptyForbiddenResponse;
    if (staleTenantSession && !url.includes("/auth/login")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("tenantId");
      window.location.href = "/authentication/sign-in";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
