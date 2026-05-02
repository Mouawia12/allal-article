import apiClient from "./apiClient";

export const emailNotificationsApi = {
  get: () => apiClient.get("/api/settings/email-notifications"),
  save: (data) => apiClient.put("/api/settings/email-notifications", data),
  sendTest: () => apiClient.post("/api/settings/email-notifications/test"),
  listOutbox: (limit = 20) =>
    apiClient.get("/api/settings/email-notifications/outbox", { params: { limit } }),
};
