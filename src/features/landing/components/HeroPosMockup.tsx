import { Check, ReceiptText, Scale, ShoppingCart } from "lucide-react";

const TICKET_LINES = [
  { name: "Jitomate saladet", detail: "1.250 kg × $32.00", total: "$40.00" },
  { name: "Queso fresco", detail: "0.480 kg × $145.00", total: "$69.60" },
  { name: "Refresco 600 ml", detail: "2 pz × $18.00", total: "$36.00" },
] as const;

const QUICK_CASH = ["$50", "$100", "$200", "$500"] as const;
const PRESSED_CASH = "$200";

/**
 * Static illustration of the checkout screen (live scale, quick ticket, exact-cash row). Exposed
 * as a single image: every child is a plain <div>/<span>, never a real control.
 */
export const HeroPosMockup = () => (
  <div
    role="img"
    aria-label="Vista previa de la pantalla de cobro de VentaCore: la báscula marca 1.250 kg estable, un ticket con tres productos por $145.60 y botones de efectivo rápido con cambio de $54.40."
    className="relative mx-auto w-full max-w-md select-none lg:rotate-1"
  >
    <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-indigo-500/20 blur-2xl" />
    <div className="rounded-3xl border border-slate-700 bg-slate-800/90 p-3 shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between px-2 pb-3 text-xs">
        <span className="font-semibold text-slate-200">Caja 1 · Venta</span>
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
          Turno abierto
        </span>
      </div>

      <div className="space-y-3 rounded-2xl bg-slate-50 p-3 text-slate-900">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <Scale className="h-4 w-4" />
              Báscula en vivo
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <Check className="h-3 w-3" />
              Estable
            </span>
          </div>
          <p className="mt-2 font-mono text-4xl font-bold tabular-nums tracking-tight">
            1.250 <span className="text-lg font-semibold text-slate-500">kg</span>
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white">
            <ShoppingCart className="h-4 w-4" />
            Agregar 1.250 kg
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <ReceiptText className="h-4 w-4" />
            Ticket
          </span>
          <ul className="mt-2 divide-y divide-dashed divide-slate-200">
            {TICKET_LINES.map((line) => (
              <li key={line.name} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{line.name}</span>
                  <span className="block font-mono text-xs text-slate-500">{line.detail}</span>
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums">{line.total}</span>
              </li>
            ))}
          </ul>
          <div className="mt-1 flex items-baseline justify-between border-t-2 border-slate-900 pt-3">
            <span className="text-sm font-semibold uppercase tracking-wide">Total</span>
            <span className="font-mono text-2xl font-bold tabular-nums">$145.60</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {QUICK_CASH.map((amount) => (
            <span
              key={amount}
              className={`flex h-11 items-center justify-center rounded-lg border bg-white font-mono text-sm font-semibold tabular-nums ${
                amount === PRESSED_CASH
                  ? "border-emerald-500 text-emerald-700 ring-2 ring-emerald-200"
                  : "border-slate-200 text-slate-700"
              }`}
            >
              {amount}
            </span>
          ))}
          <span className="flex h-11 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white">
            Exacto
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3 text-white">
          <span className="text-sm text-slate-300">Cambio</span>
          <span className="font-mono text-xl font-bold tabular-nums text-emerald-400">$54.40</span>
        </div>
      </div>
    </div>
  </div>
);
