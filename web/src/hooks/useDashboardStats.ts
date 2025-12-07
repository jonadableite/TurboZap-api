import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface MessageStats {
  today: number;
  total: number;
}

export function useDashboardStats() {
  return useQuery<MessageStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      try {
        const response = await api.get<{
          success: boolean;
          data: MessageStats;
        }>("/api/stats/messages");
        return response.data.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return { today: 0, total: 0 };
        }
        throw error;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}
