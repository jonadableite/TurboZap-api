import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useApiConfig } from "./useApiConfig";

interface MessageStats {
  today: number;
  total: number;
}

export function useDashboardStats() {
  const { hasApiKey, isReady } = useApiConfig();

  return useQuery<MessageStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      // Don't make request if API key is not configured
      if (isReady && !hasApiKey) {
        // Return default values if API key is not configured
        return { today: 0, total: 0 };
      }

      try {
        const response = await api.get<{
          success: boolean;
          data: MessageStats;
        }>("/api/stats/messages");
        return response.data.data;
      } catch (error: unknown) {
        const status = (error as { response?: { status?: number } }).response?.status;
        const message = (error as { response?: { data?: { error?: { message?: string } } } })
          .response?.data?.error?.message || "";
        
        // Handle missing API key error gracefully
        if (
          status === 401 ||
          status === 403 ||
          message.toLowerCase().includes("api key")
        ) {
          // Return default values if API key is missing or invalid
          return { today: 0, total: 0 };
        }
        
        if (status === 404) {
          return { today: 0, total: 0 };
        }
        throw error;
      }
    },
    enabled: isReady, // Only run query when config is ready
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}
