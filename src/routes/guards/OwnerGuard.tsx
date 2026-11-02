import { Navigate, Outlet } from "react-router-dom";
import { SessionRestoreScreen } from "../../features/auth/components/SessionRestoreScreen";
import { useAuthStore } from "../../features/auth/store/authStore";

export const OwnerGuard = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  const isRestoring = useAuthStore((s) => s.isRestoring);

  if (isRestoring) return <SessionRestoreScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === "CASHIER") return <Navigate to="/pos" replace />;
  if (role !== "OWNER") return <Navigate to="/login" replace />;

  return <Outlet />;
};
