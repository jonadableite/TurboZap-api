// Instance Types
export type InstanceStatus = 'connected' | 'disconnected' | 'connecting' | 'qr_code';

export interface Instance {
  id: string;
  name: string;
  phone?: string;
  status: InstanceStatus;
  profileName?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
  apiKey?: string;
}

export interface CreateInstanceRequest {
  name: string;
}

export interface CreateInstanceResponse {
  success: boolean;
  data?: {
    instance: Instance;
    qrcode?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface InstanceListResponse {
  success: boolean;
  data?: Instance[];
  error?: {
    code: string;
    message: string;
  };
}

export interface InstanceStatusResponse {
  success: boolean;
  data?: {
    status: InstanceStatus;
    phone?: string;
    profileName?: string;
    profilePicture?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface QRCodeResponse {
  success: boolean;
  data?: {
    name: string;
    status: string;
    qr_code?: string;  // Base64 encoded QR code image
    code?: string;     // Raw QR code string
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Message Types
export interface MessageResponse {
  id: string;
  messageId: string;
  status: string;
  timestamp: string;
}

// Webhook Types
export interface Webhook {
  id: string;
  instanceId: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

