import apiClient from "./apiClient";

const BASE = "/api/returns";

export const returnsApi = {
  list: (params) => apiClient.get(BASE, { params }),
  getById: (id) => apiClient.get(`${BASE}/${id}`),
  create: (data) => apiClient.post(BASE, data),
  accept: (id, data) => apiClient.post(`${BASE}/${id}/accept`, data || {}),
  reject: (id) => apiClient.post(`${BASE}/${id}/reject`),
};
