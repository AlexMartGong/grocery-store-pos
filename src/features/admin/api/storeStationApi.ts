import { apiClient } from "../../../shared/api/api";
import type { StoreStationResponse } from "../../../shared/api/agentApi";
import type { CreateStoreStationRequest } from "../../stores/types";

export const createStoreStation = async (
  storeId: string,
  data: CreateStoreStationRequest,
): Promise<StoreStationResponse> => {
  const { data: res } = await apiClient.post<StoreStationResponse>(
    `/admin/stores/${storeId}/stations`,
    data,
  );
  return res;
};
