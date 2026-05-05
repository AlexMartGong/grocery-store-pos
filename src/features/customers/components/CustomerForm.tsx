import axios from "axios";
import { useEffect, useState, type SyntheticEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Save, UserPlus } from "lucide-react";
import {
  createCustomer,
  getCustomerById,
  updateCustomer,
} from "../api/customersApi";
import { mapCustomersError } from "../utils/errorMessages";
import type { ApiErrorResponse } from "../../auth/types";

interface FormState {
  full_name: string;
  phone: string;
  credit_limit: string;
}

const INITIAL: FormState = {
  full_name: "",
  phone: "",
  credit_limit: "0",
};

const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 ${
    hasError
      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-300/40"
      : "border-slate-300 focus:border-slate-700 focus:ring-slate-500/30"
  }`;

export const CustomerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const customer = await getCustomerById(id);
        if (cancelled) return;
        setForm({
          full_name: customer.full_name,
          phone: customer.phone ?? "",
          credit_limit: customer.credit_limit,
        });
      } catch (err) {
        if (!cancelled) setError(mapCustomersError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || undefined,
      credit_limit: form.credit_limit,
    };
    try {
      if (isEdit && id) {
        await updateCustomer(id, payload);
      } else {
        await createCustomer(payload);
      }
      navigate("/pos/customers");
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data?.fields) {
        setFieldErrors(err.response.data.fields);
      }
      setError(mapCustomersError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/pos/customers")}
          className="inline-flex items-center gap-1.5 rounded text-sm text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a clientes
        </button>

        <div className="space-y-6 rounded-2xl bg-white p-4 shadow-xl md:p-8">
          <header className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-slate-800">
              {isEdit ? <Save className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {isEdit ? "Editar cliente" : "Nuevo cliente"}
            </h1>
            <p className="text-sm text-slate-500">
              {isEdit
                ? "Actualiza el nombre, teléfono o límite de crédito."
                : "Registra un cliente para ventas a crédito."}
            </p>
          </header>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <p className="py-12 text-center text-slate-400">Cargando...</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="full_name"
                  className="block text-sm font-medium text-slate-700"
                >
                  Nombre completo
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  required
                  maxLength={150}
                  autoComplete="name"
                  className={inputClass(Boolean(fieldErrors.full_name))}
                />
                {fieldErrors.full_name && (
                  <p className="mt-1 text-sm text-rose-500">
                    {fieldErrors.full_name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-slate-700"
                >
                  Teléfono
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  maxLength={20}
                  autoComplete="tel"
                  className={inputClass(Boolean(fieldErrors.phone))}
                />
                {fieldErrors.phone ? (
                  <p className="mt-1 text-sm text-rose-500">{fieldErrors.phone}</p>
                ) : (
                  <p className="text-xs text-slate-500">Opcional. Hasta 20 caracteres.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="credit_limit"
                  className="block text-sm font-medium text-slate-700"
                >
                  Límite de crédito
                </label>
                <input
                  id="credit_limit"
                  name="credit_limit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.credit_limit}
                  onChange={(e) => set("credit_limit", e.target.value)}
                  required
                  inputMode="decimal"
                  className={`${inputClass(Boolean(fieldErrors.credit_limit))} tabular-nums`}
                />
                {fieldErrors.credit_limit ? (
                  <p className="mt-1 text-sm text-rose-500">
                    {fieldErrors.credit_limit}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Monto máximo que el cliente puede deber. Usa 0 para ventas solo en efectivo.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/pos/customers")}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isEdit ? <Save className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {submitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cliente"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
