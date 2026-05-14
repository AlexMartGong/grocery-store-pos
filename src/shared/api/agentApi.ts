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
  businessName: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
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

const SCAN_SUBNETS = ["192.168.1", "192.168.0", "192.168.68"] as const;
const SCAN_AGENT_PORT = 8081;
const SCAN_TIMEOUT_MS = 1500;

export const scanLocalNetworkForAgent = async (): Promise<string> => {
  const candidates: string[] = [];
  for (const subnet of SCAN_SUBNETS) {
    for (let host = 1; host <= 254; host++) {
      candidates.push(`http://${subnet}.${host}:${SCAN_AGENT_PORT}`);
    }
  }

  const probes = candidates.map(async (baseUrl) => {
    const res = await axios.get(`${baseUrl}/api/health`, {
      timeout: SCAN_TIMEOUT_MS,
    });
    if (res.status !== 200) {
      throw new Error(`status ${res.status}`);
    }
    return baseUrl;
  });

  try {
    return await Promise.any(probes);
  } catch {
    throw new Error("No se encontró un agente de impresión en la red local.");
  }
};
