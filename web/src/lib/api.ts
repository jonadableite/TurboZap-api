import axios, { AxiosError, type AxiosRequestHeaders } from "axios";
import type {
  Instance,
  CreateInstanceRequest,
  CreateInstanceResponse,
  InstanceListResponse,
  InstanceStatusResponse,
  QRCodeResponse,
  ApiResponse,
} from "@/types";

const DEFAULT_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_KEY_STORAGE = "turbozap_api_key";
const API_URL_STORAGE = "turbozap_api_url";

// Create axios instance
const api = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

const getFromStorage = (key: string) => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
};

// Request interceptor to add API key and dynamic base URL
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const storedUrl = getFromStorage(API_URL_STORAGE);
    if (storedUrl) {
      config.baseURL = storedUrl;
    }
  }

  const apiKey = getFromStorage(API_KEY_STORAGE);
  if (apiKey) {
    const headers = (config.headers || {}) as AxiosRequestHeaders;
    headers["X-API-Key"] = apiKey;
    config.headers = headers;
  }

  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: { message: string } }>) => {
    const message =
      error.response?.data?.error?.message ||
      error.message ||
      "Erro desconhecido";
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("API Error:", message);
    }
    return Promise.reject(error);
  }
);

const normalizeInstance = (raw: any): Instance => ({
  id: raw.id,
  name: raw.name,
  phone: raw.phone || raw.phone_number || raw.msisdn || undefined,
  status: raw.status || raw.connection_status || "unknown",
  profileName:
    raw.profileName || raw.profile_name || raw.display_name || raw.name,
  profilePicture:
    raw.profilePicture ||
    raw.profile_picture ||
    raw.profile_pic ||
    raw.avatar ||
    undefined,
  createdAt:
    raw.createdAt || raw.created_at || raw.created || new Date().toISOString(),
  updatedAt:
    raw.updatedAt ||
    raw.updated_at ||
    raw.updated ||
    raw.createdAt ||
    raw.created_at ||
    new Date().toISOString(),
});

const normalizeInstanceArray = (payload?: any): Instance[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.map(normalizeInstance);
  if (Array.isArray(payload.instances))
    return payload.instances.map(normalizeInstance);
  if (Array.isArray(payload.data)) return payload.data.map(normalizeInstance);
  return [];
};

// Instance API
export const instanceApi = {
  // Create a new instance
  create: async (
    data: CreateInstanceRequest
  ): Promise<CreateInstanceResponse> => {
    const response = await api.post<CreateInstanceResponse>(
      "/instance/create",
      data
    );
    return response.data;
  },

  // List all instances
  list: async (): Promise<Instance[]> => {
    const response = await api.get<InstanceListResponse>("/instance/list");
    const dataPayload = response.data.data;
    return normalizeInstanceArray(dataPayload ?? response.data);
  },

  // Get instance by name
  get: async (name: string): Promise<Instance> => {
    const response = await api.get<ApiResponse<any>>(`/instance/${name}`);
    const payload = response.data as any;
    const instanceData =
      payload?.data?.instance || payload?.data || payload?.instance || payload;
    if (!instanceData) {
      throw new Error("Instance not found");
    }
    return normalizeInstance(instanceData);
  },

  // Get instance status
  getStatus: async (name: string): Promise<InstanceStatusResponse["data"]> => {
    const response = await api.get<InstanceStatusResponse>(
      `/instance/${name}/status`
    );
    return response.data.data;
  },

  // Get QR code (returns the raw code string for use with QRCodeSVG)
  getQRCode: async (name: string): Promise<string> => {
    const response = await api.get<QRCodeResponse>(`/instance/${name}/qrcode`);
    // Use 'code' for QRCodeSVG library, fallback to 'qr_code' base64 image
    return response.data.data?.code || response.data.data?.qr_code || "";
  },

  // Connect instance
  connect: async (name: string): Promise<void> => {
    await api.post(`/instance/${name}/connect`);
  },

  // Restart instance
  restart: async (name: string): Promise<void> => {
    await api.put(`/instance/${name}/restart`);
  },

  // Logout instance
  logout: async (name: string): Promise<void> => {
    await api.post(`/instance/${name}/logout`);
  },

  // Delete instance
  delete: async (name: string): Promise<void> => {
    await api.delete(`/instance/${name}`);
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<boolean> => {
    try {
      await api.get("/health");
      return true;
    } catch {
      return false;
    }
  },
};

export default api;
