import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore";

export const OwnerGuard = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === "CASHIER") return <Navigate to="/pos" replace />;
  if (role !== "OWNER") return <Navigate to="/login" replace />;

  return <Outlet />;
};
