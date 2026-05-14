import { apiClient } from "../../../shared/api/api";
import type { PageResponse } from "../../../shared/types";
import type {
  CreateStoreRequest,
  StoreProfileResponse,
  StoreResponse,
  StoreStatus,
  UpdateStoreRequest,
} from "../types";

export async function getStores(
  page = 0,
  size = 10,
  status?: StoreStatus,
  search?: string,
): Promise<PageResponse<StoreResponse>> {
  const res = await apiClient.get<PageResponse<StoreResponse>>("/stores", {
    params: {
      page,
      size,
      ...(status ? { status } : {}),
      ...(search ? { search } : {}),
    },
  });
  return res.data;
}

export async function getStoreById(id: string): Promise<StoreResponse> {
  const res = await apiClient.get<StoreResponse>(`/stores/${id}`);
  return res.data;
}

export async function createStore(data: CreateStoreRequest): Promise<StoreResponse> {
  const res = await apiClient.post<StoreResponse>("/stores", data);
  return res.data;
}

export async function updateStore(
  id: string,
  data: UpdateStoreRequest,
): Promise<StoreResponse> {
  const res = await apiClient.put<StoreResponse>(`/stores/${id}`, data);
  return res.data;
}

export async function deleteStore(id: string): Promise<void> {
  await apiClient.delete(`/stores/${id}`);
}

export const getMyStoreProfile = async (): Promise<StoreProfileResponse> => {
  const res = await apiClient.get<StoreProfileResponse>("/stores/me");
  return res.data;
};
