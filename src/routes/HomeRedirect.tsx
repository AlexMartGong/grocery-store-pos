import { Navigate } from "react-router-dom";
import { SessionRestoreScreen } from "../features/auth/components/SessionRestoreScreen";
import { useAuthStore } from "../features/auth/store/authStore";
import { isStoreRole } from "../features/auth/utils/token";

/**
 * `/` and `*`. The PWA manifest's start_url is `/`, so a store user with a live (or restoring)
 * session must land on the POS, not the login form. Everyone else goes to `/login` as before.
 */
export const HomeRedirect = () => {
  const isRestoring = useAuthStore((s) => s.isRestoring);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);

  if (isRestoring) return <SessionRestoreScreen />;
  if (isAuthenticated && isStoreRole(role)) return <Navigate to="/pos" replace />;
  return <Navigate to="/login" replace />;
};
