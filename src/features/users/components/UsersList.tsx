import { Fragment, useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Pencil, Plus, Search, Trash2, Users as UsersIcon } from "lucide-react";
import { deleteUser, getUsers } from "../api/usersApi";
import { mapUsersError } from "../utils/errorMessages";
import { useAuthStore } from "../../auth/store/authStore";
import { useAsyncData } from "../../../shared/hooks/useAsyncData";
import type { UserResponse, UserRole } from "../types";

const PAGE_SIZE = 10;
type RoleFilter = "ALL" | UserRole;
type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

const ROLE_BADGE: Record<UserRole, string> = {
  OWNER: "bg-violet-100 text-violet-700 ring-violet-200",
  CASHIER: "bg-sky-100 text-sky-700 ring-sky-200",
  SUPER_ADMIN: "bg-slate-100 text-slate-700 ring-slate-200",
};

const ACTIVE_BADGE = "bg-emerald-100 text-emerald-700 ring-emerald-200";
const INACTIVE_BADGE = "bg-slate-100 text-slate-600 ring-slate-200";

export const UsersList = () => {
  const navigate = useNavigate();
  const currentUserId = useAuthStore((s) => s.user?.userId);
  const [page, setPage] = useState(0);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchUsers = useCallback(() => {
    const active = activeFilter === "ALL" ? undefined : activeFilter === "ACTIVE";
    const role = roleFilter === "ALL" ? undefined : roleFilter;
    return getUsers(page, PAGE_SIZE, active, role);
  }, [page, roleFilter, activeFilter]);
  const { data, loading, error, reload, reportError } = useAsyncData(fetchUsers, mapUsersError);
  const users = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const onDelete = async (user: UserResponse) => {
    try {
      await deleteUser(user.id);
      setConfirmDeleteId(null);
      reload();
    } catch (err) {
      reportError(mapUsersError(err));
      setConfirmDeleteId(null);
    }
  };

  const isSelf = (u: UserResponse) => u.id === currentUserId;

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center">
              <UsersIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Usuarios</h1>
              <p className="text-sm text-slate-500">Administra el personal de tu tienda</p>
            </div>
          </div>
          <Link
            to="/pos/users/new"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium px-4 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            <Plus className="w-4 h-4" /> Nuevo usuario
          </Link>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="roleFilter" className="text-sm text-slate-600">
            Rol
          </label>
          <select
            id="roleFilter"
            value={roleFilter}
            onChange={(e) => {
              setPage(0);
              setRoleFilter(e.target.value as RoleFilter);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 md:py-2.5 text-sm text-slate-900 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
          >
            <option value="ALL">Todos</option>
            <option value="OWNER">Dueños</option>
            <option value="CASHIER">Cajeros</option>
          </select>
          <label htmlFor="activeFilter" className="text-sm text-slate-600">
            Estado
          </label>
          <select
            id="activeFilter"
            value={activeFilter}
            onChange={(e) => {
              setPage(0);
              setActiveFilter(e.target.value as ActiveFilter);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 md:py-2.5 text-sm text-slate-900 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
          <div className="relative flex-1 min-w-48">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o usuario..."
              aria-label="Buscar usuarios"
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 md:py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
            />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Mobile card list — hidden on md+ */}
        <ul className="space-y-3 md:hidden">
          {loading && (
            <li className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-400 shadow-sm">
              Cargando...
            </li>
          )}
          {!loading && filteredUsers.length === 0 && (
            <li className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-400 shadow-sm">
              No hay usuarios.
            </li>
          )}
          {!loading &&
            filteredUsers.map((u) => (
              <li
                key={u.id}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="font-medium text-slate-900">{u.fullName}</p>
                    <p className="font-mono text-xs text-slate-500">{u.username}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_BADGE[u.role]}`}
                    >
                      {u.role}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${u.active ? ACTIVE_BADGE : INACTIVE_BADGE}`}
                    >
                      {u.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>

                {confirmDeleteId === u.id ? (
                  <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                    <p className="text-sm text-rose-700">
                      ¿Desactivar a &ldquo;{u.fullName}&rdquo;?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void onDelete(u)}
                        className="flex-1 rounded-md bg-rose-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/pos/users/${u.id}/edit`)}
                      className="flex-1 min-w-32 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      <Pencil className="w-4 h-4" /> Editar
                    </button>
                    {!isSelf(u) && (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(u.id)}
                        className="flex-1 min-w-32 inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2.5 text-sm text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                      >
                        <Trash2 className="w-4 h-4" /> Eliminar
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
        </ul>

        {/* Desktop table — hidden on mobile */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Creado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Cargando...
                  </td>
                </tr>
              )}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No hay usuarios.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredUsers.map((u) => (
                  <Fragment key={u.id}>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-900">{u.username}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{u.fullName}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_BADGE[u.role]}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${u.active ? ACTIVE_BADGE : INACTIVE_BADGE}`}
                        >
                          {u.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/pos/users/${u.id}/edit`)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Editar
                          </button>
                          {!isSelf(u) && (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(u.id)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {confirmDeleteId === u.id && (
                      <tr className="bg-rose-50">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <p className="flex-1 text-sm text-rose-700">
                              ¿Desactivar a &ldquo;{u.fullName}&rdquo;?
                            </p>
                            <button
                              type="button"
                              onClick={() => void onDelete(u)}
                              className="rounded-md bg-rose-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Página {totalPages === 0 ? 0 : page + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Go to previous page"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Anterior
            </button>
            <button
              type="button"
              aria-label="Go to next page"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1 || loading}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
