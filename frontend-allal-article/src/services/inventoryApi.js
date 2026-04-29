import apiClient from "./apiClient";

export const inventoryApi = {
  // Warehouses
  listWarehouses: () => apiClient.get("/api/warehouses"),
  createWarehouse: (data) => apiClient.post("/api/warehouses", data),
  updateWarehouse: (id, data) => apiClient.put(`/api/warehouses/${id}`, data),
  setDefaultWarehouse: (id) => apiClient.post(`/api/warehouses/${id}/set-default`),

  // Stock
  listStock: (params) => apiClient.get("/api/inventory/stock", { params }),
  getProductStock: (productId) => apiClient.get(`/api/inventory/stock/product/${productId}`),
  initStock: (data) => apiClient.post("/api/inventory/stock/init", data),
  adjust: (data) => apiClient.post("/api/inventory/adjust", data),
  listMovements: (params) => apiClient.get("/api/inventory/movements", { params }),
};
