import { apiClient } from "../../../shared/api/api";
import type { CreateUserRequest, UserResponse } from "../../users/types";

export async function provisionStoreOwner(
  storeId: string,
  data: CreateUserRequest,
): Promise<UserResponse> {
  const { data: res } = await apiClient.post<UserResponse>(
    `/admin/stores/${storeId}/users`,
    data,
  );
  return res;
}
