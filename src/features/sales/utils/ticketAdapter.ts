import type {
  AgentSaleDetailDTO,
  AgentTicketDTO,
} from "../../../shared/api/agentApi";
import { useStoreProfileStore } from "../../stores/store/storeProfileStore";
import type { CartItem, SaleResponse } from "../types";
import { formatSaleId } from "./format";

const HEX_RE = /^[0-9a-f]+$/i;

const uuidToLong = (uuid: string | null | undefined): number | null => {
  if (!uuid) return null;
  const hex = uuid.replace(/-/g, "").slice(0, 8);
  if (!HEX_RE.test(hex)) return null;
  const n = parseInt(hex, 16);
  return Number.isFinite(n) ? n : null;
};

const toLocalDateTime = (iso: string | null | undefined): string => {
  const d = iso ? new Date(iso) : new Date();
  const safe = Number.isFinite(d.getTime()) && d.getFullYear() > 1970 ? d : new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${safe.getFullYear()}-${pad(safe.getMonth() + 1)}-${pad(safe.getDate())}` +
    `T${pad(safe.getHours())}:${pad(safe.getMinutes())}:${pad(safe.getSeconds())}`
  );
};

const toMoney = (raw: string | number): number => {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Number(n.toFixed(2));
};

interface MapOptions {
  cashReceived?: number;
  employeeName?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
}

export const mapSaleToTicketDTO = (
  sale: SaleResponse,
  cartItems: CartItem[],
  options: MapOptions = {},
): AgentTicketDTO => {
  const profile = useStoreProfileStore.getState().profile;
  const datetime = toLocalDateTime(sale.created_at);
  const total = toMoney(sale.total_amount);
  const amountPaid = toMoney(sale.amount_paid);

  const cartByProduct = new Map(cartItems.map((c) => [c.productId, c]));

  let amountTendered: number;
  let changeDue = 0;
  switch (sale.payment_method) {
    case "CASH": {
      const tendered = options.cashReceived ?? amountPaid;
      amountTendered = toMoney(tendered);
      changeDue = amountTendered > total ? toMoney(amountTendered - total) : 0;
      break;
    }
    case "CARD":
    case "TRANSFER":
      amountTendered = total;
      break;
    case "CREDIT":
      amountTendered = 0;
      break;
    case "MIXED":
      amountTendered = amountPaid;
      break;
  }

  const saleIdLong = uuidToLong(sale.id);

  const saleDetails: AgentSaleDetailDTO[] = sale.items.map((item) => {
    const cart = cartByProduct.get(item.product_id);
    const subtotal = toMoney(item.subtotal);
    return {
      detailId: uuidToLong(item.id),
      saleId: saleIdLong,
      saleDate: datetime,
      productId: uuidToLong(item.product_id),
      productName: cart?.name ?? "Producto",
      productCategory: null,
      quantity: Number(Number(item.quantity).toFixed(3)),
      unitPrice: toMoney(item.unit_price),
      discount: 0,
      subtotal,
      total: subtotal,
    };
  });

  return {
    businessName: profile?.name ?? null,
    businessAddress: profile?.address ?? null,
    businessPhone: profile?.phone ?? null,
    id: formatSaleId(sale.id),
    employeeId: uuidToLong(sale.cashier_id),
    employeeName: options.employeeName ?? null,
    employeePhone: null,
    deliveryOrderId: null,
    customerId: uuidToLong(sale.customer_id),
    customerName: options.customerName ?? null,
    customerPhone: options.customerPhone ?? null,
    customerDiscount: 0,
    deliveryAddress: null,
    paymentMethodId: null,
    paymentMethodName: sale.payment_method,
    datetime,
    subtotal: total,
    discountAmount: 0,
    total,
    amountTendered,
    changeDue,
    paid: sale.payment_method !== "CREDIT",
    notes: null,
    saleDetails,
  };
};
