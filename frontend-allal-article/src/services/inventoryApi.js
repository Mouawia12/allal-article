import apiClient from "./apiClient";

const WAREHOUSES_BASE = "/api/inventory/warehouses";

export const inventoryApi = {
  // Warehouses
  listWarehouses: () => apiClient.get(WAREHOUSES_BASE),
  createWarehouse: (data) => apiClient.post(WAREHOUSES_BASE, data),
  updateWarehouse: (id, data) => apiClient.put(`${WAREHOUSES_BASE}/${id}`, data),
  setDefaultWarehouse: (id) => apiClient.post(`${WAREHOUSES_BASE}/${id}/set-default`),

  // Stock
  listStock: (params) => apiClient.get("/api/inventory/stock", { params }),
  getProductStock: (productId) => apiClient.get(`/api/inventory/stock/product/${productId}`),
  initStock: (data) => apiClient.post("/api/inventory/stock/initial", data),
  adjust: (data) => apiClient.post("/api/inventory/stock/adjust", data),
  transfer: (data) => apiClient.post("/api/inventory/stock/transfer", data),
  listMovements: (params) => apiClient.get("/api/inventory/movements", { params }),
};
