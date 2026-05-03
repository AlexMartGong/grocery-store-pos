import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore";

export const StoreGuard = ({ children }: { children?: ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== "OWNER" && role !== "CASHIER") return <Navigate to="/login" replace />;

  return <>{children ?? <Outlet />}</>;
};
