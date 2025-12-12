"use client";

import { authClient } from "@/lib/auth-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

// Types
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role?: string;
  banned?: boolean;
  banReason?: string | null;
  banExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
  impersonatedBy?: string | null;
}

export interface ListUsersParams {
  searchValue?: string;
  searchField?: "email" | "name";
  searchOperator?: "contains" | "starts_with" | "ends_with";
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  filterField?: string;
  filterValue?: string | number | boolean;
  filterOperator?: "eq" | "ne" | "lt" | "lte" | "gt" | "gte";
}

export interface ListUsersResponse {
  users: AdminUser[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role?: string;
  data?: Record<string, unknown>;
}

export interface UpdateUserInput {
  userId: string;
  data: Record<string, unknown>;
}

export interface BanUserInput {
  userId: string;
  banReason?: string;
  banExpiresIn?: number;
}

export interface SetRoleInput {
  userId: string;
  role: string | string[];
}

type BetterAuthRole = "user" | "admin" | "developer";

function toBetterAuthRole(
  input?: string | string[]
): BetterAuthRole | BetterAuthRole[] | undefined {
  if (!input) return undefined;

  const values = Array.isArray(input)
    ? input
    : input
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

  const mapped = values
    .map((v) => v.trim().toLowerCase())
    .map((v) => {
      if (v === "admin" || v === "administrator" || v === "administrador" || v === "adm") return "admin";
      if (v === "developer" || v === "dev" || v === "desenvolvedor") return "developer";
      if (v === "user" || v === "usuario" || v === "usuário") return "user";
      // Uppercase variants (USER/ADMIN/DEVELOPER) normalize above, so only unknowns reach here.
      return undefined;
    })
    .filter((v): v is BetterAuthRole => Boolean(v));

  if (mapped.length === 0) return undefined;
  if (mapped.length === 1) return mapped[0];
  return mapped;
}

export interface SetPasswordInput {
  userId: string;
  newPassword: string;
}

const USERS_QUERY_KEY = ["admin", "users"];
const SESSIONS_QUERY_KEY = ["admin", "sessions"];

/**
 * Hook para listar usuários com paginação e filtros
 */
export function useAdminUsers(params: ListUsersParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery<ListUsersResponse>({
    queryKey: [...USERS_QUERY_KEY, params],
    queryFn: async () => {
      const response = await authClient.admin.listUsers({
        query: {
          searchValue: params.searchValue,
          searchField: params.searchField,
          searchOperator: params.searchOperator,
          limit: params.limit ?? 10,
          offset: params.offset ?? 0,
          sortBy: params.sortBy,
          sortDirection: params.sortDirection,
          filterField: params.filterField,
          filterValue: params.filterValue,
          filterOperator: params.filterOperator,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao listar usuários");
      }

      const payload = (response.data ?? (response as unknown)) as Partial<{
        users: AdminUser[];
        total: number;
        limit: number;
        offset: number;
      }>;

      return {
        users: (payload.users ?? []) as AdminUser[],
        total: payload.total ?? 0,
        limit: payload.limit,
        offset: payload.offset,
      };
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
  }, [queryClient]);

  return { ...query, invalidate };
}

/**
 * Hook para criar usuário
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const role = toBetterAuthRole(input.role);
      const response = await authClient.admin.createUser({
        email: input.email,
        password: input.password,
        name: input.name,
        role,
        data: input.data,
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao criar usuário");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

/**
 * Hook para atualizar usuário
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: UpdateUserInput) => {
      const response = await authClient.admin.updateUser({
        userId,
        data,
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao atualizar usuário");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

/**
 * Hook para definir role do usuário
 */
export function useSetUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: SetRoleInput) => {
      const normalizedRole = toBetterAuthRole(role);
      if (!normalizedRole) {
        throw new Error("Role inválida");
      }
      const response = await authClient.admin.setRole({
        userId,
        role: normalizedRole,
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao alterar role");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

/**
 * Hook para definir senha do usuário
 */
export function useSetUserPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newPassword }: SetPasswordInput) => {
      const response = await authClient.admin.setUserPassword({
        userId,
        newPassword,
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao alterar senha");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

/**
 * Hook para banir usuário
 */
export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, banReason, banExpiresIn }: BanUserInput) => {
      const response = await authClient.admin.banUser({
        userId,
        banReason,
        banExpiresIn,
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao banir usuário");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

/**
 * Hook para desbanir usuário
 */
export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await authClient.admin.unbanUser({
        userId,
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao desbanir usuário");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

/**
 * Hook para remover usuário
 */
export function useRemoveUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await authClient.admin.removeUser({
        userId,
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao remover usuário");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

/**
 * Hook para listar sessões de um usuário
 */
export function useUserSessions(userId: string | null) {
  return useQuery<UserSession[]>({
    queryKey: [...SESSIONS_QUERY_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];

      const response = await authClient.admin.listUserSessions({
        userId,
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao listar sessões");
      }

      return (response.data?.sessions ?? []) as UserSession[];
    },
    enabled: !!userId,
    staleTime: 10000,
  });
}

/**
 * Hook para revogar sessão específica
 */
export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionToken: string) => {
      const response = await authClient.admin.revokeUserSession({
        sessionToken,
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao revogar sessão");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    },
  });
}

/**
 * Hook para revogar todas as sessões de um usuário
 */
export function useRevokeAllSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await authClient.admin.revokeUserSessions({
        userId,
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao revogar sessões");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    },
  });
}

/**
 * Hook para impersonar usuário
 */
export function useImpersonateUser() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await authClient.admin.impersonateUser({
        userId,
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao impersonar usuário");
      }

      // Reload page to apply new session
      if (typeof window !== "undefined") {
        window.location.reload();
      }

      return response.data;
    },
  });
}

/**
 * Hook para parar de impersonar
 */
export function useStopImpersonating() {
  return useMutation({
    mutationFn: async () => {
      const response = await authClient.admin.stopImpersonating();

      if (response.error) {
        throw new Error(response.error.message || "Erro ao parar impersonação");
      }

      // Reload page to restore admin session
      if (typeof window !== "undefined") {
        window.location.reload();
      }

      return response.data;
    },
  });
}

/**
 * Hook combinado para gerenciamento de usuários admin
 */
export function useAdminUserManagement() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const setRole = useSetUserRole();
  const setPassword = useSetUserPassword();
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const removeUser = useRemoveUser();
  const revokeSession = useRevokeSession();
  const revokeAllSessions = useRevokeAllSessions();
  const impersonate = useImpersonateUser();
  const stopImpersonating = useStopImpersonating();

  const sessions = useUserSessions(selectedUserId);

  return {
    selectedUserId,
    setSelectedUserId,
    sessions,
    createUser,
    updateUser,
    setRole,
    setPassword,
    banUser,
    unbanUser,
    removeUser,
    revokeSession,
    revokeAllSessions,
    impersonate,
    stopImpersonating,
    isLoading:
      createUser.isPending ||
      updateUser.isPending ||
      setRole.isPending ||
      setPassword.isPending ||
      banUser.isPending ||
      unbanUser.isPending ||
      removeUser.isPending ||
      revokeSession.isPending ||
      revokeAllSessions.isPending ||
      impersonate.isPending ||
      stopImpersonating.isPending,
  };
}

