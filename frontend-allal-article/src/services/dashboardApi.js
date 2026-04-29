import apiClient from "./apiClient";

export const dashboardApi = {
  getStats: () => apiClient.get("/api/dashboard/stats"),
};
