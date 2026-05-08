import { AlertTriangle, CreditCard, PackageX } from "lucide-react";
import type { NotificationType } from "../types";

interface Props {
  type: NotificationType;
}

const STYLES: Record<NotificationType, string> = {
  LOW_STOCK: "text-amber-600 bg-amber-50",
  OUT_OF_STOCK: "text-rose-600 bg-rose-50",
  OVERDUE_CREDIT: "text-indigo-600 bg-indigo-50",
};

export const NotificationTypeIcon = ({ type }: Props) => {
  const tone = STYLES[type];
  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}
    >
      {type === "LOW_STOCK" && <AlertTriangle size={18} />}
      {type === "OUT_OF_STOCK" && <PackageX size={18} />}
      {type === "OVERDUE_CREDIT" && <CreditCard size={18} />}
    </span>
  );
};
