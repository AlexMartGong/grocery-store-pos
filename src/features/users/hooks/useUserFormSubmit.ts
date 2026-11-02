import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "../../auth/store/authStore";
import type { ApiErrorResponse } from "../../auth/types";
import { createUser, updateUser } from "../api/usersApi";
import type { UpdateUserRequest, UserRole } from "../types";
import { mapUsersError } from "../utils/errorMessages";

export interface UserFormValues {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
}

/**
 * Create / update submit for `UserForm`. In edit mode an empty password keeps the current one; a
 * new password makes the backend revoke every session of that user — when it is the logged-in
 * OWNER's own account, this session is closed too and the user is sent to the login.
 */
export function useUserFormSubmit(id: string | undefined) {
  const navigate = useNavigate();
  const currentUserId = useAuthStore((s) => s.user?.userId);
  const logout = useAuthStore((s) => s.logout);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const submit = async (form: UserFormValues) => {
    setSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});
    try {
      if (id) {
        const data: UpdateUserRequest = { fullName: form.fullName, role: form.role };
        if (form.password) data.password = form.password;
        await updateUser(id, data);
        if (data.password && id === currentUserId) {
          await logout();
          toast.info("Tu contraseña cambió. Inicia sesión de nuevo con la nueva contraseña.");
          navigate("/login", { replace: true });
          return;
        }
        if (data.password) {
          toast.success("Contraseña actualizada. Se cerraron las sesiones de ese usuario.");
        }
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
      setSubmitError(mapUsersError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return { submit, submitting, submitError, fieldErrors };
}
