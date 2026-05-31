import { useCallback, useEffect, useState } from "react";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import { getSalesToday } from "../api/dashboardApi";
import { mapDashboardError } from "../utils/errorMessages";
import type { SalesTodayResponse } from "../types";
import { SalesTodayCard } from "./SalesTodayCard";
import { ProductsToRestockCard } from "./ProductsToRestockCard";
import { ActivityFeed } from "./ActivityFeed";

export const DashboardScreen = () => {
  const [salesData, setSalesData] = useState<SalesTodayResponse | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const loadSales = useCallback(async () => {
    setSalesLoading(true);
    setSalesError(null);
    try {
      const data = await getSalesToday();
      setSalesData(data);
    } catch (err) {
      setSalesError(mapDashboardError(err));
    } finally {
      setSalesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSales();
  }, [loadSales]);

  const handleSync = () => {
    setRefreshNonce((n) => n + 1);
    void loadSales();
  };

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <LayoutDashboard size={20} aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500">Resumen de tu negocio</p>
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={salesLoading}
            aria-label="Sincronizar métricas"
            className="ml-auto inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} className={salesLoading ? "animate-spin" : ""} aria-hidden />
            Sincronizar
          </button>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <SalesTodayCard data={salesData} loading={salesLoading} error={salesError} />
            <ProductsToRestockCard key={refreshNonce} />
          </div>
          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
};
