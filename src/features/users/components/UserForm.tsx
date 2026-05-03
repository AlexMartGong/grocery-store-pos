import axios from "axios";
import { useEffect, useState, type SyntheticEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Save, UserPlus } from "lucide-react";
import { createUser, getUserById, updateUser } from "../api/usersApi";
import { mapUsersError } from "../utils/errorMessages";
import type { ApiErrorResponse } from "../../auth/types";
import type { UserRole } from "../types";

interface FormState {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
}

const INITIAL: FormState = {
  username: "",
  password: "",
  fullName: "",
  role: "CASHIER",
};

const USERNAME_PATTERN = "^[-a-zA-Z0-9._]{3,50}$";

const inputClass = (hasError: boolean) =>
  `w-full rounded-lg border px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 ${
    hasError
      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-300/40"
      : "border-slate-300 focus:border-slate-700 focus:ring-slate-500/30"
  }`;

export const UserForm = () => {
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
        const user = await getUserById(id);
        if (cancelled) return;
        setForm({
          username: user.username,
          password: "",
          fullName: user.fullName,
          role: user.role,
        });
      } catch (err) {
        if (!cancelled) setError(mapUsersError(err));
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
    try {
      if (isEdit && id) {
        await updateUser(id, { fullName: form.fullName, role: form.role });
      } else {
        await createUser({
          username: form.username,
          password: form.password,
          fullName: form.fullName,
          role: form.role,
        });
      }
      navigate("/pos/users");
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data?.fields) {
        setFieldErrors(err.response.data.fields);
      }
      setError(mapUsersError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/pos/users")}
          className="inline-flex items-center gap-1.5 rounded text-sm text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a usuarios
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 space-y-6">
          <header className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center">
              {isEdit ? <Save className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {isEdit ? "Editar usuario" : "Nuevo usuario"}
            </h1>
            <p className="text-sm text-slate-500">
              {isEdit
                ? "Actualiza el nombre o el rol. El usuario no puede cambiarse."
                : "Crea un nuevo cajero o propietario para esta tienda."}
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
            <p className="text-center py-12 text-slate-400">Cargando...</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                  Usuario
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={(e) => set("username", e.target.value)}
                  required
                  disabled={isEdit}
                  minLength={3}
                  maxLength={50}
                  pattern={USERNAME_PATTERN}
                  autoComplete="username"
                  title="3-50 caracteres. Letras, dígitos, punto, guion bajo, guion."
                  className={`${inputClass(Boolean(fieldErrors.username))} font-mono text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed`}
                />
                {fieldErrors.username ? (
                  <p className="text-rose-500 text-sm mt-1">{fieldErrors.username}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    {isEdit
                      ? "No se puede cambiar."
                      : "3-50 caracteres. Letras, dígitos, punto, guion bajo, guion."}
                  </p>
                )}
              </div>

              {!isEdit && (
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Contraseña
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
                    <p className="text-xs text-slate-500">Al menos 8 caracteres.</p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                  Nombre completo
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  required
                  maxLength={150}
                  autoComplete="name"
                  className={inputClass(Boolean(fieldErrors.fullName))}
                />
                {fieldErrors.fullName && (
                  <p className="text-rose-500 text-sm mt-1">{fieldErrors.fullName}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="role" className="block text-sm font-medium text-slate-700">
                  Rol
                </label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={(e) => set("role", e.target.value as UserRole)}
                  required
                  className={inputClass(Boolean(fieldErrors.role))}
                >
                  <option value="CASHIER">Cajero (CASHIER)</option>
                  <option value="OWNER">Propietario (OWNER)</option>
                </select>
                {fieldErrors.role && (
                  <p className="text-rose-500 text-sm mt-1">{fieldErrors.role}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/pos/users")}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium px-4 py-2.5 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                >
                  {isEdit ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {submitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear usuario"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
