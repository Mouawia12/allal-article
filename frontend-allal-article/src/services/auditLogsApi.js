import apiClient from "./apiClient";

export const auditLogsApi = {
  list: (params = {}) => apiClient.get("/api/audit-logs", { params }),
};
