import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type SyntheticEvent,
} from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { useModalAnimation } from "../../../shared/hooks/useModalAnimation";
import { useAsyncData } from "../../../shared/hooks/useAsyncData";
import { formatMoney } from "../../sales/utils/format";
import { useCashShiftStore } from "../store/cashShiftStore";
import { getShiftPreview } from "../api/cashApi";
import { mapCashShiftError } from "../utils/errorMessages";
import type { CashShiftResponse } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = "form" | "receipt";

export const CloseShiftModal = ({ open, onClose }: Props) => {
  const titleId = useId();
  const descId = useId();

  const [step, setStep] = useState<Step>("form");
  const [closedShift, setClosedShift] = useState<CashShiftResponse | null>(null);
  const [realBalance, setRealBalance] = useState("");
  const [notes, setNotes] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // A fresh fetcher per opening, so the expected balance is never one from an earlier open.
  const fetchPreview = useMemo(() => (open ? () => getShiftPreview() : null), [open]);
  const {
    data: previewData,
    loading: previewLoading,
    error: previewError,
  } = useAsyncData(fetchPreview, mapCashShiftError);
  const preview = previewLoading || previewError ? null : (previewData ?? null);

  const currentShift = useCashShiftStore((s) => s.currentShift);
  const closeAction = useCashShiftStore((s) => s.close);
  const clearCurrentShift = useCashShiftStore((s) => s.clearCurrentShift);
  const clearError = useCashShiftStore((s) => s.clearError);
  const error = useCashShiftStore((s) => s.error);
  const isLoading = useCashShiftStore((s) => s.isLoading);

  const dismissibleByOverlay = step === "form";

  const { render, show } = useModalAnimation(open, {
    closeOnEscape: dismissibleByOverlay,
    onClose,
  });

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => {
        setStep("form");
        setClosedShift(null);
        setRealBalance("");
        setNotes("");
        clearError();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [open, clearError]);

  useEffect(() => {
    if (render && step === "form") {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [render, step]);

  if (!render) return null;

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    const trimmedNotes = notes.trim();
    const closed = await closeAction(
      realBalance,
      trimmedNotes.length > 0 ? trimmedNotes : undefined,
    );
    if (closed) {
      setClosedShift(closed);
      setStep("receipt");
    }
  };

  const handleFinish = () => {
    onClose();
    setTimeout(() => clearCurrentShift(), 220);
  };

  const canSubmit = realBalance.trim().length > 0 && !isLoading;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 transition-opacity duration-300 ease-out sm:items-center sm:p-4 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      onClick={dismissibleByOverlay ? onClose : undefined}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md transform rounded-t-2xl bg-white p-4 shadow-2xl transition-all duration-300 ease-out sm:rounded-2xl sm:p-6 ${
          show
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
        }`}
      >
        {step === "form" ? (
          <FormStep
            titleId={titleId}
            descId={descId}
            inputRef={inputRef}
            realBalance={realBalance}
            setRealBalance={setRealBalance}
            notes={notes}
            setNotes={setNotes}
            onSubmit={handleSubmit}
            onCancel={onClose}
            error={error}
            isLoading={isLoading}
            canSubmit={canSubmit}
            openingBalance={currentShift?.opening_balance ?? null}
            preview={preview}
            previewLoading={previewLoading}
            previewError={previewError}
          />
        ) : (
          closedShift && (
            <ReceiptStep
              titleId={titleId}
              descId={descId}
              shift={closedShift}
              onFinish={handleFinish}
            />
          )
        )}
      </div>
    </div>
  );
};

interface FormStepProps {
  titleId: string;
  descId: string;
  inputRef: RefObject<HTMLInputElement | null>;
  realBalance: string;
  setRealBalance: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  onSubmit: (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void;
  onCancel: () => void;
  error: string | null;
  isLoading: boolean;
  canSubmit: boolean;
  openingBalance: string | null;
  preview: CashShiftResponse | null;
  previewLoading: boolean;
  previewError: string | null;
}

const FormStep = ({
  titleId,
  descId,
  inputRef,
  realBalance,
  setRealBalance,
  notes,
  setNotes,
  onSubmit,
  onCancel,
  error,
  isLoading,
  canSubmit,
  openingBalance,
  preview,
  previewLoading,
  previewError,
}: FormStepProps) => {
  const parsedReal = parseFloat(realBalance);
  const liveDiffValid = preview?.expected_balance != null && !isNaN(parsedReal);
  const liveDiff = liveDiffValid
    ? parsedReal - Number(preview!.expected_balance)
    : 0;
  const isOver = liveDiff > 0.0049;
  const isShort = liveDiff < -0.0049;
  const DiffIcon = isShort ? ArrowDownCircle : isOver ? ArrowUpCircle : CheckCircle2;
  const diffColor = isShort
    ? "text-rose-600"
    : isOver
      ? "text-emerald-600"
      : "text-slate-600";
  const diffLabel = isShort ? "Faltante" : isOver ? "Sobrante" : "Exacto";

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            Corte de caja
          </h2>
          <p id={descId} className="text-sm text-slate-500">
            Cuenta el efectivo en caja y captúralo para calcular el sobrante o
            faltante del turno.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancelar corte"
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {openingBalance !== null && (
        <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Fondo inicial del turno:{" "}
          <span className="font-semibold text-slate-900">
            {formatMoney(openingBalance)}
          </span>
        </p>
      )}

      {previewLoading && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Calculando balance esperado...
        </div>
      )}
      {!previewLoading && previewError && (
        <p
          role="alert"
          className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700"
        >
          {previewError}
        </p>
      )}
      {!previewLoading && preview?.expected_balance && (
        <div className="mt-3 rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
          El sistema espera:{" "}
          <span className="font-semibold tabular-nums">
            {formatMoney(preview.expected_balance)}
          </span>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
        <div>
          <label
            htmlFor="real-balance"
            className="block text-sm font-medium text-slate-700"
          >
            Efectivo físico contado (MXN)
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
              id="real-balance"
              type="text"
              inputMode="decimal"
              pattern="^\d+(\.\d{1,2})?$"
              placeholder="0.00"
              value={realBalance}
              onChange={(e) => setRealBalance(e.target.value)}
              required
              autoComplete="off"
              aria-label="Efectivo físico contado"
              className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-7 pr-3 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/50"
            />
          </div>
          {liveDiffValid && (
            <p
              className={`mt-2 flex items-center gap-1.5 text-sm font-semibold tabular-nums ${diffColor}`}
            >
              <DiffIcon className="h-4 w-4 shrink-0" aria-hidden />
              {diffLabel}: {formatMoney(liveDiff.toFixed(2))}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Total contado físicamente en la caja registradora.
          </p>
        </div>

        <div>
          <label
            htmlFor="close-notes"
            className="block text-sm font-medium text-slate-700"
          >
            Notas <span className="text-slate-400">(opcional)</span>
          </label>
          <textarea
            id="close-notes"
            rows={3}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones del turno, incidencias, retiros..."
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/50"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {isLoading ? "Cerrando..." : "Calcular cierre"}
          </button>
        </div>
      </form>
    </>
  );
};

interface ReceiptStepProps {
  titleId: string;
  descId: string;
  shift: CashShiftResponse;
  onFinish: () => void;
}

const ReceiptStep = ({ titleId, descId, shift, onFinish }: ReceiptStepProps) => {
  const diffNum = Number(shift.difference ?? "0");
  const isOver = diffNum > 0.0049;
  const isShort = diffNum < -0.0049;
  const diffLabel = isOver ? "Sobrante" : isShort ? "Faltante" : "Exacto";
  const diffColor = isShort
    ? "text-rose-600"
    : isOver
      ? "text-emerald-600"
      : "text-slate-700";
  const DiffIcon = isShort ? ArrowDownCircle : isOver ? ArrowUpCircle : CheckCircle2;

  return (
    <>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isShort
              ? "bg-rose-100 text-rose-700"
              : isOver
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-700"
          }`}
        >
          <DiffIcon className="h-5 w-5" aria-hidden />
        </div>
        <div className="space-y-1">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            Resumen de turno
          </h2>
          <p id={descId} className="text-sm text-slate-500">
            Turno cerrado correctamente. Revisa el corte antes de continuar.
          </p>
        </div>
      </div>

      <dl className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200">
        <SummaryRow label="Fondo inicial" value={shift.opening_balance} />
        <SummaryRow label="Ventas esperadas" value={shift.expected_balance} />
        <SummaryRow label="Efectivo contado" value={shift.real_balance} />
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-sm font-semibold text-slate-700">
            Diferencia
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {diffLabel}
            </span>
          </dt>
          <dd className={`text-base font-semibold tabular-nums ${diffColor}`}>
            {formatMoney(shift.difference ?? "0")}
          </dd>
        </div>
      </dl>

      {shift.notes && (
        <div className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">Notas:</span> {shift.notes}
        </div>
      )}

      <button
        type="button"
        onClick={onFinish}
        className="mt-6 flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        Terminar
      </button>
    </>
  );
};

const SummaryRow = ({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) => (
  <div className="flex items-center justify-between gap-4 px-4 py-3">
    <dt className="text-sm text-slate-600">{label}</dt>
    <dd className="text-sm font-medium tabular-nums text-slate-900">
      {value !== null ? formatMoney(value) : "—"}
    </dd>
  </div>
);
