import { LayoutDashboard, PackageX, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { ActivityFeed } from "./ActivityFeed";

// Placeholder metric card — wired to SQL views in a later pass.
const PlaceholderCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) => (
  <article className="rounded-xl border border-dashed border-slate-200 bg-white p-4 md:p-8">
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-medium text-slate-600">{title}</h2>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        {icon}
      </span>
    </div>
    <p className="mt-4 text-3xl font-bold text-slate-300">{value}</p>
    <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">Próximamente</p>
  </article>
);

export const DashboardScreen = () => {
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
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <PlaceholderCard
              title="Ventas del Día"
              value="—"
              icon={<TrendingUp size={16} aria-hidden />}
            />
            <PlaceholderCard
              title="Productos por Agotar"
              value="—"
              icon={<PackageX size={16} aria-hidden />}
            />
          </div>
          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
};
