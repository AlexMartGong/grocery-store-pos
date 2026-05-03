import axios from "axios";
import { useState, type SyntheticEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, UserPlus } from "lucide-react";
import { provisionStoreOwner } from "../api/adminProvisioningApi";
import { mapAdminProvisioningError } from "../utils/errorMessages";
import type { ApiErrorResponse } from "../../auth/types";

interface FormState {
  name: string;
  username: string;
  password: string;
}

const INITIAL: FormState = {
  name: "",
  username: "",
  password: "",
};

const USERNAME_PATTERN = "^[-a-zA-Z0-9._]{3,50}$";

const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 ${
    hasError
      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-300/40"
      : "border-slate-300 focus:border-slate-700 focus:ring-slate-500/30"
  }`;

export const ProvisionOwnerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      await provisionStoreOwner(id, {
        fullName: form.name,
        username: form.username,
        password: form.password,
        role: "OWNER",
      });
      navigate("/admin/stores");
    } catch (err) {
      console.error("Backend Error:", axios.isAxiosError<ApiErrorResponse>(err) ? err.response?.data : err);
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data?.fields) {
        setFieldErrors(err.response.data.fields);
      }
      setError(mapAdminProvisioningError(err));
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
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UserPlus className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Provision owner</h1>
            <p className="text-sm text-slate-500">
              Create the initial OWNER user for store{" "}
              <span className="font-mono text-xs text-slate-700">{id}</span>. They will be able to
              sign in at <span className="font-mono text-xs text-slate-700">/login</span> using the
              store code.
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

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                maxLength={150}
                autoComplete="name"
                className={inputClass(Boolean(fieldErrors.name))}
              />
              {fieldErrors.name && (
                <p className="text-rose-500 text-sm mt-1">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
                required
                minLength={3}
                maxLength={50}
                pattern={USERNAME_PATTERN}
                autoComplete="username"
                title="3-50 characters. Letters, digits, dot, underscore, hyphen."
                className={`${inputClass(Boolean(fieldErrors.username))} font-mono text-sm`}
              />
              {fieldErrors.username ? (
                <p className="text-rose-500 text-sm mt-1">{fieldErrors.username}</p>
              ) : (
                <p className="text-xs text-slate-500">
                  3-50 characters. Letters, digits, dot, underscore, hyphen.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
                minLength={8}
                maxLength={100}
                autoComplete="new-password"
                className={inputClass(Boolean(fieldErrors.password))}
              />
              {fieldErrors.password ? (
                <p className="text-rose-500 text-sm mt-1">{fieldErrors.password}</p>
              ) : (
                <p className="text-xs text-slate-500">At least 8 characters.</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate("/admin/stores")}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <UserPlus className="w-4 h-4" />
                {submitting ? "Provisioning..." : "Provision owner"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
