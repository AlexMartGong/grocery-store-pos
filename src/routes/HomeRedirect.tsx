import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { SessionRestoreScreen } from "../features/auth/components/SessionRestoreScreen";
import { useAuthStore } from "../features/auth/store/authStore";
import { isStoreRole } from "../features/auth/utils/token";

// Lazy: `/login` and `/pos` never download the marketing page.
const LandingPage = lazy(() =>
  import("../features/landing/components/LandingPage").then((m) => ({
    default: m.LandingPage,
  })),
);

// Installed PWA (manifest `display: standalone`): whoever opens it is already a customer.
const isStandaloneApp = () => window.matchMedia("(display-mode: standalone)").matches;

/**
 * `/`. The PWA manifest's start_url is `/`, so a store user with a live (or restoring) session
 * must land on the POS. Without one, the installed app goes to the login form (a cashier whose
 * session could not be restored) and a browser visitor gets the public landing page.
 */
export const HomeRedirect = () => {
  const isRestoring = useAuthStore((s) => s.isRestoring);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);

  if (isRestoring) return <SessionRestoreScreen />;
  if (isAuthenticated && isStoreRole(role)) return <Navigate to="/pos" replace />;
  if (isStandaloneApp()) return <Navigate to="/login" replace />;
  return (
    <Suspense fallback={<SessionRestoreScreen />}>
      <LandingPage />
    </Suspense>
  );
};
