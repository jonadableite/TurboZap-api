"use client";

import { BanUserModal } from "@/components/admin/users/BanUserModal";
import { ChangePasswordModal } from "@/components/admin/users/ChangePasswordModal";
import { ChangeRoleModal } from "@/components/admin/users/ChangeRoleModal";
import { CreateUserModal } from "@/components/admin/users/CreateUserModal";
import { EditUserModal } from "@/components/admin/users/EditUserModal";
import { UserFilters } from "@/components/admin/users/UserFilters";
import { UserSessionsModal } from "@/components/admin/users/UserSessionsModal";
import { UserTable } from "@/components/admin/users/UserTable";
import { Header } from "@/components/layout";
import { Button, Spinner } from "@/components/ui";
import {
  useAdminUserManagement,
  useAdminUsers,
  type AdminUser,
  type ListUsersParams,
} from "@/hooks/useAdminUsers";
import { useAuth } from "@/hooks/useAuth";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();

  // Filters state
  const [filters, setFilters] = useState<ListUsersParams>({});

  // Query users with filters
  const usersQuery = useAdminUsers({
    ...filters,
    limit: 50,
  });

  // Management hooks
  const management = useAdminUserManagement();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] =
    useState<AdminUser | null>(null);
  const [changingRoleUser, setChangingRoleUser] = useState<AdminUser | null>(
    null
  );
  const [banningUser, setBanningUser] = useState<AdminUser | null>(null);
  const [viewingSessionsUser, setViewingSessionsUser] =
    useState<AdminUser | null>(null);

  // Redirect if not admin
  if (!authLoading && !isAdmin) {
    router.push("/app");
    return null;
  }

  // Handlers
  const handleCreateUser = async (
    data: Parameters<typeof management.createUser.mutateAsync>[0]
  ) => {
    await management.createUser.mutateAsync(data);
  };

  const handleUpdateUser = async (
    userId: string,
    data: Record<string, unknown>
  ) => {
    await management.updateUser.mutateAsync({ userId, data });
  };

  const handleChangePassword = async (userId: string, password: string) => {
    await management.setPassword.mutateAsync({ userId, newPassword: password });
  };

  const handleChangeRole = async (userId: string, role: string) => {
    await management.setRole.mutateAsync({ userId, role });
  };

  const handleBanUser = async (userId: string, reason?: string) => {
    await management.banUser.mutateAsync({ userId, banReason: reason });
  };

  const handleUnbanUser = async (userId: string) => {
    await management.unbanUser.mutateAsync(userId);
  };

  const handleDeleteUser = async (userId: string) => {
    await management.removeUser.mutateAsync(userId);
  };

  const handleFilterChange = (newFilters: ListUsersParams) => {
    setFilters(newFilters);
  };

  const handleViewSessions = (user: AdminUser) => {
    management.setSelectedUserId(user.id);
    setViewingSessionsUser(user);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const users = usersQuery.data?.users ?? [];

  return (
    <>
      <Header
        title="Gerenciamento de Usuários"
        description="Administre usuários, permissões e acessos"
      />

      <div className="px-4 sm:px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header with Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <UserFilters filters={filters} onFiltersChange={handleFilterChange} />
          <Button
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Criar usuário
          </Button>
        </div>

        {/* Users Table */}
        <UserTable
          users={users}
          total={usersQuery.data?.total ?? 0}
          filters={filters}
          onFiltersChange={handleFilterChange}
          isLoading={usersQuery.isLoading}
          onEdit={setEditingUser}
          onChangePassword={setChangingPasswordUser}
          onChangeRole={setChangingRoleUser}
          onBan={setBanningUser}
          onUnban={(user) => handleUnbanUser(user.id)}
          onDelete={(user) => handleDeleteUser(user.id)}
          onViewSessions={handleViewSessions}
          onImpersonate={() => {}}
        />

        {/* Modals */}
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
          isLoading={management.createUser.isPending}
        />

        <EditUserModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={handleUpdateUser}
          isLoading={management.updateUser.isPending}
        />

        <ChangePasswordModal
          user={changingPasswordUser}
          isOpen={!!changingPasswordUser}
          onClose={() => setChangingPasswordUser(null)}
          onSubmit={async (password) => {
            if (changingPasswordUser) {
              await handleChangePassword(changingPasswordUser.id, password);
            }
          }}
          isLoading={management.setPassword.isPending}
        />

        <ChangeRoleModal
          user={changingRoleUser}
          isOpen={!!changingRoleUser}
          onClose={() => setChangingRoleUser(null)}
          onSubmit={async (role) => {
            if (changingRoleUser) {
              await handleChangeRole(changingRoleUser.id, role);
            }
          }}
          isLoading={management.setRole.isPending}
        />

        <BanUserModal
          user={banningUser}
          isOpen={!!banningUser}
          onClose={() => setBanningUser(null)}
          onSubmit={async (data) => {
            await management.banUser.mutateAsync(data);
          }}
          isLoading={management.banUser.isPending}
        />

        <UserSessionsModal
          user={viewingSessionsUser}
          isOpen={!!viewingSessionsUser}
          onClose={() => {
            setViewingSessionsUser(null);
            management.setSelectedUserId(null);
          }}
          sessions={management.sessions.data ?? []}
          isLoading={management.sessions.isLoading}
          onRevokeSession={async (sessionToken) => {
            await management.revokeSession.mutateAsync(sessionToken);
          }}
          onRevokeAllSessions={async (userId) => {
            await management.revokeAllSessions.mutateAsync(userId);
          }}
          isRevoking={
            management.revokeSession.isPending ||
            management.revokeAllSessions.isPending
          }
        />
      </div>
    </>
  );
}
