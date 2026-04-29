import apiClient from "./apiClient";

const partnershipsApi = {
  summary: () => apiClient.get("/api/partnerships"),
  createInviteCode: (body) => apiClient.post("/api/partnerships/invite-codes", body),
  submitRequest: (body) => apiClient.post("/api/partnerships/requests", body),
  approveRequest: (id, body) => apiClient.post(`/api/partnerships/requests/${id}/approve`, body),
  rejectRequest: (id) => apiClient.post(`/api/partnerships/requests/${id}/reject`),
  revokePartnership: (id) => apiClient.patch(`/api/partnerships/${id}/revoke`),
  linkedInventory: (partnerId) => apiClient.get(`/api/partnerships/${partnerId}/inventory`),
  cloneProducts: (partnerId, productIds) =>
    apiClient.post(`/api/partnerships/${partnerId}/products/clone`, { productIds }),
};

export default partnershipsApi;
