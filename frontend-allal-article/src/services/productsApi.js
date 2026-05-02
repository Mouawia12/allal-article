import apiClient from "./apiClient";

export const productsApi = {
  list: (params) => apiClient.get("/api/products", { params }),
  getById: (id) => apiClient.get(`/api/products/${id}`),
  getPriceHistory: (id) => apiClient.get(`/api/products/${id}/price-history`),
  create: (data) => apiClient.post("/api/products", data),
  update: (id, data) => apiClient.put(`/api/products/${id}`, data),
  delete: (id) => apiClient.delete(`/api/products/${id}`),
  generateImage: (id, data) =>
    apiClient.post(`/api/products/${id}/images/generate`, data, { timeout: 180000 }),
  listImages: (id) => apiClient.get(`/api/products/${id}/images`),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post(`/api/products/${id}/images/upload`, formData, {
      timeout: 180000,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  processImage: (id, imageId) =>
    apiClient.post(`/api/products/${id}/images/${imageId}/process`, null, { timeout: 180000 }),
  setPrimaryImage: (id, imageId) => apiClient.patch(`/api/products/${id}/images/${imageId}/primary`),
  deleteImage: (id, imageId) => apiClient.delete(`/api/products/${id}/images/${imageId}`),

  // Categories
  listCategories: () => apiClient.get("/api/categories"),
  createCategory: (data) => apiClient.post("/api/categories", data),
  updateCategory: (id, data) => apiClient.put(`/api/categories/${id}`, data),

  // Units
  listUnits: () => apiClient.get("/api/product-units"),
  createUnit: (data) => apiClient.post("/api/product-units", data),
};
