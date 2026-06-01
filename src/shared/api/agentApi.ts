import axios from "axios";
import { apiClient } from "./api";
import { useSettingsStore } from "../../features/settings/store/settingsStore";

export interface AgentSaleDetailDTO {
  detailId: number | null;
  saleId: number | null;
  saleDate: string | null;
  productId: number | null;
  productName: string;
  productCategory: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  total: number;
}

export interface AgentTicketDTO {
  businessName: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  id: string;
  employeeId: number | null;
  employeeName: string | null;
  employeePhone: string | null;
  deliveryOrderId: number | null;
  customerId: number | null;
  customerName: string | null;
  customerPhone: string | null;
  customerDiscount: number;
  deliveryAddress: string | null;
  paymentMethodId: number | null;
  paymentMethodName: string | null;
  datetime: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  amountTendered: number;
  changeDue: number;
  paid: boolean;
  notes: string | null;
  saleDetails: AgentSaleDetailDTO[];
}

export interface AgentPrintResponse {
  ticketId: number;
  success: boolean;
  error?: string;
}

export interface ScaleReadingDTO {
  weight: number;
  isStable: boolean;
  error?: string | null;
}

interface AgentScaleResponse {
  success: boolean;
  weight?: number;
  unit?: string;
  stable?: boolean;
  connected?: boolean;
  error?: string | null;
}

const agentClient = axios.create({
  timeout: 8000,
  headers: { "Content-Type": "application/json" },
});

export const printTicket = async (
  ticket: AgentTicketDTO,
): Promise<AgentPrintResponse> => {
  const baseUrl = useSettingsStore.getState().localAgentUrl;
  const res = await agentClient.post<AgentPrintResponse>(
    `${baseUrl}/api/printer/print`,
    ticket,
  );
  return res.data;
};

export const pingAgent = async (urlOverride?: string): Promise<boolean> => {
  const baseUrl = urlOverride ?? useSettingsStore.getState().localAgentUrl;
  try {
    await agentClient.options(`${baseUrl}/api/printer/print`, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
};

export const readScale = async (
  signal?: AbortSignal,
): Promise<ScaleReadingDTO> => {
  const baseUrl = useSettingsStore.getState().localAgentUrl;
  if (!baseUrl) {
    return { weight: 0, isStable: false, error: "Agente no configurado" };
  }
  try {
    const res = await agentClient.get<AgentScaleResponse>(
      `${baseUrl}/api/scale/weight`,
      { timeout: 1500, signal },
    );
    const data = res.data;
    return {
      weight: data.weight ?? 0,
      isStable: data.stable ?? false,
      error: data.error ?? null,
    };
  } catch {
    return { weight: 0, isStable: false, error: "Báscula desconectada" };
  }
};

export interface StoreStationResponse {
  id: string;
  name: string;
  agentUrl: string | null;
  status: string;
}

export const fetchStationsFromCloud = async (): Promise<
  StoreStationResponse[]
> => {
  try {
    const res = await apiClient.get<StoreStationResponse[]>(
      "/stores/me/stations",
    );
    return res.data;
  } catch (err) {
    console.warn("No se pudieron obtener las cajas desde la nube", err);
    return [];
  }
};
