'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webhookApi, type WebhookConfig } from '@/lib/webhook-api';

export function useWebhook(instanceName: string) {
  return useQuery<WebhookConfig>({
    queryKey: ['webhook', instanceName],
    queryFn: () => webhookApi.get(instanceName),
    enabled: !!instanceName,
    staleTime: 30000,
  });
}

export function useSetWebhook(instanceName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: Partial<WebhookConfig>) =>
      webhookApi.set(instanceName, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook', instanceName] });
    },
  });
}

export function useWebhookEvents() {
  return useQuery<string[]>({
    queryKey: ['webhook-events'],
    queryFn: () => webhookApi.listEvents(),
    staleTime: 300000, // Cache for 5 minutes
    retry: false, // Don't retry if it fails
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

