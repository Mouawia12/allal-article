import apiClient from "./apiClient";

const BASE = "/api/purchases";

export const purchasesApi = {
  list: (params) => apiClient.get(BASE, { params }),
  getById: (id) => apiClient.get(`${BASE}/${id}`),
  create: (data) => apiClient.post(BASE, data),
  confirm: (id) => apiClient.post(`${BASE}/${id}/confirm`),
  receive: (id, data) => apiClient.post(`${BASE}/${id}/receive`, data),
  registerReturn: (id, data) => apiClient.post(`${BASE}/${id}/return`, data),
  cancel: (id) => apiClient.post(`${BASE}/${id}/cancel`),
};
