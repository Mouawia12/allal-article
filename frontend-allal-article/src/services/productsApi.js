import apiClient from "./apiClient";

export const productsApi = {
  list: (params) => apiClient.get("/api/products", { params }),
  getById: (id) => apiClient.get(`/api/products/${id}`),
  create: (data) => apiClient.post("/api/products", data),
  update: (id, data) => apiClient.put(`/api/products/${id}`, data),
  delete: (id) => apiClient.delete(`/api/products/${id}`),

  // Categories
  listCategories: () => apiClient.get("/api/categories"),
  createCategory: (data) => apiClient.post("/api/categories", data),
  updateCategory: (id, data) => apiClient.put(`/api/categories/${id}`, data),

  // Units
  listUnits: () => apiClient.get("/api/product-units"),
  createUnit: (data) => apiClient.post("/api/product-units", data),
};
