import { ShoppingCart } from "lucide-react";

export const PosPlaceholder = () => (
  <div className="px-4 py-8">
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto w-12 h-12 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center">
        <ShoppingCart className="w-6 h-6" />
      </div>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900">Módulo POS</h1>
      <p className="mt-2 text-sm text-slate-500">Próximamente.</p>
    </div>
  </div>
);
