import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore";

export const AdminGuard = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (role !== "SUPER_ADMIN") return <Navigate to="/login" replace />;

  return <Outlet />;
};
