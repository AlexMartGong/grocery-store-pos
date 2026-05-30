import { apiClient } from "../../../shared/api/api";
import type {
  RegisterSaasPaymentRequest,
  SaasPaymentResponse,
} from "../types/subscriptions";

export const registerSaasPayment = async (
  storeId: string,
  data: RegisterSaasPaymentRequest,
): Promise<SaasPaymentResponse> => {
  const { data: res } = await apiClient.post<SaasPaymentResponse>(
    `/admin/stores/${storeId}/payments`,
    data,
  );
  return res;
};
