import api from "./api.js";

/** Auth API wrapper. */
export const authService = {
  register: (username, password) =>
    api.post("/auth/register", { username, password }).then((r) => r.data),
  login: (username, password) =>
    api.post("/auth/login", { username, password }).then((r) => r.data),
};
