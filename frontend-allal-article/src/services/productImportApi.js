import apiClient from "./apiClient";

export const productImportApi = {
  /** Start an AI extraction job from an uploaded file. */
  parse: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/api/products/import/parse", formData, {
      timeout: 180000,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  /** Poll job progress / fetch parsed items. */
  getJob: (jobId) => apiClient.get(`/api/products/import/jobs/${jobId}`),
  /** Confirm reviewed items → bulk-create products. */
  confirm: (jobId, items) =>
    apiClient.post(`/api/products/import/jobs/${jobId}/confirm`, { items }, { timeout: 180000 }),
  /** Discard a job (free server memory; called when user closes the dialog). */
  cancel: (jobId) => apiClient.delete(`/api/products/import/jobs/${jobId}`),
};
