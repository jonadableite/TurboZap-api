"use client";

import { useAuth, UserRole } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui";

interface RequireAuthProps {
  children: React.ReactNode;
  roles?: UserRole | UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Component to protect routes based on authentication and roles
 */
export function RequireAuth({
  children,
  roles,
  fallback,
  redirectTo = "/sign-in",
}: RequireAuthProps) {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, redirectTo, router]);

  // Show loading state
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-[#13131b]">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <p className="text-[#a9a9b2]">Carregando...</p>
          </div>
        </div>
      )
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Check role requirements
  if (roles && !hasRole(roles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#13131b]">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 mx-auto mb-6 bg-[#f75a68]/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#f75a68]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-[#a9a9b2] mb-6">
            Você não tem permissão para acessar esta página. Entre em contato com o
            administrador se acredita que isso é um erro.
          </p>
          <button
            onClick={() => router.push("/app")}
            className="px-6 py-3 bg-[#8257e5] text-white rounded-lg hover:bg-[#996dff] transition-colors font-medium"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default RequireAuth;

