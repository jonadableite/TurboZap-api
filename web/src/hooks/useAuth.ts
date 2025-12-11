"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export type UserRole = "USER" | "DEVELOPER" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: UserRole;
  emailVerified: boolean;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDeveloper: boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  logout: () => Promise<void>;
}

/**
 * Hook for authentication state and user information
 */
export function useAuth(): UseAuthReturn {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: (session.user.role as UserRole) || "USER",
        emailVerified: session.user.emailVerified ?? false,
      }
    : null;

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "ADMIN";
  const isDeveloper = user?.role === "DEVELOPER" || user?.role === "ADMIN";

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.role);
    },
    [user]
  );

  const logout = useCallback(async () => {
    // Clear API key and URL from localStorage on logout
    if (typeof window !== "undefined") {
      localStorage.removeItem("turbozap_api_key");
      localStorage.removeItem("turbozap_api_url");
    }
    
    // Clear all React Query cache to prevent showing data from previous user
    queryClient.clear();
    
    await signOut();
    router.push("/sign-in");
    router.refresh();
  }, [router, queryClient]);

  return {
    user,
    isLoading: isPending,
    isAuthenticated,
    isAdmin,
    isDeveloper,
    hasRole,
    logout,
  };
}

export default useAuth;

