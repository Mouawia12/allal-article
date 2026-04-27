import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

const ownerClient = axios.create({
  baseURL: BASE_URL,
  timeout: Number(process.env.REACT_APP_API_TIMEOUT) || 15000,
  headers: { "Content-Type": "application/json" },
});

ownerClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("owner_token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

ownerClient.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("owner_token");
      localStorage.removeItem("owner_user");
      window.location.href = "/owner/login";
    }
    return Promise.reject(err);
  }
);

const ownerApi = {
  // Stats
  getStats:    ()             => ownerClient.get("/api/platform/stats"),
  // Tenants
  listTenants: (params = {})  => ownerClient.get("/api/platform/tenants", { params }),
  getTenant:   (id)           => ownerClient.get(`/api/platform/tenants/${id}`),
  createTenant:(body)         => ownerClient.post("/api/platform/tenants", body),
  updateStatus:(id, status, reason) =>
    ownerClient.patch(`/api/platform/tenants/${id}/status`, { status, reason }),
  // Plans
  listPlans:   ()             => ownerClient.get("/api/platform/plans"),
  // Revenue
  getRevenue:  ()             => ownerClient.get("/api/platform/revenue"),
  // Events
  listEvents:  (limit = 20)   => ownerClient.get("/api/platform/events", { params: { limit } }),
};

export default ownerApi;
