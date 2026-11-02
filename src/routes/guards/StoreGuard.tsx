import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { SessionRestoreScreen } from "../../features/auth/components/SessionRestoreScreen";
import { useAuthStore } from "../../features/auth/store/authStore";

export const StoreGuard = ({ children }: { children?: ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  const isRestoring = useAuthStore((s) => s.isRestoring);

  // Never bounce to /login while the boot-time refresh may still revive the session.
  if (isRestoring) return <SessionRestoreScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== "OWNER" && role !== "CASHIER") return <Navigate to="/login" replace />;

  return <>{children ?? <Outlet />}</>;
};
