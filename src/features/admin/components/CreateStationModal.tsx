import { useEffect, useId, useState, type SyntheticEvent } from "react";
import { AlertCircle, Loader2, Monitor, X } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useModalAnimation } from "../../../shared/hooks/useModalAnimation";
import { createStoreStation } from "../api/storeStationApi";
import { mapStoreStationError } from "../utils/errorMessages";
import type { StoreResponse } from "../../stores/types";
import type { ApiErrorResponse } from "../../auth/types";

interface CreateStationModalProps {
  open: boolean;
  onClose: () => void;
  store: StoreResponse | null;
  onSuccess: () => void;
}

const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border bg-white px-3 py-2.5 text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 ${
    hasError
      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-300/40"
      : "border-slate-300 focus:border-slate-700 focus:ring-slate-500/30"
  }`;

export const CreateStationModal = ({
  open,
  onClose,
  store,
  onSuccess,
}: CreateStationModalProps) => {
  const nameId = useId();

  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Cache the latest non-null store so the panel doesn't flash empty during the exit
  // animation (parent clears the `store` prop on close).
  const [cached, setCached] = useState<StoreResponse | null>(store);
  const { render, show } = useModalAnimation(open, { onClose });

  useEffect(() => {
    if (!store) return;
    const raf = requestAnimationFrame(() => setCached(store));
    return () => cancelAnimationFrame(raf);
  }, [store]);

  // Reset form whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      setName("");
      setSubmitting(false);
      setError(null);
      setFieldErrors({});
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const current = store ?? cached;
  if (!render || !current) return null;

  const isDisabled = submitting || !name.trim();

  const safeClose = () => {
    if (!submitting) onClose();
  };

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      await createStoreStation(current.id, { name: name.trim() });
      toast.success("Estación creada");
      onSuccess();
      onClose();
    } catch (err) {
      if (
        axios.isAxiosError<ApiErrorResponse>(err) &&
        err.response?.data?.fields
      ) {
        setFieldErrors(err.response.data.fields);
      }
      setError(mapStoreStationError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm transition-opacity duration-300 ease-out sm:items-center sm:p-4 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      onClick={safeClose}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-station-title"
        onClick={(e) => e.stopPropagation()}
        className={`relative flex max-h-[95vh] w-full max-w-md transform flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl transition-all duration-300 ease-out sm:rounded-2xl ${
          show
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
        }`}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <Monitor aria-hidden className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="create-station-title"
                className="text-lg font-semibold text-slate-900"
              >
                Nueva estación de impresión
              </h2>
              <p className="text-sm text-slate-500">{current.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={safeClose}
            disabled={submitting}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex-1 space-y-4 overflow-y-auto px-6 py-6"
        >
          <div>
            <label
              htmlFor={nameId}
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Nombre de la caja
            </label>
            <input
              id={nameId}
              type="text"
              maxLength={100}
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Caja 1, Caja Principal"
              disabled={submitting}
              required
              className={inputClass(!!fieldErrors.name)}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-rose-500">{fieldErrors.name}</p>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={safeClose}
              disabled={submitting}
              className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isDisabled}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
