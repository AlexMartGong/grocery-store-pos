import { Loader2 } from "lucide-react";

/** Full-screen loader shown while an expired store session is renewed via the refresh cookie. */
export const SessionRestoreScreen = () => (
  <div
    role="status"
    aria-live="polite"
    className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 px-4"
  >
    <Loader2 aria-hidden className="h-8 w-8 animate-spin text-indigo-600" />
    <p className="text-sm text-slate-600">Restaurando tu sesión…</p>
  </div>
);
