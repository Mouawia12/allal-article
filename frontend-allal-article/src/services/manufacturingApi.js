import apiClient from "./apiClient";

const BASE = "/api/manufacturing";

export const manufacturingApi = {
  list: (params) => apiClient.get(BASE, { params }),
  getById: (id) => apiClient.get(`${BASE}/${id}`),
  getEvents: (id) => apiClient.get(`${BASE}/${id}/events`),
  getQualityChecks: (id) => apiClient.get(`${BASE}/${id}/quality-checks`),
  create: (data) => apiClient.post(BASE, data),
  approve: (id, data) => apiClient.post(`${BASE}/${id}/approve`, data),
  startProduction: (id) => apiClient.post(`${BASE}/${id}/start-production`),
  qualityCheck: (id, data) => apiClient.post(`${BASE}/${id}/quality-check`, data),
  readyToShip: (id) => apiClient.post(`${BASE}/${id}/ready-to-ship`),
  ship: (id) => apiClient.post(`${BASE}/${id}/ship`),
  receive: (id, data) => apiClient.post(`${BASE}/${id}/receive`, data),
  cancel: (id, reason) => apiClient.post(`${BASE}/${id}/cancel`, null, { params: { reason } }),
};
