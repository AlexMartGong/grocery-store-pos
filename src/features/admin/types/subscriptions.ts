// SaaS subscription billing DTOs (admin / SUPER_ADMIN only).
// Endpoint: POST /admin/stores/:storeId/payments — registers a monthly subscription payment.
// Backend serializes these as camelCase (no @JsonProperty). Monetary/date fields cross the
// wire as JSON numbers/ISO strings but are typed `string` here per the BigDecimal convention.

// UI offers only CASH / TRANSFER. The backend enum also includes CARD, intentionally not
// surfaced for manual SaaS payment registration.
export type PaymentMethod = "CASH" | "TRANSFER";

export type SaasPaymentConcept = "SETUP_FEE" | "MONTHLY_FEE";

export type SubscriptionStatus = "ACTIVE" | "OVERDUE" | "CANCELED";

export interface RegisterSaasPaymentRequest {
  amount: string; // BigDecimal as string (2-decimal)
  method: PaymentMethod;
  notes?: string;
}

export interface SaasPaymentResponse {
  id: string;
  storeId: string;
  amount: string;
  concept: SaasPaymentConcept;
  paymentMethod: PaymentMethod;
  periodStart: string; // ISO LocalDate (e.g. "2026-05-01")
  periodEnd: string;
  nextBillingDate: string;
  subscriptionStatus: SubscriptionStatus;
}
