import { useId, useState, useEffect } from "react";
import { Scale, Hash } from "lucide-react";
import { useModalAnimation } from "../../../shared/hooks/useModalAnimation";
import type { UnitOfMeasure } from "../types";

interface QuantityModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
  initialValue?: number;
  unitOfMeasure: UnitOfMeasure;
  productName: string;
}

export const QuantityModal = ({
  open,
  onClose,
  onConfirm,
  initialValue = 0,
  unitOfMeasure,
  productName,
}: QuantityModalProps) => {
  const inputId = useId();
  const titleId = useId();
  const { render, show } = useModalAnimation(open, { onClose });
  const [value, setValue] = useState(initialValue > 0 ? String(initialValue) : "");

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() =>
        setValue(initialValue > 0 ? String(initialValue) : ""),
      );
    }
  }, [open, initialValue]);

  if (!render) return null;

  const isKilo = unitOfMeasure === "KILO";

  const handleSubmit = () => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return;
    onConfirm(num);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 transition-opacity duration-300 ease-out sm:items-center sm:p-4 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-sm transform rounded-t-2xl bg-white p-6 shadow-xl transition-all duration-300 ease-out sm:rounded-2xl ${
          show
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
        }`}
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            {isKilo ? (
              <Scale aria-hidden className="h-5 w-5" />
            ) : (
              <Hash aria-hidden className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-base font-semibold text-slate-900"
            >
              {isKilo ? "Ingresar peso (kg)" : "Ingresar cantidad"}
            </h2>
            <p className="truncate text-sm text-slate-500" title={productName}>
              {productName}
            </p>
          </div>
        </div>

        <label
          htmlFor={inputId}
          className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500"
        >
          {isKilo ? "Peso en kilogramos" : "Cantidad de piezas"}
        </label>
        <input
          id={inputId}
          type="number"
          step="0.001"
          min="0.001"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder={isKilo ? "0.000" : "1"}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 text-center text-4xl font-bold text-slate-900 shadow-inner placeholder:text-slate-300 focus-visible:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
        />
        {isKilo && (
          <p className="mt-1 text-center text-xs text-slate-400">
            Ej: 0.250 = 250 gramos
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={Number(value) <= 0 || !value}
            className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};
