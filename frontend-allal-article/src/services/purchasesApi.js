import apiClient from "./apiClient";

const BASE = "/api/purchase-orders";

export const purchasesApi = {
  list: (params) => apiClient.get(BASE, { params }),
  getById: (id) => apiClient.get(`${BASE}/${id}`),
  create: (data) => apiClient.post(BASE, data),
  confirm: (id) => apiClient.post(`${BASE}/${id}/confirm`),
  receive: (id, data) => apiClient.post(`${BASE}/${id}/receive`, data),
  cancel: (id) => apiClient.post(`${BASE}/${id}/cancel`),
};
