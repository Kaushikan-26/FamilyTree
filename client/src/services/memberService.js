import api from "./api.js";

/** Member API wrapper. */
export const memberService = {
  list: (search) =>
    api.get("/members", { params: search ? { search } : {} }).then((r) => r.data),
  create: (data) => api.post("/members", data).then((r) => r.data),
  update: (id, data) => api.put(`/members/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/members/${id}`).then((r) => r.data),
};
