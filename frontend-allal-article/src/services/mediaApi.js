import apiClient from "./apiClient";

export const mediaApi = {
  byOwner: (ownerType, ownerId) =>
    apiClient.get("/api/media/by-owner", { params: { ownerType, ownerId } }),
  content: (id) => apiClient.get(`/api/media/${id}/content`, { responseType: "blob" }),
};
