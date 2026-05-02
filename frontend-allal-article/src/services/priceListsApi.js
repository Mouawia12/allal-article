import apiClient from "./apiClient";

const BASE = "/api/price-lists";

export const priceListsApi = {
  list: ()             => apiClient.get(BASE),
  getItems: (id)       => apiClient.get(`${BASE}/${id}/items`),
  getAssignments: (id, entityType) =>
    apiClient.get(`${BASE}/${id}/assignments`, { params: { entityType } }),
  create: (body)       => apiClient.post(BASE, body),
  saveAssignments: (id, entityType, entityIds) =>
    apiClient.put(`${BASE}/${id}/assignments`, { entityType, entityIds }),
  upsertItem: (listId, productId, unitPrice) =>
    apiClient.put(`${BASE}/${listId}/items/${productId}`, { unitPrice }),
  removeItem: (listId, productId) =>
    apiClient.delete(`${BASE}/${listId}/items/${productId}`),
};
