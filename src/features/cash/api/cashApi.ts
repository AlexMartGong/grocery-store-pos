import axios from "axios";
import { apiClient } from "../../../shared/api/api";
import type { PageResponse } from "../../../shared/types";
import type {
  CashShiftResponse,
  CloseShiftRequest,
  OpenShiftRequest,
} from "../types";

export async function openShift(opening_balance: string): Promise<CashShiftResponse> {
  const body: OpenShiftRequest = { opening_balance };
  const res = await apiClient.post<CashShiftResponse>("/cash/shifts/open", body);
  return res.data;
}

export async function getCurrentShift(): Promise<CashShiftResponse | null> {
  try {
    const res = await apiClient.get<CashShiftResponse>("/cash/shifts/current");
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

export async function getShiftPreview(): Promise<CashShiftResponse> {
  const res = await apiClient.get<CashShiftResponse>("/cash/shifts/current/preview");
  return res.data;
}

export async function closeShift(
  real_balance: string,
  notes?: string,
): Promise<CashShiftResponse> {
  const body: CloseShiftRequest = { real_balance, ...(notes ? { notes } : {}) };
  const res = await apiClient.post<CashShiftResponse>("/cash/shifts/current/close", body);
  return res.data;
}

export async function getShiftHistory(params: {
  page: number;
  size: number;
  sort?: string;
}): Promise<PageResponse<CashShiftResponse>> {
  const { page, size, sort = "openedAt,desc" } = params;
  const res = await apiClient.get<PageResponse<CashShiftResponse>>("/cash/shifts", {
    params: { page, size, sort },
  });
  return res.data;
}
