'use client';

import { instanceApi } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import type { CreateInstanceRequest, Instance } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useApiConfig } from './useApiConfig';

export const INSTANCES_QUERY_KEY = ['instances'];

export function useInstances() {
  const { hasApiKey } = useApiConfig();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Clear cache when user changes (session changes)
  useEffect(() => {
    if (session?.user?.id) {
      // Invalidate all queries when user changes to ensure fresh data
      queryClient.invalidateQueries();
    }
  }, [session?.user?.id, queryClient]);

  return useQuery<Instance[]>({
    queryKey: INSTANCES_QUERY_KEY,
    queryFn: instanceApi.list,
    refetchInterval: 30000, // Refetch every 30 seconds (reduced from 10s)
    staleTime: 15000, // Data is fresh for 15 seconds
    enabled: hasApiKey,
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: true, // Only refetch on mount
  });
}

export function useInstance(name: string) {
  const { hasApiKey } = useApiConfig();

  return useQuery<Instance>({
    queryKey: ['instance', name],
    queryFn: () => instanceApi.get(name),
    enabled: !!name && hasApiKey,
    refetchInterval: 15000, // Refetch every 15 seconds (reduced from 5s)
    refetchOnWindowFocus: false,
  });
}

export function useInstanceStatus(name: string) {
  const { hasApiKey } = useApiConfig();

  return useQuery({
    queryKey: ['instance', name, 'status'],
    queryFn: () => instanceApi.getStatus(name),
    enabled: !!name && hasApiKey,
    refetchInterval: 10000, // Refetch every 10 seconds (reduced from 3s)
    refetchOnWindowFocus: false,
  });
}

export function useInstanceQRCode(name: string, enabled: boolean = true) {
  const { hasApiKey } = useApiConfig();

  return useQuery({
    queryKey: ['instance', name, 'qrcode'],
    queryFn: () => instanceApi.getQRCode(name),
    enabled: enabled && !!name && hasApiKey,
    refetchInterval: 30000, // QR code refreshes every 30 seconds (reduced from 15s)
    retry: 3,
    refetchOnWindowFocus: false,
  });
}

export function useCreateInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInstanceRequest) => instanceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTANCES_QUERY_KEY });
    },
  });
}

export function useConnectInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => instanceApi.connect(name),
    onSuccess: (_, name) => {
      queryClient.invalidateQueries({ queryKey: ['instance', name] });
      queryClient.invalidateQueries({ queryKey: INSTANCES_QUERY_KEY });
    },
  });
}

export function useRestartInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => instanceApi.restart(name),
    onSuccess: (_, name) => {
      queryClient.invalidateQueries({ queryKey: ['instance', name] });
      queryClient.invalidateQueries({ queryKey: INSTANCES_QUERY_KEY });
    },
  });
}

export function useLogoutInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => instanceApi.logout(name),
    onSuccess: (_, name) => {
      queryClient.invalidateQueries({ queryKey: ['instance', name] });
      queryClient.invalidateQueries({ queryKey: INSTANCES_QUERY_KEY });
    },
  });
}

export function useDeleteInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => instanceApi.delete(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTANCES_QUERY_KEY });
    },
  });
}

