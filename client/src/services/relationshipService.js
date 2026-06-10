import api from "./api.js";

/** Relationship API wrapper. */
export const relationshipService = {
  list: () => api.get("/relationships").then((r) => r.data),
  create: (data) => api.post("/relationships", data).then((r) => r.data),
  update: (id, data) => api.put(`/relationships/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/relationships/${id}`).then((r) => r.data),
  between: (aId, bId) =>
    api.get(`/relationships/between/${aId}/${bId}`).then((r) => r.data),
};
