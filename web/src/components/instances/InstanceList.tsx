'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Search, Key, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import {
  Button,
  EmptyState,
  Spinner,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  LottieIcon,
} from '@/components/ui';
import smartphoneAnimation from '../../../public/responsivo.json';
import diagramaAnimation from '../../../public/diagrama.json';
import FancyButton from '@/components/ui/FancyButton';
import FancySearch from '@/components/ui/FancySearch';
import FancyPattern from '@/components/ui/FancyPattern';
import { InstanceCard } from './InstanceCard';
import { useInstances } from '@/hooks/useInstances';
import { useApiConfig } from '@/hooks/useApiConfig';

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
  const [search, setSearch] = useState('');
  const { hasApiKey, isReady } = useApiConfig();
  const { data: instances = [], isLoading, isError, refetch } = useInstances();
  const router = useRouter();

  // Filter instances based on search
  const filteredInstances = instances.filter((instance) =>
    instance.name.toLowerCase().includes(search.toLowerCase()) ||
    instance.phone?.includes(search) ||
    instance.profileName?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const connectedCount = instances.filter((i) => i.status === 'connected').length;
  const disconnectedCount = instances.filter((i) => i.status === 'disconnected').length;

  if (!isReady || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-[var(--rocket-gray-400)]">
            {isReady ? 'Carregando instâncias...' : 'Preparando painel...'}
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
            <Key className="w-5 h-5 text-[var(--rocket-purple)]" />
            Configure sua API Key
          </CardTitle>
          <CardDescription>
            Para listar e criar instâncias é necessário informar a API Key do TurboZap.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[var(--rocket-gray-300)]">
            Clique no botão abaixo para abrir a tela de configurações e informe a mesma chave
            definida no backend (`API_KEY`).
          </p>
          <div className="flex flex-wrap gap-3">
            <Button leftIcon={<Key className="w-4 h-4" />} onClick={() => router.push('/settings')}>
              Abrir configurações
            </Button>
            <Button variant="ghost" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
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
        icon={<LottieIcon animationData={smartphoneAnimation} className="w-12 h-12" />}
        title="Erro ao carregar instâncias"
        description="Não foi possível carregar as instâncias. Verifique sua conexão."
        action={
          <Button onClick={() => refetch()} leftIcon={<RefreshCw className="w-4 h-4" />}>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden p-5 rounded-2xl bg-[var(--rocket-gray-800)] border border-[var(--rocket-gray-600)] shadow-inner shadow-black/20"
          >
            <FancyPattern color="#8257e5" />
            <div className="relative z-10">
              <p className="text-sm text-[var(--rocket-gray-400)]">Total</p>
              <p className="text-2xl font-bold text-[var(--rocket-gray-50)]">{instances.length}</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden p-5 rounded-2xl bg-[var(--rocket-green)]/10 border border-[var(--rocket-green)]/30 shadow-inner shadow-[var(--rocket-green)]/10"
          >
            <FancyPattern color="#04d361" />
            <div className="relative z-10">
              <p className="text-sm text-[var(--rocket-green)]">Conectadas</p>
              <p className="text-2xl font-bold text-[var(--rocket-green)]">{connectedCount}</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden p-5 rounded-2xl bg-[var(--rocket-danger)]/10 border border-[var(--rocket-danger)]/30 shadow-inner shadow-[var(--rocket-danger)]/10"
          >
            <FancyPattern color="#f75a68" />
            <div className="relative z-10">
              <p className="text-sm text-[var(--rocket-danger)]">Desconectadas</p>
              <p className="text-2xl font-bold text-[var(--rocket-danger)]">{disconnectedCount}</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Search and actions */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--rocket-gray-600)] bg-[var(--rocket-gray-800)]/80 p-4 md:flex-row md:items-center md:justify-between shadow-inner shadow-black/20">
        <div className="w-full md:max-w-sm flex justify-center md:justify-start">
          <FancySearch
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <Button variant="ghost" size="sm" onClick={() => refetch()} leftIcon={<LottieIcon animationData={diagramaAnimation} className="w-4 h-4" />}>
            Atualizar
          </Button>
          <FancyButton onClick={onCreateClick}>
            <Plus className="icon w-5 h-5 mr-2" />
            Nova Instância
          </FancyButton>
        </div>
      </div>

      {/* Empty state */}
      {instances.length === 0 && (
        <EmptyState
          icon={<LottieIcon animationData={smartphoneAnimation} className="w-16 h-16" />}
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
            <Button variant="ghost" onClick={() => setSearch('')}>
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
              <InstanceCard
                instance={instance}
                onRefresh={() => refetch()}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default InstanceList;

