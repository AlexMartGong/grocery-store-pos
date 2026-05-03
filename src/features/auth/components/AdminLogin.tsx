import { useState, type SyntheticEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Lock, ShieldCheck, User } from "lucide-react";
import { useAdminLogin } from "../hooks/useLogin";

export const AdminLogin = () => {
  const { submit, loading, error } = useAdminLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    void submit({ username, password });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <header className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">SaaS Administrator</h1>
          <p className="text-sm text-slate-500">Platform-level access</p>
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
            className="w-full rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Store user?{" "}
          <Link to="/login" className="text-slate-800 font-medium hover:underline">
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
}

const Field = ({ id, label, value, onChange, icon, type = "text", autoComplete }: FieldProps) => (
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
        className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
      />
    </div>
  </div>
);
