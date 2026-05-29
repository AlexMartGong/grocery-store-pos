import axios from "axios";
import { useEffect, useState, type SyntheticEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Save, Store as StoreIcon } from "lucide-react";
import { createStore, getStoreById, updateStore } from "../api/storesApi";
import { mapStoresError } from "../utils/errorMessages";
import type { AdminNotificationChannel, StoreStatus } from "../types";
import type { ApiErrorResponse } from "../../auth/types";

const CODE_PATTERN = "^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$";

const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 ${
    hasError
      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-300/40"
      : "border-slate-300 focus:border-slate-700 focus:ring-slate-500/30"
  }`;

interface FormState {
  code: string;
  name: string;
  ownerName: string;
  whatsapp: string;
  telegramChatId: string;
  preferredAdminChannel: AdminNotificationChannel;
  address: string;
  status: StoreStatus;
}

const INITIAL: FormState = {
  code: "",
  name: "",
  ownerName: "",
  whatsapp: "",
  telegramChatId: "",
  preferredAdminChannel: "WHATSAPP",
  address: "",
  status: "ACTIVE",
};

export const StoreForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getStoreById(id)
      .then((s) =>
        setForm({
          code: s.code,
          name: s.name,
          ownerName: s.ownerName ?? "",
          whatsapp: s.whatsapp ?? "",
          telegramChatId: s.telegramChatId ?? "",
          preferredAdminChannel: s.preferredAdminChannel ?? "WHATSAPP",
          address: s.address ?? "",
          status: s.status,
        }),
      )
      .catch((err) => setError(mapStoresError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      if (isEdit && id) {
        await updateStore(id, {
          name: form.name,
          ownerName: form.ownerName || undefined,
          whatsapp: form.whatsapp || undefined,
          telegramChatId: form.telegramChatId || undefined,
          preferredAdminChannel: form.preferredAdminChannel,
          address: form.address || undefined,
          status: form.status,
        });
      } else {
        await createStore({
          code: form.code,
          name: form.name,
          ownerName: form.ownerName || undefined,
          whatsapp: form.whatsapp || undefined,
          telegramChatId: form.telegramChatId || undefined,
          preferredAdminChannel: form.preferredAdminChannel,
          address: form.address || undefined,
        });
      }
      navigate("/admin/stores");
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data?.fields) {
        setFieldErrors(err.response.data.fields);
      }
      setError(mapStoresError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/admin/stores")}
          className="inline-flex items-center gap-1.5 rounded text-sm text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <ArrowLeft className="w-4 h-4" /> Back to stores
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 space-y-6">
          <header className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center">
              <StoreIcon className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {isEdit ? "Edit store" : "New store"}
            </h1>
            <p className="text-sm text-slate-500">
              {isEdit
                ? "Update store details. Code is immutable."
                : "Provision a new tenant store."}
            </p>
          </header>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <p className="text-center text-slate-400 py-8">Loading...</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="code" className="block text-sm font-medium text-slate-700">
                  Code
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  value={form.code}
                  onChange={(e) => set("code", e.target.value)}
                  required
                  disabled={isEdit}
                  pattern={CODE_PATTERN}
                  minLength={3}
                  maxLength={30}
                  title="Lowercase letters, digits, hyphens (3-30). Must start and end with a letter or digit."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/30 disabled:bg-slate-100 disabled:text-slate-500 font-mono text-sm"
                />
                <p className="text-xs text-slate-500">
                  {isEdit
                    ? "Code cannot be changed."
                    : "Lowercase letters, digits, hyphens (3-30 chars)."}
                </p>
              </div>

              <Field
                id="name"
                label="Name"
                value={form.name}
                onChange={(v) => set("name", v)}
                required
                maxLength={150}
              />
              <Field
                id="ownerName"
                label="Owner name"
                value={form.ownerName}
                onChange={(v) => set("ownerName", v)}
                maxLength={150}
              />
              <Field
                id="whatsapp"
                label="WhatsApp"
                value={form.whatsapp}
                onChange={(v) => set("whatsapp", v)}
                maxLength={20}
                placeholder="+1234567890"
              />

              <div className="space-y-1.5">
                <label htmlFor="address" className="block text-sm font-medium text-slate-700">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
                />
              </div>

              <fieldset className="space-y-4 border-t border-slate-200 pt-4">
                <legend className="text-sm font-semibold text-slate-900">
                  Notificaciones del Sistema
                </legend>

                <div className="space-y-1.5">
                  <label
                    htmlFor="preferredAdminChannel"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Canal principal de notificaciones
                  </label>
                  <select
                    id="preferredAdminChannel"
                    name="preferredAdminChannel"
                    value={form.preferredAdminChannel}
                    onChange={(e) =>
                      set("preferredAdminChannel", e.target.value as AdminNotificationChannel)
                    }
                    aria-label="Canal principal de notificaciones"
                    className={inputClass(Boolean(fieldErrors.preferredAdminChannel))}
                  >
                    <option value="WHATSAPP">WHATSAPP</option>
                    <option value="TELEGRAM">TELEGRAM</option>
                  </select>
                  {fieldErrors.preferredAdminChannel && (
                    <p className="text-rose-500 text-sm mt-1">
                      {fieldErrors.preferredAdminChannel}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="telegramChatId"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Telegram chat ID
                  </label>
                  <input
                    id="telegramChatId"
                    name="telegramChatId"
                    type="text"
                    value={form.telegramChatId}
                    onChange={(e) => set("telegramChatId", e.target.value)}
                    maxLength={50}
                    aria-label="Telegram chat ID"
                    className={inputClass(Boolean(fieldErrors.telegramChatId))}
                  />
                  {fieldErrors.telegramChatId ? (
                    <p className="text-rose-500 text-sm mt-1">{fieldErrors.telegramChatId}</p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Requerido solo cuando el canal es TELEGRAM.
                    </p>
                  )}
                </div>
              </fieldset>

              {isEdit && (
                <div className="space-y-1.5">
                  <label htmlFor="status" className="block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(e) => set("status", e.target.value as StoreStatus)}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="CANCELED">Canceled</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/admin/stores")}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium px-4 py-2 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? "Saving..." : isEdit ? "Save changes" : "Create store"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
}

const Field = ({ id, label, value, onChange, required, maxLength, placeholder }: FieldProps) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-slate-700">
      {label}
    </label>
    <input
      id={id}
      name={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      maxLength={maxLength}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
    />
  </div>
);
