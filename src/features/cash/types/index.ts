export type CashShiftStatus = "OPEN" | "CLOSED";

export interface CashShiftResponse {
  id: string;
  store_id: string;
  user_id: string;
  status: CashShiftStatus;
  opened_at: string;
  closed_at: string | null;
  opening_balance: string;
  expected_balance: string | null;
  real_balance: string | null;
  difference: string | null;
  notes: string | null;
}

export interface OpenShiftRequest {
  opening_balance: string;
}

export interface CloseShiftRequest {
  real_balance: string;
  notes?: string;
}
