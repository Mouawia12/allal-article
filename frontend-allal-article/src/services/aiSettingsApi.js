import apiClient from "./apiClient";

export const aiSettingsApi = {
  get: () => apiClient.get("/api/settings/ai"),
  save: (data) => apiClient.put("/api/settings/ai", data),
  test: (data) => apiClient.post("/api/settings/ai/test", data),
  refreshModels: (data) => apiClient.post("/api/settings/ai/models/refresh", data, { timeout: 60000 }),
};
