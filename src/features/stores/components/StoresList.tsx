import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, BadgeDollarSign, Monitor, Pencil, Plus, Search, Store as StoreIcon, Trash2, UserPlus } from "lucide-react";
import { deleteStore, getStores } from "../api/storesApi";
import { mapStoresError } from "../utils/errorMessages";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import { useAsyncData } from "../../../shared/hooks/useAsyncData";
import { RegisterSaasPaymentModal } from "../../admin/components/RegisterSaasPaymentModal";
import { CreateStationModal } from "../../admin/components/CreateStationModal";
import type { StoreResponse, StoreStatus } from "../types";

const PAGE_SIZE = 10;
type StatusFilter = "ALL" | StoreStatus;

const STATUS_BADGE: Record<StoreStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  SUSPENDED: "bg-amber-100 text-amber-700 ring-amber-200",
  CANCELED: "bg-rose-100 text-rose-700 ring-rose-200",
};

export const StoresList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [paymentStore, setPaymentStore] = useState<StoreResponse | null>(null);
  const [stationStore, setStationStore] = useState<StoreResponse | null>(null);

  // A new search sends the list back to page 0 — adjusted during render, not in an effect.
  const [pageSearch, setPageSearch] = useState(debouncedSearch);
  if (pageSearch !== debouncedSearch) {
    setPageSearch(debouncedSearch);
    setPage(0);
  }

  const fetchStores = useCallback(
    () =>
      getStores(
        page,
        PAGE_SIZE,
        statusFilter === "ALL" ? undefined : statusFilter,
        debouncedSearch || undefined,
      ),
    [page, statusFilter, debouncedSearch],
  );
  const { data, loading, error, reload, reportError } = useAsyncData(fetchStores, mapStoresError);
  const stores: StoreResponse[] = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const onDelete = async (store: StoreResponse) => {
    try {
      await deleteStore(store.id);
      setConfirmDeleteId(null);
      reload();
    } catch (err) {
      reportError(mapStoresError(err));
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center">
              <StoreIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Stores</h1>
              <p className="text-sm text-slate-500">Manage tenant stores on the platform</p>
            </div>
          </div>
          <Link
            to="/admin/stores/new"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium px-4 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            <Plus className="w-4 h-4" /> New store
          </Link>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="statusFilter" className="text-sm text-slate-600">
            Status
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => {
              setPage(0);
              setStatusFilter(e.target.value as StatusFilter);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
          >
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="CANCELED">Canceled</option>
          </select>
          <div className="relative flex-1 min-w-48">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre o código..."
              aria-label="Buscar tiendas"
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
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
              Loading...
            </li>
          )}
          {!loading && stores.length === 0 && (
            <li className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-400 shadow-sm">
              No stores found.
            </li>
          )}
          {!loading &&
            stores.map((s) => (
              <li
                key={s.id}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="font-medium text-slate-900">{s.name}</p>
                    <p className="font-mono text-xs text-slate-500">{s.code}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset shrink-0 ${STATUS_BADGE[s.status]}`}
                  >
                    {s.status}
                  </span>
                </div>

                {confirmDeleteId === s.id ? (
                  <div
                    role="alertdialog"
                    aria-label="Confirmar cancelación de tienda"
                    className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2"
                  >
                    <p className="flex-1 text-sm text-rose-700">Cancel this store?</p>
                    <button
                      type="button"
                      onClick={() => void onDelete(s)}
                      className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      Abort
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/stores/${s.id}/edit`)}
                      className="flex-1 min-w-32 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                    <button
                      type="button"
                      disabled={s.status === "CANCELED"}
                      title={
                        s.status === "CANCELED"
                          ? "Cannot provision users for canceled stores"
                          : "Provision Store Owner"
                      }
                      onClick={() => navigate(`/admin/stores/${s.id}/provision-owner`)}
                      aria-label={
                        s.status === "CANCELED"
                          ? "Cannot provision users for canceled stores"
                          : `Provision owner for ${s.name}`
                      }
                      className="flex-1 min-w-32 inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                    >
                      <UserPlus className="w-4 h-4" /> Provision owner
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentStore(s)}
                      aria-label={`Registrar pago para ${s.name}`}
                      className="flex-1 min-w-32 inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2.5 text-sm text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    >
                      <BadgeDollarSign className="w-4 h-4" /> Registrar pago
                    </button>
                    <button
                      type="button"
                      onClick={() => setStationStore(s)}
                      aria-label={`Nueva caja para ${s.name}`}
                      className="flex-1 min-w-32 inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-2.5 text-sm text-sky-700 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    >
                      <Monitor className="w-4 h-4" /> Nueva caja
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(s.id)}
                      className="flex-1 min-w-32 inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2.5 text-sm text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
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
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">WhatsApp</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && stores.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No stores found.
                  </td>
                </tr>
              )}
              {!loading &&
                stores.map((s) => (
                  <>
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-900">{s.code}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                      <td className="px-4 py-3">{s.ownerName ?? "—"}</td>
                      <td className="px-4 py-3">{s.whatsapp ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_BADGE[s.status]}`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/stores/${s.id}/edit`)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            disabled={s.status === "CANCELED"}
                            title={
                              s.status === "CANCELED"
                                ? "Cannot provision users for canceled stores"
                                : "Provision Store Owner"
                            }
                            onClick={() => navigate(`/admin/stores/${s.id}/provision-owner`)}
                            aria-label={
                              s.status === "CANCELED"
                                ? "Cannot provision users for canceled stores"
                                : `Provision owner for ${s.name}`
                            }
                            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Owner
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentStore(s)}
                            title="Registrar pago de suscripción"
                            aria-label={`Registrar pago para ${s.name}`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                          >
                            <BadgeDollarSign className="w-3.5 h-3.5" /> Pago
                          </button>
                          <button
                            type="button"
                            onClick={() => setStationStore(s)}
                            title="Nueva estación de impresión"
                            aria-label={`Nueva caja para ${s.name}`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-white px-3 py-2 text-sm text-sky-700 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                          >
                            <Monitor className="w-3.5 h-3.5" /> Caja
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(s.id)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {confirmDeleteId === s.id && (
                      <tr key={`confirm-${s.id}`} className="bg-rose-50">
                        <td colSpan={7} className="px-4 py-3">
                          <div
                            role="alertdialog"
                            aria-label="Confirmar cancelación de tienda"
                            className="flex items-center gap-3"
                          >
                            <p className="flex-1 text-sm text-rose-700">
                              Cancel store &ldquo;{s.name}&rdquo;? This sets status to CANCELED.
                            </p>
                            <button
                              type="button"
                              onClick={() => void onDelete(s)}
                              className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            >
                              Abort
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Go to previous page"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Prev
            </button>
            <button
              type="button"
              aria-label="Go to next page"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1 || loading}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <RegisterSaasPaymentModal
        open={paymentStore != null}
        store={paymentStore}
        onClose={() => setPaymentStore(null)}
        onSuccess={reload}
      />

      <CreateStationModal
        open={stationStore != null}
        store={stationStore}
        onClose={() => setStationStore(null)}
        onSuccess={() => {}}
      />
    </div>
  );
};
