import apiClient from "./apiClient";

export const usersApi = {
  list: (params) => apiClient.get("/api/users", { params }),
  getById: (id) => apiClient.get(`/api/users/${id}`),
  create: (data) => apiClient.post("/api/users", data),
  update: (id, data) => apiClient.put(`/api/users/${id}`, data),
  delete: (id) => apiClient.delete(`/api/users/${id}`),
  toggleStatus: (id) => apiClient.patch(`/api/users/${id}/toggle-status`),
  listRoles: () => apiClient.get("/api/roles"),
  listWilayas: () => apiClient.get("/api/wilayas"),
};
