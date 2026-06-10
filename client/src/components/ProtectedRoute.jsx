import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/** Renders children only when authenticated; otherwise redirects to /login. */
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}
