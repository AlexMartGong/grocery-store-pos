export interface CustomerResponse {
  id: string;
  full_name: string;
  phone: string | null;
  outstanding_balance: string;
  credit_limit: string;
  active: boolean;
  created_at: string;
}

export interface CreateCustomerRequest {
  full_name: string;
  phone?: string;
  credit_limit: string;
}

export type UpdateCustomerRequest = CreateCustomerRequest;
