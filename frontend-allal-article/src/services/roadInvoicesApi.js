import apiClient from "./apiClient";

const BASE = "/api/road-invoices";

export const roadInvoicesApi = {
  list: (params) => apiClient.get(BASE, { params }),
  getById: (id) => apiClient.get(`${BASE}/${id}`),
  create: (data) => apiClient.post(BASE, data),
  confirm: (id) => apiClient.post(`${BASE}/${id}/confirm`),
  recordPrint: (id) => apiClient.post(`${BASE}/${id}/print`),
  sendWhatsapp: (id) => apiClient.post(`${BASE}/${id}/whatsapp`),
  setWilayaDefault: (wilayaId, customerId) =>
    apiClient.put(`${BASE}/wilaya-defaults/${wilayaId}`, null, { params: { customerId } }),
};
