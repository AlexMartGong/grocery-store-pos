import axios from "axios";
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
  id: number | null;
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
