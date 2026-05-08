import { useEffect, useId, useRef, useState, type SyntheticEvent } from "react";
import { Lock } from "lucide-react";
import { useModalAnimation } from "../../../shared/hooks/useModalAnimation";
import { useCashShiftStore } from "../store/cashShiftStore";

interface Props {
  open: boolean;
}

export const OpenShiftModal = ({ open }: Props) => {
  const titleId = useId();
  const descId = useId();
  const { render, show } = useModalAnimation(open, { closeOnEscape: false });
  const inputRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState("");

  const openShift = useCashShiftStore((s) => s.open);
  const error = useCashShiftStore((s) => s.error);
  const isLoading = useCashShiftStore((s) => s.isLoading);

  useEffect(() => {
    if (render) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [render]);

  if (!render) return null;

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    const ok = await openShift(amount);
    if (ok) setAmount("");
  };

  const canSubmit = amount.trim().length > 0 && !isLoading;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 transition-opacity duration-300 ease-out sm:items-center sm:p-4 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden={!show}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={`relative w-full max-w-md transform rounded-t-2xl bg-white p-4 shadow-2xl transition-all duration-300 ease-out sm:rounded-2xl sm:p-6 ${
          show
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Lock className="h-5 w-5" aria-hidden />
          </div>
          <div className="space-y-1">
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              Apertura de caja
            </h2>
            <p id={descId} className="text-sm text-slate-500">
              Necesitas abrir caja antes de operar. Ingresa el fondo inicial con el
              que comienzas el turno.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label
              htmlFor="opening-balance"
              className="block text-sm font-medium text-slate-700"
            >
              Fondo inicial (MXN)
            </label>
            <div className="relative mt-1">
              <span
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"
                aria-hidden
              >
                $
              </span>
              <input
                ref={inputRef}
                id="opening-balance"
                type="text"
                inputMode="decimal"
                pattern="^\d+(\.\d{1,2})?$"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoComplete="off"
                aria-label="Fondo inicial"
                className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-7 pr-3 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Cantidad en efectivo con la que abres la caja registradora.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {isLoading ? "Abriendo..." : "Abrir caja"}
          </button>
        </form>
      </div>
    </div>
  );
};
