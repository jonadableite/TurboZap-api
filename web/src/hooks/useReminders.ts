"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  banner_image?: string;
  date: string;
  time?: string;
  location?: string;
  tags?: string[];
  recommendedLevel?: string;
  status: "active" | "finished" | "upcoming";
  category?: "all" | "events" | "content" | "news" | "offers";
  actionButtons?: {
    primary?: { label: string; href?: string; onClick?: () => void };
    secondary?: { label: string; href?: string; onClick?: () => void };
  };
}

export interface CreateReminderInput {
  title: string;
  description?: string;
  banner_image?: string;
  date: string;
  time?: string;
  location?: string;
  tags?: string[];
  recommendedLevel?: string;
  status?: "active" | "finished" | "upcoming";
  category?: "all" | "events" | "content" | "news" | "offers";
  actionButtons?: {
    primary?: { label: string; href?: string };
    secondary?: { label: string; href?: string };
  };
}

const REMINDERS_QUERY_KEY = ["reminders"];

// Fetch all reminders
export function useReminders() {
  return useQuery<Reminder[]>({
    queryKey: REMINDERS_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Reminder[] }>(
        "/api/admin/reminders"
      );
      return response.data.data;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

// Create reminder
export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateReminderInput) => {
      const response = await api.post<{ success: boolean; data: Reminder }>(
        "/api/admin/reminders",
        input
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDERS_QUERY_KEY });
    },
  });
}

// Update reminder
export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<CreateReminderInput>) => {
      const response = await api.put<{ success: boolean; data: Reminder }>(
        `/api/admin/reminders/${id}`,
        input
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDERS_QUERY_KEY });
    },
  });
}

// Delete reminder
export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ success: boolean; data: { id: string } }>(
        `/api/admin/reminders/${id}`
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDERS_QUERY_KEY });
    },
  });
}

