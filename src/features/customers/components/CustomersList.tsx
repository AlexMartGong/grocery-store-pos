import { Fragment, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  DollarSign,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { deleteCustomer, getCustomers } from "../api/customersApi";
import { mapCustomersError } from "../utils/errorMessages";
import { useAuthStore } from "../../auth/store/authStore";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import { RegisterPaymentModal } from "./RegisterPaymentModal";
import type { CustomerResponse } from "../types";

const PAGE_SIZE = 20;
type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

const STATUS_BADGE: Record<"ACTIVE" | "INACTIVE", string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  INACTIVE: "bg-slate-100 text-slate-600 ring-slate-200",
};

const formatMoney = (value: string) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
};

const isHighCredit = (c: CustomerResponse): boolean => {
  const limit = Number(c.credit_limit);
  const balance = Number(c.outstanding_balance);
  if (!Number.isFinite(limit) || !Number.isFinite(balance) || limit <= 0) return false;
  return balance / limit >= 0.9;
};

const hasDebt = (c: CustomerResponse): boolean => {
  const balance = Number(c.outstanding_balance);
  return Number.isFinite(balance) && balance > 0;
};

export const CustomersList = () => {
  const navigate = useNavigate();
  const isOwner = useAuthStore((s) => s.user?.role === "OWNER");

  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ACTIVE");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [paymentCustomer, setPaymentCustomer] = useState<CustomerResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const active =
        activeFilter === "ALL" ? undefined : activeFilter === "ACTIVE";
      const data = await getCustomers(
        page,
        PAGE_SIZE,
        active,
        debouncedSearch || undefined,
      );
      setCustomers(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(mapCustomersError(err));
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter, debouncedSearch]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  const onDelete = async (customer: CustomerResponse) => {
    try {
      await deleteCustomer(customer.id);
      setConfirmDeleteId(null);
      await load();
    } catch (err) {
      setError(mapCustomersError(err));
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-800">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
              <p className="text-sm text-slate-500">
                Administra clientes y crédito de tu tienda
              </p>
            </div>
          </div>
          {isOwner && (
            <Link
              to="/pos/customers/new"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 font-medium text-white transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              <Plus className="h-4 w-4" /> Nuevo cliente
            </Link>
          )}
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="activeFilter" className="text-sm text-slate-600">
            Mostrar
          </label>
          <select
            id="activeFilter"
            value={activeFilter}
            onChange={(e) => {
              setPage(0);
              setActiveFilter(e.target.value as ActiveFilter);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
          >
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
            <option value="ALL">Todos</option>
          </select>
          <div className="relative min-w-48 flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
              aria-label="Buscar clientes"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
            />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Mobile cards */}
        <ul className="space-y-3 md:hidden">
          {loading && (
            <li className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-400 shadow-sm">
              Cargando...
            </li>
          )}
          {!loading && customers.length === 0 && (
            <li className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-400 shadow-sm">
              Sin clientes.
            </li>
          )}
          {!loading &&
            customers.map((c) => {
              const high = isHighCredit(c);
              return (
                <li
                  key={c.id}
                  className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="font-medium text-slate-900">{c.full_name}</p>
                      <p className="text-xs text-slate-500">{c.phone ?? "—"}</p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        c.active ? STATUS_BADGE.ACTIVE : STATUS_BADGE.INACTIVE
                      }`}
                    >
                      {c.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
                    <span>
                      <span className="text-slate-500">Límite:</span>{" "}
                      <span className="font-medium tabular-nums">
                        {formatMoney(c.credit_limit)}
                      </span>
                    </span>
                    <span
                      title={
                        high ? "Saldo cercano al límite de crédito" : undefined
                      }
                      className={
                        high
                          ? "font-semibold text-rose-600"
                          : "font-medium text-slate-700"
                      }
                    >
                      <span className={high ? "text-rose-600" : "text-slate-500"}>
                        Balance:
                      </span>{" "}
                      {high && (
                        <AlertTriangle
                          aria-hidden
                          className="mr-1 inline h-4 w-4"
                        />
                      )}
                      <span className="tabular-nums">
                        {formatMoney(c.outstanding_balance)}
                      </span>
                    </span>
                  </div>

                  {confirmDeleteId === c.id ? (
                    <div
                      role="alertdialog"
                      aria-label="Confirmar desactivación de cliente"
                      className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2"
                    >
                      <p className="text-sm text-rose-700">
                        ¿Desactivar &ldquo;{c.full_name}&rdquo;?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void onDelete(c)}
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
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => navigate(`/pos/customers/${c.id}/edit`)}
                          className="inline-flex min-w-32 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                          <Pencil className="h-4 w-4" /> Editar
                        </button>
                      )}
                      <Link
                        to={`/pos/sales-history?customerId=${c.id}`}
                        title="Ver historial de compras"
                        aria-label={`Ver historial de compras de ${c.full_name}`}
                        className="inline-flex min-w-32 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      >
                        <ReceiptText className="h-4 w-4" /> Historial
                      </Link>
                      {hasDebt(c) && (
                        <button
                          type="button"
                          onClick={() => setPaymentCustomer(c)}
                          className="inline-flex min-w-32 flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        >
                          <DollarSign className="h-4 w-4" /> Abonar
                        </button>
                      )}
                      {isOwner && c.active && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(c.id)}
                          className="inline-flex min-w-32 flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2.5 text-sm text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                        >
                          <Trash2 className="h-4 w-4" /> Desactivar
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
        </ul>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 text-right font-medium">Límite de crédito</th>
                <th className="px-4 py-3 text-right font-medium">Balance pendiente</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
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
              {!loading && customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Sin clientes.
                  </td>
                </tr>
              )}
              {!loading &&
                customers.map((c) => {
                  const high = isHighCredit(c);
                  return (
                    <Fragment key={c.id}>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {c.full_name}
                        </td>
                        <td className="px-4 py-3">{c.phone ?? "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatMoney(c.credit_limit)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right tabular-nums ${
                            high ? "font-semibold text-rose-600" : ""
                          }`}
                          title={
                            high
                              ? "Saldo cercano al límite de crédito"
                              : undefined
                          }
                        >
                          {high && (
                            <AlertTriangle
                              aria-hidden
                              className="mr-1 inline h-4 w-4"
                            />
                          )}
                          {formatMoney(c.outstanding_balance)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                              c.active
                                ? STATUS_BADGE.ACTIVE
                                : STATUS_BADGE.INACTIVE
                            }`}
                          >
                            {c.active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {isOwner && (
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/pos/customers/${c.id}/edit`)
                                }
                                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                              >
                                <Pencil className="h-3.5 w-3.5" /> Editar
                              </button>
                            )}
                            <Link
                              to={`/pos/sales-history?customerId=${c.id}`}
                              title="Ver historial de compras"
                              aria-label={`Ver historial de compras de ${c.full_name}`}
                              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            >
                              <ReceiptText className="h-3.5 w-3.5" /> Historial
                            </Link>
                            {hasDebt(c) && (
                              <button
                                type="button"
                                onClick={() => setPaymentCustomer(c)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                              >
                                <DollarSign className="h-3.5 w-3.5" /> Abonar
                              </button>
                            )}
                            {isOwner && c.active && (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(c.id)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Desactivar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {confirmDeleteId === c.id && (
                        <tr className="bg-rose-50">
                          <td colSpan={6} className="px-4 py-3">
                            <div
                              role="alertdialog"
                              aria-label="Confirmar desactivación de cliente"
                              className="flex items-center gap-3"
                            >
                              <p className="flex-1 text-sm text-rose-700">
                                ¿Desactivar cliente &ldquo;{c.full_name}&rdquo;?
                              </p>
                              <button
                                type="button"
                                onClick={() => void onDelete(c)}
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
                  );
                })}
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
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              aria-label="Go to next page"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1 || loading}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <RegisterPaymentModal
        isOpen={!!paymentCustomer}
        customer={paymentCustomer}
        onClose={() => setPaymentCustomer(null)}
        onSuccess={load}
      />
    </div>
  );
};
