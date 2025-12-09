import type {
  ApiResponse,
  CreateInstanceRequest,
  CreateInstanceResponse,
  Instance,
  InstanceListResponse,
  InstanceStatus,
  InstanceStatusResponse,
  QRCodeResponse,
} from "@/types";
import axios, { AxiosError, type AxiosRequestHeaders } from "axios";

const DEFAULT_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const API_KEY_STORAGE = "turbozap_api_key";
const API_URL_STORAGE = "turbozap_api_url";

// Create axios instance
const api = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 15000,
  timeoutErrorMessage: "Request timed out",
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
const isTimeoutError = (error: AxiosError) =>
  error.code === "ECONNABORTED" ||
  error.message?.toLowerCase().includes("timeout") ||
  error.code === "ETIMEDOUT";

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: { message: string } }>) => {
    if (isTimeoutError(error)) {
      return Promise.reject(
        new AxiosError(
          "API indisponível ou lenta: tempo limite excedido",
          error.code,
          error.config,
          error.request,
          error.response
        )
      );
    }

    const message =
      error.response?.data?.error?.message ||
      error.message ||
      "Erro desconhecido";

    // Don't log errors for optional endpoints like webhook events
    const isOptionalEndpoint = error.config?.url?.includes("/webhook/events");

    if (process.env.NODE_ENV !== "production" && !isOptionalEndpoint) 
    return Promise.reject(error);
  }
);

const getString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const normalizeInstance = (raw: unknown): Instance => {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const statusRaw = getString(data.status) || getString(data.connection_status);
  const status: InstanceStatus =
    statusRaw === "connected" ||
    statusRaw === "connecting" ||
    statusRaw === "qr_code" ||
    statusRaw === "disconnected"
      ? statusRaw
      : "disconnected";

  return {
    id: getString(data.id) || "",
    name: getString(data.name) || "",
    phone:
      getString(data.phone) ||
      getString(data.phone_number) ||
      getString(data.msisdn) ||
      undefined,
    status,
    profileName:
      getString(data.profileName) ||
      getString(data.profile_name) ||
      getString(data.display_name) ||
      getString(data.name) ||
      undefined,
    profilePicture:
      getString(data.profilePicture) ||
      getString(data.profile_picture) ||
      getString(data.profile_pic) ||
      getString(data.avatar) ||
      undefined,
    createdAt:
      getString(data.createdAt) ||
      getString(data.created_at) ||
      getString(data.created) ||
      new Date().toISOString(),
    updatedAt:
      getString(data.updatedAt) ||
      getString(data.updated_at) ||
      getString(data.updated) ||
      getString(data.createdAt) ||
      getString(data.created_at) ||
      new Date().toISOString(),
  };
};

const normalizeInstanceArray = (payload?: unknown): Instance[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.map(normalizeInstance);
  const payloadObj = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  const instances = payloadObj.instances;
  const data = payloadObj.data;
  if (Array.isArray(instances)) return instances.map(normalizeInstance);
  if (Array.isArray(data)) return data.map(normalizeInstance);
  return [];
};

// Instance API
export const instanceApi = {
  // Create a new instance
  create: async (
    data: CreateInstanceRequest
  ): Promise<CreateInstanceResponse> => {
    // Ensure latest API key/URL are applied even if interceptor hasn't run yet
    const overrideHeaders: Record<string, string> = {};
    const storedKey = getFromStorage(API_KEY_STORAGE);
    if (storedKey) {
      overrideHeaders["X-API-Key"] = storedKey;
    }
    const storedUrl = getFromStorage(API_URL_STORAGE);

    const response = await api.post<CreateInstanceResponse>(
      "/instance/create",
      data,
      {
        baseURL: storedUrl || DEFAULT_API_URL,
        headers: Object.keys(overrideHeaders).length ? overrideHeaders : undefined,
      }
    );
    return response.data;
  },

  // List all instances
  list: async (): Promise<Instance[]> => {
    try {
      const response = await api.get<InstanceListResponse>("/instance/list");
      const dataPayload = response.data.data;
      return normalizeInstanceArray(dataPayload ?? response.data);
    } catch (error) {
      // Gracefully handle timeouts to avoid noisy console errors on dashboard load
      const isTimeout =
        axios.isAxiosError(error) &&
        (error.code === "ECONNABORTED" ||
          error.message.toLowerCase().includes("timeout"));
      if (isTimeout) {
        return [];
      }
      throw error;
    }
  },

  // Get instance by name
  get: async (name: string): Promise<Instance> => {
    const response = await api.get<ApiResponse<unknown>>(`/instance/${name}`);
    const payload = response.data;
    const payloadRecord = (payload as ApiResponse<unknown>)?.data ?? payload;
    const instanceData =
      (payloadRecord as { instance?: unknown })?.instance ?? payloadRecord;
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
