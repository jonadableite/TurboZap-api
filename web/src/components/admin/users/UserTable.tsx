"use client";

import { Badge, Button, Spinner } from "@/components/ui";
import type { AdminUser, ListUsersParams } from "@/hooks/useAdminUsers";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Edit,
  Key,
  MoreHorizontal,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { useState } from "react";

interface UserTableProps {
  users: AdminUser[];
  total: number;
  filters: ListUsersParams;
  onFiltersChange: (filters: ListUsersParams) => void;
  isLoading?: boolean;
  onEdit: (user: AdminUser) => void;
  onBan: (user: AdminUser) => void;
  onUnban: (user: AdminUser) => void;
  onChangeRole: (user: AdminUser) => void;
  onChangePassword: (user: AdminUser) => void;
  onViewSessions: (user: AdminUser) => void;
  onImpersonate: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  currentUserId?: string;
}

export function UserTable({
  users,
  total,
  filters,
  onFiltersChange,
  isLoading,
  onEdit,
  onBan,
  onUnban,
  onChangeRole,
  onChangePassword,
  onViewSessions,
  onImpersonate,
  onDelete,
  currentUserId,
}: UserTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const limit = filters.limit ?? 10;
  const offset = filters.offset ?? 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const handlePageChange = (page: number) => {
    onFiltersChange({
      ...filters,
      offset: (page - 1) * limit,
    });
  };

  const getRoleBadge = (role?: string) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return (
          <Badge variant="purple" className="gap-1">
            <ShieldAlert className="w-3 h-3" />
            Admin
          </Badge>
        );
      case "DEVELOPER":
        return (
          <Badge variant="info" className="gap-1">
            <ShieldCheck className="w-3 h-3" />
            Developer
          </Badge>
        );
      default:
        return (
          <Badge variant="gray" className="gap-1">
            <Shield className="w-3 h-3" />
            User
          </Badge>
        );
    }
  };

  const getStatusBadge = (user: AdminUser) => {
    if (user.banned) {
      return (
        <Badge variant="danger" className="gap-1">
          <UserX className="w-3 h-3" />
          Banido
        </Badge>
      );
    }
    return (
      <Badge variant="success" className="gap-1">
        <UserCheck className="w-3 h-3" />
        Ativo
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-[#1a1a24] border border-[#29292e] p-12 text-center"
      >
        <Users className="w-12 h-12 text-[var(--rocket-gray-400)] mx-auto mb-4" />
        <p className="text-[var(--rocket-gray-400)]">
          Nenhum usuário encontrado
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-xl bg-[#1a1a24] border border-[#29292e] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#29292e] bg-[#0f0f14]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--rocket-gray-400)] uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--rocket-gray-400)] uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--rocket-gray-400)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--rocket-gray-400)] uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--rocket-gray-400)] uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#29292e]">
              {users.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "hover:bg-[#29292e]/30 transition-colors",
                    user.id === currentUserId && "bg-[var(--rocket-purple)]/5"
                  )}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--rocket-purple)] to-[var(--rocket-info)] flex items-center justify-center text-white font-medium text-sm">
                        {user.name?.charAt(0)?.toUpperCase() ||
                          user.email?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--rocket-gray-100)]">
                          {user.name}
                          {user.id === currentUserId && (
                            <span className="ml-2 text-xs text-[var(--rocket-purple)]">
                              (você)
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-[var(--rocket-gray-400)]">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {getStatusBadge(user)}
                      {user.banned && user.banReason && (
                        <p className="text-xs text-[var(--rocket-gray-400)]">
                          Motivo: {user.banReason}
                        </p>
                      )}
                      {user.banned && user.banExpires && (
                        <p className="text-xs text-[var(--rocket-gray-400)]">
                          Expira: {formatDate(user.banExpires)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-[var(--rocket-gray-300)]">
                      {formatDate(user.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* Quick Actions */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(user)}
                        className="h-8 w-8 p-0"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      {/* More Actions Menu */}
                      <div className="relative">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setOpenMenuId(openMenuId === user.id ? null : user.id)
                          }
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>

                        {openMenuId === user.id && (
                          <>
                            {/* Backdrop */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />

                            {/* Menu */}
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute right-0 mt-1 w-48 rounded-lg bg-[#1a1a24] border border-[#29292e] shadow-xl z-20 py-1"
                            >
                              <button
                                onClick={() => {
                                  onChangeRole(user);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-[var(--rocket-gray-100)] hover:bg-[#29292e] flex items-center gap-2"
                              >
                                <Shield className="w-4 h-4" />
                                Alterar Role
                              </button>

                              <button
                                onClick={() => {
                                  onChangePassword(user);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-[var(--rocket-gray-100)] hover:bg-[#29292e] flex items-center gap-2"
                              >
                                <Key className="w-4 h-4" />
                                Alterar Senha
                              </button>

                              <button
                                onClick={() => {
                                  onViewSessions(user);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-[var(--rocket-gray-100)] hover:bg-[#29292e] flex items-center gap-2"
                              >
                                <Users className="w-4 h-4" />
                                Ver Sessões
                              </button>

                              {user.id !== currentUserId && (
                                <>
                                  <div className="border-t border-[#29292e] my-1" />

                                  <button
                                    onClick={() => {
                                      onImpersonate(user);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-[var(--rocket-info)] hover:bg-[#29292e] flex items-center gap-2"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                    Impersonar
                                  </button>

                                  {user.banned ? (
                                    <button
                                      onClick={() => {
                                        onUnban(user);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-[var(--rocket-green)] hover:bg-[#29292e] flex items-center gap-2"
                                    >
                                      <UserCheck className="w-4 h-4" />
                                      Desbanir
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        onBan(user);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-[var(--rocket-warning)] hover:bg-[#29292e] flex items-center gap-2"
                                    >
                                      <Ban className="w-4 h-4" />
                                      Banir
                                    </button>
                                  )}

                                  <div className="border-t border-[#29292e] my-1" />

                                  <button
                                    onClick={() => {
                                      onDelete(user);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-[var(--rocket-danger)] hover:bg-[#29292e] flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Excluir
                                  </button>
                                </>
                              )}
                            </motion.div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-[var(--rocket-gray-400)]">
            Mostrando {offset + 1} - {Math.min(offset + limit, total)} de {total}{" "}
            usuários
          </p>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={currentPage === pageNum ? "default" : "ghost"}
                    onClick={() => handlePageChange(pageNum)}
                    className="h-8 w-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

