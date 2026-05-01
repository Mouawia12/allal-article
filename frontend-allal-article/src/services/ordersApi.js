import apiClient from "./apiClient";

const BASE = "/api/orders";

export const ordersApi = {
  list: (params) => apiClient.get(BASE, { params }),
  getById: (id) => apiClient.get(`${BASE}/${id}`),
  create: (data) => apiClient.post(BASE, data),
  getEvents: (id) => apiClient.get(`${BASE}/${id}/events`),
  submit: (id) => apiClient.post(`${BASE}/${id}/submit`),
  review: (id) => apiClient.post(`${BASE}/${id}/review`),
  confirm: (id, data) => apiClient.post(`${BASE}/${id}/confirm`, data || {}),
  ship: (id) => apiClient.post(`${BASE}/${id}/ship`),
  complete: (id) => apiClient.post(`${BASE}/${id}/complete`),
  cancel: (id, reason) => apiClient.post(`${BASE}/${id}/cancel`, { reason: reason || null }),
  reject: (id, reason) => apiClient.post(`${BASE}/${id}/reject`, { reason: reason || null }),
};
