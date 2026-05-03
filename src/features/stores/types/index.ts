export type StoreStatus = "ACTIVE" | "SUSPENDED" | "CANCELED";

export interface StoreResponse {
  id: string;
  code: string;
  name: string;
  ownerName: string | null;
  whatsapp: string | null;
  address: string | null;
  status: StoreStatus;
  createdAt: string;
}

export interface CreateStoreRequest {
  code: string;
  name: string;
  ownerName?: string;
  whatsapp?: string;
  address?: string;
}

export interface UpdateStoreRequest {
  name: string;
  ownerName?: string;
  whatsapp?: string;
  address?: string;
  status: StoreStatus;
}
