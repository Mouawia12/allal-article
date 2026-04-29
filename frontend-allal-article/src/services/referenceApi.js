import apiClient from "./apiClient";

export const referenceApi = {
  wilayas: () => apiClient.get("/api/wilayas"),
};
