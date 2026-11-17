import { Calculator, HandCoins, Scale, ShieldAlert } from "lucide-react";
import type { LandingFeature, LandingPlan } from "../types";

/** Sales line in wa.me format: country code 52 + national number 374 102 3879. */
export const WHATSAPP_PHONE = "523741023879";
export const WHATSAPP_DISPLAY = "374 102 3879";

export const buildSalesWhatsAppUrl = (message: string): string =>
  `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;

export const DEMO_MESSAGE = "Hola, me interesa solicitar una demo de VentaCore para mi negocio.";
export const INFO_MESSAGE = "Hola, quiero más información sobre VentaCore.";

export const LANDING_FEATURES: readonly LandingFeature[] = [
  {
    id: "scale",
    icon: Scale,
    title: "Pesaje en vivo y cobro ultrarrápido",
    description:
      "Conexión directa con báscula física y escaneo dual: lector láser USB/Bluetooth o la cámara del celular.",
  },
  {
    id: "cash-shifts",
    icon: Calculator,
    title: "Cortes de caja exactos",
    description:
      "Apertura y cierre de turno con arqueo ciego y cálculo automático de efectivo, tarjetas, transferencias y abonos.",
  },
  {
    id: "inventory",
    icon: ShieldAlert,
    title: "Inventario y alertas antifraude",
    description:
      "Control de existencias y mermas, con avisos inmediatos al dueño por WhatsApp o Telegram ante ventas canceladas o stock bajo.",
  },
  {
    id: "credit",
    icon: HandCoins,
    title: "Créditos (fiado) y multi-caja",
    description:
      "Límite de crédito por cliente, abonos con comprobante automático por WhatsApp e impresión térmica en múltiples estaciones.",
  },
];

// Hand-kept copy of the backend subscription plans (the plans endpoint is SUPER_ADMIN-only).
// Change these together with the backend fees.
export const LANDING_PLANS: readonly LandingPlan[] = [
  {
    code: "STANDARD",
    name: "Estándar",
    tagline: "Para la tienda de una sola caja.",
    monthlyPrice: 299,
    yearlyPrice: 2990,
    stations: "1 caja / estación de cobro",
    features: [
      "Punto de venta completo",
      "Inventario y kárdex",
      "Clientes y créditos (fiado)",
      "Cortes de caja con arqueo ciego",
    ],
    featured: false,
  },
  {
    code: "PRO",
    name: "Pro",
    tagline: "Para el dueño que no siempre está en la tienda.",
    monthlyPrice: 499,
    yearlyPrice: 4990,
    stations: "Hasta 2 cajas / estaciones",
    features: [
      "Todo lo del plan Estándar",
      "Alertas automáticas en tiempo real al dueño por WhatsApp o Telegram",
      "Avisos de stock bajo, mermas, cancelaciones antifraude y cortes de caja",
      "Recibos de abono a clientes por WhatsApp",
    ],
    featured: true,
  },
  {
    code: "BUSINESS",
    name: "Business",
    tagline: "Para negocios con varias cajas que facturan.",
    monthlyPrice: 899,
    yearlyPrice: 8990,
    stations: "Hasta 5 cajas / estaciones",
    features: ["Todas las funciones Pro", "Facturación electrónica CFDI 4.0 integrada"],
    featured: false,
  },
];
