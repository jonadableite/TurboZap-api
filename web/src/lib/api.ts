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
import { getApiBaseUrl } from "./api-url";


const API_KEY_STORAGE = "turbozap_api_key";

// Helper to safely get from localStorage (client-side only)
const getFromStorage = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    // localStorage may be disabled or unavailable
    if (process.env.NODE_ENV === "development") {
      console.warn(`[API] Failed to access localStorage for key "${key}":`, error);
    }
    return null;
  }
};

// Get base URL - uses shared utility
function getBaseURL(): string {
  return getApiBaseUrl();
}

// Create axios instance with undefined baseURL initially
// It will be set dynamically in the request interceptor
const api = axios.create({
  baseURL: undefined, // Will be set in interceptor
  timeout: 15000,
  timeoutErrorMessage: "Request timed out",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add API key and dynamic base URL
api.interceptors.request.use(
  (config) => {
    // Check if this is a Next.js API route (starts with /api/)
    // These routes should be called relatively, not with the backend baseURL
    const isNextJsApiRoute = config.url?.startsWith("/api/");
    
    if (isNextJsApiRoute) {
      // For Next.js API routes, use relative URLs (no baseURL)
      config.baseURL = "";
      
      // Log for debugging
      if (config.url) {
        console.log(`[API] Next.js API route: ${config.url}`);
      }
    } else {
      // For backend Go API routes, use the configured baseURL
      try {
        const baseURL = getBaseURL();
        config.baseURL = baseURL;
        
        // Log for debugging (both dev and prod to help diagnose issues)
        if (config.url) {
          console.log(`[API] Backend API request to ${baseURL}${config.url}`);
        }
      } catch (error) {
      // In production, try to recover gracefully
      if (process.env.NODE_ENV === "production") {
        console.error("[API] Failed to get base URL:", error);
        
        // Try to use current origin as last resort (client-side only)
        if (typeof window !== "undefined") {
          const origin = window.location.origin;
          
          // Try to use the shared utility for inference
          try {
            const { getApiBaseUrl } = require("./api-url");
            config.baseURL = getApiBaseUrl();
            console.warn("[API] Using inferred URL as fallback:", config.baseURL);
          } catch {
            // If inference fails, use same origin
            config.baseURL = origin;
            console.warn("[API] Using same origin as fallback:", config.baseURL);
          }
        } else {
          // SSR: can't recover, must have env var
          throw error;
        }
      } else {
        // Development: throw error to catch configuration issues early
        throw error;
      }
      }
    }
    
    // Add API key from localStorage if available (only for backend API routes)
    // Next.js API routes handle authentication via cookies/session
    if (!isNextJsApiRoute) {
      if (typeof window !== "undefined") {
        const apiKey = getFromStorage(API_KEY_STORAGE);
        if (apiKey && apiKey.trim()) {
          const headers = (config.headers || {}) as AxiosRequestHeaders;
          headers["X-API-Key"] = apiKey.trim();
          config.headers = headers;
        } else {
          // Log warning in development if API key is missing for non-public endpoints
          // Some endpoints might be public (like health check), so we don't block the request
          if (process.env.NODE_ENV === "development" && config.url && !config.url.includes("/health")) {
            console.warn(
              "[API] No API key found in localStorage. " +
              "Some endpoints may require authentication. " +
              "Configure your API key in Settings or Header."
            );
          }
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

    // Don't log errors for optional endpoints like webhook events
    const isOptionalEndpoint = error.config?.url?.includes("/webhook/events");

    if (process.env.NODE_ENV !== "production" && !isOptionalEndpoint) {
      const message =
        error.response?.data?.error?.message ||
        error.message ||
        "Erro desconhecido";
      
      // Check if API key is configured before logging API key errors
      const hasApiKey = typeof window !== "undefined" && getFromStorage(API_KEY_STORAGE)?.trim();
      
      // Provide helpful message for missing API key only if API key is actually missing
      if ((message.toLowerCase().includes("api key") || message.toLowerCase().includes("api_key")) && !hasApiKey) {
        // Don't log error if API key is not configured - this is expected behavior
        // The hook should handle this gracefully by not making the request
        return Promise.reject(error);
      }
      
      // Log other errors normally
      if (message.toLowerCase().includes("api key") || message.toLowerCase().includes("api_key")) {
        console.error(
          "[API] Request error: API key is required. " +
          "Please configure your API key in Settings or Header."
        );
      } else if (message.includes("Cannot GET") || message.includes("Cannot POST") || message.includes("Cannot PUT") || message.includes("Cannot DELETE")) {
        // This usually means the Next.js route doesn't exist or isn't compiled
        console.error(
          `[API] Route not found: ${error.config?.method || "GET"} ${error.config?.url}. ` +
          "Make sure the route exists and the Next.js server is running."
        );
      } else {
        console.error("[API] Request error:", message);
        // Log full error details in development
        if (process.env.NODE_ENV === "development" && error.response) {
          console.error("[API] Response data:", error.response.data);
          console.error("[API] Response status:", error.response.status);
        }
      }
    }
    
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
    const finalUrl = getBaseURL();

    const response = await api.post<CreateInstanceResponse>(
      "/instance/create",
      data,
      {
        baseURL: finalUrl,
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
