import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

export const ownerClient = axios.create({
  baseURL: BASE_URL,
  timeout: Number(process.env.REACT_APP_API_TIMEOUT) || 15000,
  headers: { "Content-Type": "application/json" },
});

ownerClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("owner_token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// Unwrap ApiResponse envelope {success, data, message} → response.data = payload
ownerClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === "object" && "success" in body && "data" in body) {
      response.data = body.data;
    }
    return response;
  },
  (err) => {
    const url = err.config?.url ?? "";
    const status = err.response?.status;
    const staleOwnerSession =
      status === 401 || (status === 403 && url.startsWith("/api/platform/"));
    if (staleOwnerSession && !url.includes("/auth/login")) {
      localStorage.removeItem("owner_token");
      localStorage.removeItem("owner_user");
      window.location.href = "/owner/login";
    }
    return Promise.reject(err);
  }
);

const ownerApi = {
  getStats:    ()             => ownerClient.get("/api/platform/stats"),
  listTenants: (params = {})  => ownerClient.get("/api/platform/tenants", { params }),
  getTenant:   (id)           => ownerClient.get(`/api/platform/tenants/${id}`),
  createTenant:(body)         => ownerClient.post("/api/platform/tenants", body),
  updateStatus:(id, status, reason) =>
    ownerClient.patch(`/api/platform/tenants/${id}/status`, { status, reason }),
  resetPassword:(id, newPassword) =>
    ownerClient.patch(`/api/platform/tenants/${id}/reset-password`, { newPassword }),
  listPlans:    ()              => ownerClient.get("/api/platform/plans"),
  updatePlan:   (id, body)      => ownerClient.patch(`/api/platform/plans/${id}`, body),
  getPublicPlans: ()            => axios.get(`${BASE_URL}/api/public/plans`),
  getRevenue:  ()             => ownerClient.get("/api/platform/revenue"),
  listEvents:  (limit = 20)   => ownerClient.get("/api/platform/events", { params: { limit } }),
};

export default ownerApi;
