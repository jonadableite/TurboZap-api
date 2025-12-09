"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

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
    await signOut();
    router.push("/sign-in");
    router.refresh();
  }, [router]);

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

