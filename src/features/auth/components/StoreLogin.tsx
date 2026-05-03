import { useState, type SyntheticEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Lock, Store, User } from "lucide-react";
import { useStoreLogin } from "../hooks/useLogin";

export const StoreLogin = () => {
  const { submit, loading, error } = useStoreLogin();
  const [storeCode, setStoreCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    void submit({ storeCode, username, password });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <header className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Sign in to your store</h1>
          <p className="text-sm text-slate-500">Cashiers and owners</p>
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
          <Field
            id="storeCode"
            label="Store code"
            icon={<Store className="w-4 h-4" />}
            value={storeCode}
            onChange={setStoreCode}
            autoComplete="organization"
            placeholder="STORE001"
          />
          <Field
            id="username"
            label="Username"
            icon={<User className="w-4 h-4" />}
            value={username}
            onChange={setUsername}
            autoComplete="username"
          />
          <Field
            id="password"
            label="Password"
            type="password"
            icon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          SaaS Administrator?{" "}
          <Link to="/admin/login" className="text-emerald-700 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon: ReactNode;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}

const Field = ({ id, label, value, onChange, icon, type = "text", autoComplete, placeholder }: FieldProps) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-slate-700">
      {label}
    </label>
    <div className="relative">
      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">{icon}</span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      />
    </div>
  </div>
);
