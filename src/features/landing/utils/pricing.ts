import type { LandingBillingCycle, LandingPlan } from "../types";

const PRICE_FMT = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** "$2,990" — landing prices are whole pesos. */
export const formatPrice = (amount: number): string => PRICE_FMT.format(amount);

export const CYCLE_LABEL: Record<LandingBillingCycle, string> = {
  MONTHLY: "Mensual",
  YEARLY: "Anual",
};

export const CYCLE_UNIT: Record<LandingBillingCycle, string> = {
  MONTHLY: "mes",
  YEARLY: "año",
};

export const planPrice = (plan: LandingPlan, cycle: LandingBillingCycle): number =>
  cycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;

/** Pre-filled WhatsApp text, e.g. "… el plan Pro (Mensual - $499/mes) de VentaCore." */
export const planContactMessage = (plan: LandingPlan, cycle: LandingBillingCycle): string =>
  `Hola, me interesa contratar el plan ${plan.name} ` +
  `(${CYCLE_LABEL[cycle]} - ${formatPrice(planPrice(plan, cycle))}/${CYCLE_UNIT[cycle]}) de VentaCore.`;
