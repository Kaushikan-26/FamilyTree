import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authService } from "../services/authService.js";
import { setToken, clearToken } from "../services/tokenStore.js";

const AuthContext = createContext(null);

/**
 * Holds the authenticated user + token in memory only.
 *
 * Nothing is persisted, so a page reload starts with no user and the app
 * redirects to the login screen — the user must re-enter their credentials
 * every time they load the app or come back after logging out.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Remove any session data left in storage by older versions of the app
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const apply = (data) => {
    setToken(data.token); // in-memory only
    setUser({ _id: data._id, username: data.username });
  };

  const login = useCallback(async (username, password) => {
    apply(await authService.login(username, password));
  }, []);

  const register = useCallback(async (username, password) => {
    apply(await authService.register(username, password));
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Convenience hook to read the auth context. */
export const useAuth = () => useContext(AuthContext);
