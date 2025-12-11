"use client";

import {
  BanUserModal,
  ChangePasswordModal,
  ChangeRoleModal,
  CreateUserModal,
  EditUserModal,
  UserFilters,
  UserSessionsModal,
  UserTable,
} from "@/components/admin/users";
import { Header } from "@/components/layout";
import { Badge, Button, Input, Modal, Spinner } from "@/components/ui";
import FancyButton from "@/components/ui/FancyButton";
import { useAuth } from "@/hooks/useAuth";
import {
  useAdminUserManagement,
  useAdminUsers,
  type AdminUser,
  type ListUsersParams,
} from "@/hooks/useAdminUsers";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  LogOut,
  RefreshCw,
  Plus,
  Shield,
  Trash2,
  UserCheck,
  UserCog,
  Users,
  Search as SearchIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export default function AdminUsersPage() {
  const { user: currentUser, isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Filters state
  const [filters, setFilters] = useState<ListUsersParams>({
    limit: 10,
    offset: 0,
    sortBy: "createdAt",
    sortDirection: "desc",
  });
  const [searchValue, setSearchValue] = useState("");

  // Query users
  const { data, isLoading, refetch } = useAdminUsers(filters);
  const users = data?.users ?? [];
  const total = data?.total ?? 0;

  // Management hooks
  const management = useAdminUserManagement();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [banningUser, setBanningUser] = useState<AdminUser | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] =
    useState<AdminUser | null>(null);
  const [changingRoleUser, setChangingRoleUser] = useState<AdminUser | null>(
    null
  );
  const [viewingSessionsUser, setViewingSessionsUser] =
    useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [impersonatingUser, setImpersonatingUser] = useState<AdminUser | null>(
    null
  );

  // Redirect if not admin
  if (!authLoading && !isAdmin) {
    router.push("/");
    return null;
  }

  // Handlers
  const handleCreateUser = async (data: Parameters<typeof management.createUser.mutateAsync>[0]) => {
    await management.createUser.mutateAsync(data);
  };

  const handleUpdateUser = async (
    userId: string,
    data: Record<string, unknown>
  ) => {
    await management.updateUser.mutateAsync({ userId, data });
  };

  const handleSetRole = async (userId: string, role: string) => {
    await management.setRole.mutateAsync({ userId, role });
  };

  const handleSetPassword = async (userId: string, newPassword: string) => {
    await management.setPassword.mutateAsync({ userId, newPassword });
  };

  const handleBanUser = async (data: Parameters<typeof management.banUser.mutateAsync>[0]) => {
    await management.banUser.mutateAsync(data);
  };

  const handleUnbanUser = async (user: AdminUser) => {
    await management.unbanUser.mutateAsync(user.id);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    await management.removeUser.mutateAsync(deletingUser.id);
    setDeletingUser(null);
  };

  const handleImpersonate = async () => {
    if (!impersonatingUser) return;
    await management.impersonate.mutateAsync(impersonatingUser.id);
  };

  const handleRevokeSession = async (sessionToken: string) => {
    await management.revokeSession.mutateAsync(sessionToken);
  };

  const handleRevokeAllSessions = async (userId: string) => {
    await management.revokeAllSessions.mutateAsync(userId);
  };

  // Handle sessions modal
  const handleViewSessions = useCallback(
    (user: AdminUser) => {
      management.setSelectedUserId(user.id);
      setViewingSessionsUser(user);
    },
    [management]
  );

  const handleCloseSessionsModal = useCallback(() => {
    setViewingSessionsUser(null);
    management.setSelectedUserId(null);
  }, [management]);

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      searchValue: searchValue || undefined,
      offset: 0,
    }));
  }, [searchValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Header
        title="Gerenciar Usuários"
        description="Administre os usuários da plataforma"
      />

      <div className="px-4 sm:px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full space-y-6 overflow-x-hidden">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl bg-[#1a1a24] border border-[#29292e] p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--rocket-gray-400)]">
                  Total de Usuários
                </p>
                <p className="text-2xl font-semibold text-[var(--rocket-gray-50)] mt-1">
                  {total}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[var(--rocket-purple)]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[var(--rocket-purple)]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl bg-[#1a1a24] border border-[#29292e] p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--rocket-gray-400)]">
                  Administradores
                </p>
                <p className="text-2xl font-semibold text-[var(--rocket-purple)] mt-1">
                  {users.filter((u) => u.role === "ADMIN").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[var(--rocket-purple)]/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[var(--rocket-purple)]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-[#1a1a24] border border-[#29292e] p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--rocket-gray-400)]">
                  Usuários Ativos
                </p>
                <p className="text-2xl font-semibold text-[var(--rocket-green)] mt-1">
                  {users.filter((u) => !u.banned).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[var(--rocket-green)]/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-[var(--rocket-green)]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl bg-[#1a1a24] border border-[#29292e] p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--rocket-gray-400)]">
                  Usuários Banidos
                </p>
                <p className="text-2xl font-semibold text-[var(--rocket-danger)] mt-1">
                  {users.filter((u) => u.banned).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[var(--rocket-danger)]/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[var(--rocket-danger)]" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Header Actions (estilo alinhado às demais páginas) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-4 rounded-2xl border border-[var(--rocket-gray-600)] bg-[var(--rocket-gray-800)]/80 p-4 md:flex-row md:items-center md:justify-between shadow-inner shadow-black/20"
        >
          <div className="w-full md:max-w-sm flex justify-center md:justify-start">
            <div className="relative w-full">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rocket-gray-400)]" />
              <Input
                placeholder="Buscar usuários..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 bg-[#0f0f14] border-[#29292e]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Atualizar
            </Button>
            <FancyButton onClick={() => setShowCreateModal(true)}>
              <Plus className="icon w-4 h-4" />
              Novo Usuário
            </FancyButton>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <UserTable
            users={users}
            total={total}
            filters={filters}
            onFiltersChange={setFilters}
            isLoading={isLoading}
            currentUserId={currentUser?.id}
            onEdit={setEditingUser}
            onBan={setBanningUser}
            onUnban={handleUnbanUser}
            onChangeRole={setChangingRoleUser}
            onChangePassword={setChangingPasswordUser}
            onViewSessions={handleViewSessions}
            onImpersonate={setImpersonatingUser}
            onDelete={setDeletingUser}
          />
        </motion.div>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
        isLoading={management.createUser.isPending}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSubmit={handleUpdateUser}
        isLoading={management.updateUser.isPending}
      />

      {/* Ban User Modal */}
      <BanUserModal
        isOpen={!!banningUser}
        onClose={() => setBanningUser(null)}
        user={banningUser}
        onSubmit={handleBanUser}
        isLoading={management.banUser.isPending}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={!!changingPasswordUser}
        onClose={() => setChangingPasswordUser(null)}
        user={changingPasswordUser}
        onSubmit={handleSetPassword}
        isLoading={management.setPassword.isPending}
      />

      {/* Change Role Modal */}
      <ChangeRoleModal
        isOpen={!!changingRoleUser}
        onClose={() => setChangingRoleUser(null)}
        user={changingRoleUser}
        onSubmit={handleSetRole}
        isLoading={management.setRole.isPending}
      />

      {/* User Sessions Modal */}
      <UserSessionsModal
        isOpen={!!viewingSessionsUser}
        onClose={handleCloseSessionsModal}
        user={viewingSessionsUser}
        sessions={management.sessions.data ?? []}
        isLoading={management.sessions.isLoading}
        onRevokeSession={handleRevokeSession}
        onRevokeAllSessions={handleRevokeAllSessions}
        isRevoking={
          management.revokeSession.isPending ||
          management.revokeAllSessions.isPending
        }
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingUser && (
          <Modal
            isOpen={!!deletingUser}
            onClose={() => setDeletingUser(null)}
            title="Excluir Usuário"
            size="sm"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--rocket-danger)]/10 border border-[var(--rocket-danger)]/30">
                <AlertTriangle className="w-5 h-5 text-[var(--rocket-danger)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--rocket-danger)]">
                    Ação irreversível
                  </p>
                  <p className="text-sm text-[var(--rocket-gray-300)] mt-1">
                    Esta ação irá excluir permanentemente o usuário e todos os
                    seus dados. Esta operação não pode ser desfeita.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0f0f14] border border-[#29292e]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--rocket-purple)] to-[var(--rocket-info)] flex items-center justify-center text-white font-medium">
                  {deletingUser.name?.charAt(0)?.toUpperCase() ||
                    deletingUser.email?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-[var(--rocket-gray-100)]">
                    {deletingUser.name}
                  </p>
                  <p className="text-sm text-[var(--rocket-gray-400)]">
                    {deletingUser.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#29292e]">
                <Button
                  variant="ghost"
                  onClick={() => setDeletingUser(null)}
                  disabled={management.removeUser.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteUser}
                  disabled={management.removeUser.isPending}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  {management.removeUser.isPending
                    ? "Excluindo..."
                    : "Excluir Usuário"}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Impersonate Confirmation Modal */}
      <AnimatePresence>
        {impersonatingUser && (
          <Modal
            isOpen={!!impersonatingUser}
            onClose={() => setImpersonatingUser(null)}
            title="Impersonar Usuário"
            size="sm"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--rocket-info)]/10 border border-[var(--rocket-info)]/30">
                <UserCog className="w-5 h-5 text-[var(--rocket-info)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--rocket-info)]">
                    Modo Impersonação
                  </p>
                  <p className="text-sm text-[var(--rocket-gray-300)] mt-1">
                    Você irá acessar a plataforma como este usuário. A sessão
                    de impersonação expira em 1 hora. Use o botão &quot;Parar
                    Impersonação&quot; no header para voltar à sua conta.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0f0f14] border border-[#29292e]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--rocket-purple)] to-[var(--rocket-info)] flex items-center justify-center text-white font-medium">
                  {impersonatingUser.name?.charAt(0)?.toUpperCase() ||
                    impersonatingUser.email?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-[var(--rocket-gray-100)]">
                    {impersonatingUser.name}
                  </p>
                  <p className="text-sm text-[var(--rocket-gray-400)]">
                    {impersonatingUser.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#29292e]">
                <Button
                  variant="ghost"
                  onClick={() => setImpersonatingUser(null)}
                  disabled={management.impersonate.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleImpersonate}
                  disabled={management.impersonate.isPending}
                  leftIcon={<UserCog className="w-4 h-4" />}
                >
                  {management.impersonate.isPending
                    ? "Iniciando..."
                    : "Impersonar"}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

