import { apiClient } from "../../../shared/api/api";
import type { PageResponse } from "../../../shared/types";
import type {
  CreateCustomerRequest,
  CustomerResponse,
  UpdateCustomerRequest,
} from "../types";

export async function getCustomers(
  page = 0,
  size = 20,
  active?: boolean,
  search?: string,
): Promise<PageResponse<CustomerResponse>> {
  const res = await apiClient.get<PageResponse<CustomerResponse>>("/customers", {
    params: {
      page,
      size,
      ...(active !== undefined ? { active } : {}),
      ...(search ? { search } : {}),
    },
  });
  return res.data;
}

export async function getCustomerById(id: string): Promise<CustomerResponse> {
  const res = await apiClient.get<CustomerResponse>(`/customers/${id}`);
  return res.data;
}

export async function createCustomer(
  data: CreateCustomerRequest,
): Promise<CustomerResponse> {
  const res = await apiClient.post<CustomerResponse>("/customers", data);
  return res.data;
}

export async function updateCustomer(
  id: string,
  data: UpdateCustomerRequest,
): Promise<CustomerResponse> {
  const res = await apiClient.put<CustomerResponse>(`/customers/${id}`, data);
  return res.data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiClient.delete(`/customers/${id}`);
}
