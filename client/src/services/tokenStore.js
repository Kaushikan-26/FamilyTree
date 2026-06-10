/**
 * In-memory JWT store.
 *
 * The token lives only in memory (not localStorage/sessionStorage), so it is
 * lost on every full page load. That deliberately forces the user to log in
 * again whenever they (re)load the app or navigate back after logging out.
 */
let token = null;

export const getToken = () => token;
export const setToken = (t) => {
  token = t;
};
export const clearToken = () => {
  token = null;
};
