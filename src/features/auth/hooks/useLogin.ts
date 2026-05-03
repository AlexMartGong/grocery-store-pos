import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin, loginStore } from "../api/authApi";
import { useAuthStore } from "../store/authStore";
import type { AdminLoginRequest, LoginRequest } from "../types";
import { mapAuthError } from "../utils/errorMessages";

interface LoginState<T> {
  submit: (data: T) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useStoreLogin(): LoginState<LoginRequest> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setToken = useAuthStore((s) => s.setToken);
  const navigate = useNavigate();

  const submit = async (data: LoginRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginStore(data);
      const ok = setToken(res.token, data.username);
      if (!ok) {
        setError("Received an invalid token. Please try again.");
        return;
      }
      navigate("/pos", { replace: true });
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, error };
}

export function useAdminLogin(): LoginState<AdminLoginRequest> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setToken = useAuthStore((s) => s.setToken);
  const navigate = useNavigate();

  const submit = async (data: AdminLoginRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginAdmin(data);
      const ok = setToken(res.token, data.username);
      if (!ok) {
        setError("Received an invalid token. Please try again.");
        return;
      }
      navigate("/admin/stores", { replace: true });
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, error };
}
