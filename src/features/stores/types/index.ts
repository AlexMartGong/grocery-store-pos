export type StoreStatus = "ACTIVE" | "SUSPENDED" | "CANCELED";

export type AdminNotificationChannel = "WHATSAPP" | "TELEGRAM";

export interface StoreResponse {
  id: string;
  code: string;
  name: string;
  ownerName: string | null;
  whatsapp: string | null;
  telegramChatId: string | null;
  preferredAdminChannel: AdminNotificationChannel | null;
  address: string | null;
  status: StoreStatus;
  createdAt: string;
}

export interface CreateStoreRequest {
  code: string;
  name: string;
  ownerName?: string;
  whatsapp?: string;
  telegramChatId?: string;
  preferredAdminChannel?: AdminNotificationChannel;
  address?: string;
}

export interface UpdateStoreRequest {
  name: string;
  ownerName?: string;
  whatsapp?: string;
  telegramChatId?: string;
  preferredAdminChannel?: AdminNotificationChannel;
  address?: string;
  status: StoreStatus;
}

export interface StoreProfileResponse {
  id: string;
  name: string;
  address: string;
  phone: string;
}
