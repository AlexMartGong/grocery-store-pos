// SaaS subscription management DTOs (admin / SUPER_ADMIN only).
//
// Wire format is snake_case: every field on these backend records carries an explicit
// @JsonProperty. Sibling admin DTOs (StoreResponse, SaasPaymentResponse) are camelCase — the
// backend has no global naming strategy, so the format is per-DTO. Do not "normalize" these.
//
// Monetary fields cross the wire as JSON numbers but are typed `string` here per the BigDecimal
// convention. Date fields are ISO LocalDate strings ("2026-08-14"), no time component.

export type BillingCycle = "MONTHLY" | "YEARLY";

export type SubscriptionStatus = "ACTIVE" | "OVERDUE" | "CANCELED";

/**
 * GET /admin/plans. No `active` field on the wire — the endpoint already filters to active
 * plans server-side.
 */
export interface SubscriptionPlanResponse {
  id: string;
  code: string;
  name: string;
  monthly_fee: string;
  yearly_fee: string;
  setup_fee: string;
  max_stations: number;
  includes_notifications: boolean;
  includes_invoicing: boolean;
  description: string;
}

/**
 * POST /admin/stores/:storeId/subscription.
 *
 * The backend record accepts these two fields and nothing else. Payment method and notes belong
 * to POST /admin/stores/:storeId/payments (see admin/types/subscriptions.ts) — sending them here
 * would be silently dropped.
 */
export interface ChangePlanRequest {
  plan_code: string;
  billing_cycle: BillingCycle;
}

/** GET/POST /admin/stores/:storeId/subscription. `store_id` is omitted — it's in the path. */
export interface SubscriptionResponse {
  id: string;
  plan_code: string;
  plan_name: string;
  billing_cycle: BillingCycle;
  amount_due: string;
  start_date: string;
  next_billing_date: string;
  status: SubscriptionStatus;
  max_stations: number;
  includes_notifications: boolean;
  includes_invoicing: boolean;
}

/**
 * GET /admin/subscriptions/upcoming-billings — ACTIVE subscriptions billing within 7 days,
 * soonest first. Unbounded below, so rows already past due (still inside the scheduler's grace
 * period) show up here too.
 *
 * `amount_due` is cycle-aware: a YEARLY subscriber owes 10x the monthly fee.
 * `whatsapp` is nullable — stores.whatsapp is an optional column.
 */
export interface UpcomingBillingResponse {
  store_id: string;
  store_name: string;
  whatsapp: string | null;
  next_billing_date: string;
  billing_cycle: BillingCycle;
  amount_due: string;
}

/**
 * GET /admin/subscriptions/summary. `tier_distribution` lists every active tier in ascending
 * price order, zero-count ones included — render it as-is, no merge with the plan catalog needed.
 */
export interface SubscriptionSummaryResponse {
  active_subscriptions: number;
  due_next_7_days: number;
  due_next_7_days_amount: string;
  tier_distribution: Record<string, number>;
}
