"use client";

import { Button, Input } from "@/components/ui";
import type { ListUsersParams } from "@/hooks/useAdminUsers";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useCallback, useState } from "react";

interface UserFiltersProps {
  filters: ListUsersParams;
  onFiltersChange: (filters: ListUsersParams) => void;
  className?: string;
}

export function UserFilters({
  filters,
  onFiltersChange,
  className,
}: UserFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.searchValue || "");

  const handleSearch = useCallback(() => {
    onFiltersChange({
      ...filters,
      searchValue: searchValue || undefined,
      offset: 0, // Reset pagination on new search
    });
  }, [filters, onFiltersChange, searchValue]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleReset = () => {
    setSearchValue("");
    onFiltersChange({
      limit: 10,
      offset: 0,
    });
  };

  const handleSortChange = (sortBy: string) => {
    const newDirection =
      filters.sortBy === sortBy && filters.sortDirection === "asc"
        ? "desc"
        : "asc";
    onFiltersChange({
      ...filters,
      sortBy,
      sortDirection: newDirection,
      offset: 0,
    });
  };

  const handleRoleFilter = (role: string | undefined) => {
    onFiltersChange({
      ...filters,
      filterField: role ? "role" : undefined,
      filterValue: role,
      filterOperator: role ? "eq" : undefined,
      offset: 0,
    });
  };

  const handleBannedFilter = (banned: boolean | undefined) => {
    onFiltersChange({
      ...filters,
      filterField: banned !== undefined ? "banned" : undefined,
      filterValue: banned,
      filterOperator: banned !== undefined ? "eq" : undefined,
      offset: 0,
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rocket-gray-400)]" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSearch} leftIcon={<Search className="w-4 h-4" />}>
            Buscar
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
          >
            Filtros
          </Button>
          <Button
            variant="ghost"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Limpar
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-xl bg-[#1a1a24] border border-[#29292e] p-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Field */}
            <div>
              <label className="text-sm text-[var(--rocket-gray-400)] mb-2 block">
                Buscar em
              </label>
              <select
                value={filters.searchField || "email"}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    searchField: e.target.value as "email" | "name",
                  })
                }
                className="w-full h-10 px-3 rounded-lg bg-[#0f0f14] border border-[#29292e] text-[var(--rocket-gray-100)] focus:outline-none focus:border-[var(--rocket-purple)]"
              >
                <option value="email">Email</option>
                <option value="name">Nome</option>
              </select>
            </div>

            {/* Search Operator */}
            <div>
              <label className="text-sm text-[var(--rocket-gray-400)] mb-2 block">
                Tipo de busca
              </label>
              <select
                value={filters.searchOperator || "contains"}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    searchOperator: e.target.value as
                      | "contains"
                      | "starts_with"
                      | "ends_with",
                  })
                }
                className="w-full h-10 px-3 rounded-lg bg-[#0f0f14] border border-[#29292e] text-[var(--rocket-gray-100)] focus:outline-none focus:border-[var(--rocket-purple)]"
              >
                <option value="contains">Contém</option>
                <option value="starts_with">Começa com</option>
                <option value="ends_with">Termina com</option>
              </select>
            </div>

            {/* Role Filter */}
            <div>
              <label className="text-sm text-[var(--rocket-gray-400)] mb-2 block">
                Role
              </label>
              <select
                value={
                  filters.filterField === "role"
                    ? String(filters.filterValue)
                    : ""
                }
                onChange={(e) =>
                  handleRoleFilter(e.target.value || undefined)
                }
                className="w-full h-10 px-3 rounded-lg bg-[#0f0f14] border border-[#29292e] text-[var(--rocket-gray-100)] focus:outline-none focus:border-[var(--rocket-purple)]"
              >
                <option value="">Todos</option>
                <option value="USER">Usuário</option>
                <option value="DEVELOPER">Desenvolvedor</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            {/* Banned Filter */}
            <div>
              <label className="text-sm text-[var(--rocket-gray-400)] mb-2 block">
                Status
              </label>
              <select
                value={
                  filters.filterField === "banned"
                    ? String(filters.filterValue)
                    : ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  handleBannedFilter(
                    val === "" ? undefined : val === "true"
                  );
                }}
                className="w-full h-10 px-3 rounded-lg bg-[#0f0f14] border border-[#29292e] text-[var(--rocket-gray-100)] focus:outline-none focus:border-[var(--rocket-purple)]"
              >
                <option value="">Todos</option>
                <option value="false">Ativos</option>
                <option value="true">Banidos</option>
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="mt-4 pt-4 border-t border-[#29292e]">
            <label className="text-sm text-[var(--rocket-gray-400)] mb-2 block">
              Ordenar por
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "name", label: "Nome" },
                { key: "email", label: "Email" },
                { key: "createdAt", label: "Data de criação" },
                { key: "role", label: "Role" },
              ].map((option) => (
                <Button
                  key={option.key}
                  size="sm"
                  variant={filters.sortBy === option.key ? "default" : "outline"}
                  onClick={() => handleSortChange(option.key)}
                  rightIcon={
                    filters.sortBy === option.key ? (
                      filters.sortDirection === "asc" ? (
                        <ArrowUpAZ className="w-3 h-3" />
                      ) : (
                        <ArrowDownAZ className="w-3 h-3" />
                      )
                    ) : undefined
                  }
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Active Filters Summary */}
      {(filters.searchValue ||
        filters.filterField ||
        filters.sortBy) && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--rocket-gray-400)]" />
          <span className="text-sm text-[var(--rocket-gray-400)]">
            Filtros ativos:
          </span>
          {filters.searchValue && (
            <span className="px-2 py-1 text-xs rounded-full bg-[var(--rocket-purple)]/20 text-[var(--rocket-purple)]">
              Busca: {filters.searchValue}
            </span>
          )}
          {filters.filterField === "role" && (
            <span className="px-2 py-1 text-xs rounded-full bg-[var(--rocket-info)]/20 text-[var(--rocket-info)]">
              Role: {String(filters.filterValue)}
            </span>
          )}
          {filters.filterField === "banned" && (
            <span className="px-2 py-1 text-xs rounded-full bg-[var(--rocket-danger)]/20 text-[var(--rocket-danger)]">
              {filters.filterValue ? "Banidos" : "Ativos"}
            </span>
          )}
          {filters.sortBy && (
            <span className="px-2 py-1 text-xs rounded-full bg-[var(--rocket-green)]/20 text-[var(--rocket-green)]">
              Ordenado: {filters.sortBy} ({filters.sortDirection})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

