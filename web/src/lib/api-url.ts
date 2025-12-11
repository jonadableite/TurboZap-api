/**
 * Shared utility to get the API base URL
 * This ensures consistent URL detection across the entire application
 */

const API_URL_STORAGE = "turbozap_api_url";

// Helper to safely get from localStorage (client-side only)
const getFromStorage = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[API URL] Failed to access localStorage for key "${key}":`, error);
    }
    return null;
  }
};

/**
 * Get the API base URL with smart inference
 * Priority:
 * 1. localStorage (user override)
 * 2. NEXT_PUBLIC_API_URL env var
 * 3. Smart inference from current hostname
 * 4. localhost:8080 (development only)
 */
export function getApiBaseUrl(): string {
  // 1. Check localStorage first (user override - highest priority)
  if (typeof window !== "undefined") {
    const storedUrl = getFromStorage(API_URL_STORAGE);
    if (storedUrl && storedUrl.trim()) {
      const url = storedUrl.trim();
      console.log("[API URL] Using stored URL from localStorage:", url);
      return url;
    }
  }

  // 2. Use env var if available (works in both SSR and client)
  // This is embedded at build time for NEXT_PUBLIC_* variables
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    console.log("[API URL] Using URL from NEXT_PUBLIC_API_URL:", envUrl);
    return envUrl;
  }

  // 3. In browser, try to infer from current origin (generic inference)
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const origin = window.location.origin;
    const protocol = window.location.protocol;

    console.log("[API URL] Current origin:", origin, "hostname:", hostname);

    // Generic inference: if API_SUBDOMAIN or API_PREFIX is configured, use it
    const apiSubdomain = process.env.NEXT_PUBLIC_API_SUBDOMAIN?.trim();
    const apiPrefix = process.env.NEXT_PUBLIC_API_PREFIX?.trim();
    
    if (apiSubdomain || apiPrefix) {
      try {
        // Extract domain from hostname (e.g., "zap.example.com" -> "example.com")
        const parts = hostname.split(".");
        if (parts.length >= 2) {
          // Get root domain (last 2 parts, e.g., "example.com")
          const rootDomain = parts.slice(-2).join(".");
          
          let inferredUrl: string;
          if (apiSubdomain) {
            // Use subdomain pattern: apiSubdomain.example.com
            inferredUrl = `${protocol}//${apiSubdomain}.${rootDomain}`;
          } else if (apiPrefix) {
            // Use prefix pattern: apiPrefix-example.com or apiPrefixexample.com
            inferredUrl = `${protocol}//${apiPrefix}${rootDomain}`;
          } else {
            throw new Error("Invalid configuration");
          }
          
          console.log("[API URL] Inferred URL from hostname using env config:", inferredUrl);
          return inferredUrl;
        }
      } catch (error) {
        console.warn("[API URL] Failed to infer URL from hostname:", error);
      }
    }

    // For localhost, use localhost:8080
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") {
      console.log("[API URL] Using localhost API URL");
      return "http://localhost:8080";
    }

    // Last resort: use same origin (assumes API is on same domain)
    console.warn("[API URL] Using same origin as fallback:", origin);
    return origin;
  }

  // 4. SSR: only use localhost in development
  if (process.env.NODE_ENV === "development") {
    console.log("[API URL] SSR: Using localhost in development");
    return "http://localhost:8080";
  }

  // 5. Production SSR: must have env var
  console.error(
    "[API URL] NEXT_PUBLIC_API_URL is not set in production. " +
    "Please set it in your .env file and rebuild the application."
  );

  // Try to use a sensible default based on common patterns
  // This is a last resort and should be avoided
  throw new Error(
    "NEXT_PUBLIC_API_URL não está definido. " +
    "Defina esta variável no arquivo .env.local ou .env.production " +
    "e reconstrua a aplicação."
  );
}

