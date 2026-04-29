import apiClient from "./apiClient";

const BASE = "/api/price-lists";

export const priceListsApi = {
  list: ()             => apiClient.get(BASE),
  getItems: (id)       => apiClient.get(`${BASE}/${id}/items`),
  create: (body)       => apiClient.post(BASE, body),
  upsertItem: (listId, productId, unitPrice) =>
    apiClient.put(`${BASE}/${listId}/items/${productId}`, { unitPrice }),
};
