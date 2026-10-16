import { useCallback, useEffect, useId, useState } from "react";
import { Loader2, Search, Store as StoreIcon, X } from "lucide-react";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import { getStores } from "../../stores/api/storesApi";
import { mapStoresError } from "../../stores/utils/errorMessages";

/** Just enough of a store to target a subscription call and label the UI. */
export interface StoreOption {
  id: string;
  name: string;
}

interface StorePickerProps {
  value: StoreOption | null;
  onChange: (store: StoreOption | null) => void;
  disabled?: boolean;
}

const RESULT_LIMIT = 8;

/**
 * Remote-searched store selector. Only ACTIVE stores are offered — a CANCELED tenant has nothing
 * to bill. Reuses `getStores` rather than adding a second store-listing call.
 */
export const StorePicker = ({ value, onChange, disabled = false }: StorePickerProps) => {
  const inputId = useId();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [results, setResults] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (value) return;
    setLoading(true);
    setError(null);
    try {
      const page = await getStores(0, RESULT_LIMIT, "ACTIVE", debouncedSearch || undefined);
      setResults(page.content.map((s) => ({ id: s.id, name: s.name })));
    } catch (err) {
      setError(mapStoresError(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, value]);

  useEffect(() => {
    void load();
  }, [load]);

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        <StoreIcon aria-hidden className="h-4 w-4 shrink-0 text-slate-500" />
        <span className="flex-1 truncate text-sm font-medium text-slate-900">{value.name}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          aria-label={`Quitar ${value.name} y elegir otra tienda`}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
        <input
          id={inputId}
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          disabled={disabled}
          placeholder="Buscar por nombre o código..."
          aria-label="Buscar tienda"
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-500">
          {error}
        </p>
      )}

      <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-1">
        {loading && (
          <li className="flex items-center justify-center py-6 text-slate-400">
            <Loader2 aria-label="Buscando tiendas" className="h-5 w-5 animate-spin" />
          </li>
        )}
        {!loading && results.length === 0 && (
          <li className="py-6 text-center text-sm text-slate-400">No se encontraron tiendas.</li>
        )}
        {!loading &&
          results.map((store) => (
            <li key={store.id}>
              <button
                type="button"
                onClick={() => onChange(store)}
                disabled={disabled}
                className="w-full rounded-md px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {store.name}
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
};
