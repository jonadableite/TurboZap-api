"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  LottieIcon,
  Spinner,
} from "@/components/ui";
import FancyButton from "@/components/ui/FancyButton";
import { useApiConfig } from "@/hooks/useApiConfig";
import { useInstances } from "@/hooks/useInstances";
import { motion } from "framer-motion";
import { PrivateKeyAnimatedIcon } from "@/components/icons/PrivateKeyAnimatedIcon";
import { Plus, RefreshCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import smartphoneAnimation from "../../../public/responsivo.json";
import { InstanceCard } from "./InstanceCard";

interface InstanceListProps {
  onCreateClick: () => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function InstanceList({ onCreateClick }: InstanceListProps) {
  const [search, setSearch] = useState("");
  const { hasApiKey, isReady } = useApiConfig();
  const { data: instances = [], isLoading, isError, refetch } = useInstances();
  const router = useRouter();

  // Filter instances based on search
  const filteredInstances = instances.filter(
    (instance) =>
      instance.name.toLowerCase().includes(search.toLowerCase()) ||
      instance.phone?.includes(search) ||
      instance.profileName?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const connectedCount = instances.filter(
    (i) => i.status === "connected"
  ).length;
  const disconnectedCount = instances.filter(
    (i) => i.status === "disconnected"
  ).length;

  if (!isReady || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-[var(--rocket-gray-400)]">
            {isReady ? "Carregando instâncias..." : "Preparando painel..."}
          </p>
        </div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--rocket-gray-50)]">
            <PrivateKeyAnimatedIcon className="w-5 h-5" />
            Configure sua API Key
          </CardTitle>
          <CardDescription>
            Para listar e criar instâncias é necessário informar a API Key do
            TurboZap.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[var(--rocket-gray-300)]">
            Clique no botão abaixo para abrir a tela de configurações e informe
            a mesma chave definida no backend (`API_KEY`).
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              leftIcon={<PrivateKeyAnimatedIcon className="w-4 h-4" />}
              onClick={() => router.push("/settings")}
            >
              Abrir configurações
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Ver instruções no topo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={
          <LottieIcon
            animationData={smartphoneAnimation}
            className="w-12 h-12"
          />
        }
        title="Erro ao carregar instâncias"
        description="Não foi possível carregar as instâncias. Verifique sua conexão."
        action={
          <Button
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Tentar novamente
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-8 w-full">
      {/* Stats cards */}
      {instances.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: "Total",
              value: instances.length,
              color: "var(--rocket-gray-50)",
              badgeColor: "var(--rocket-gray-400)",
            },
            {
              label: "Conectadas",
              value: connectedCount,
              color: "var(--rocket-green)",
              badgeColor: "var(--rocket-green)",
            },
            {
              label: "Desconectadas",
              value: disconnectedCount,
              color: "var(--rocket-danger)",
              badgeColor: "var(--rocket-danger)",
            },
          ].map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className="rounded-xl bg-[#1a1a24] border border-[#29292e] p-5 flex flex-col gap-2"
            >
              <p className="text-sm" style={{ color: card.badgeColor }}>
                {card.label}
              </p>
              <p
                className="text-2xl font-semibold"
                style={{ color: card.color }}
              >
                {card.value}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search and actions */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--rocket-gray-600)] bg-[var(--rocket-gray-800)]/80 p-4 md:flex-row md:items-center md:justify-between shadow-inner shadow-black/20">
        <div className="w-full md:max-w-sm flex justify-center md:justify-start">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rocket-gray-400)]" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
          <Button
            onClick={onCreateClick}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nova Instância
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {instances.length === 0 && (
        <EmptyState
          icon={
            <LottieIcon
              animationData={smartphoneAnimation}
              className="w-16 h-16"
            />
          }
          title="Nenhuma instância"
          description="Você ainda não criou nenhuma instância. Crie sua primeira instância para começar a usar a API."
          action={
            <FancyButton onClick={onCreateClick}>
              <Plus className="icon w-5 h-5 mr-2" />
              Criar primeira instância
            </FancyButton>
          }
        />
      )}

      {/* No results */}
      {instances.length > 0 && filteredInstances.length === 0 && (
        <EmptyState
          icon={<Search className="w-12 h-12" />}
          title="Nenhum resultado"
          description={`Nenhuma instância encontrada para "${search}"`}
          action={
            <Button variant="ghost" onClick={() => setSearch("")}>
              Limpar busca
            </Button>
          }
        />
      )}

      {/* Instance grid */}
      {filteredInstances.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filteredInstances.map((instance) => (
            <motion.div key={instance.id} variants={item}>
              <InstanceCard instance={instance} onRefresh={() => refetch()} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default InstanceList;
