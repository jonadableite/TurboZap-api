"use client";

import { ReminderForm } from "@/components/admin/ReminderForm";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { Header } from "@/components/layout";
import { Button, Modal, Spinner } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import {
  useDeleteReminder,
  useReminders,
  type Reminder,
} from "@/hooks/useReminders";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Edit,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminRemindersPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data: reminders = [], isLoading } = useReminders();
  const deleteMutation = useDeleteReminder();
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Redirect if not admin
  if (!authLoading && !isAdmin) {
    router.push("/");
    return null;
  }

  const handleCreate = () => {
    setEditingReminder(null);
    setShowForm(true);
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este lembrete?")) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting reminder:", error);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingReminder(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingReminder(null);
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
        title="Gerenciar Lembretes"
        description="Crie e gerencie os lembretes exibidos no dashboard"
      />

      <div className="px-4 sm:px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full">
        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h2 className="text-xl font-bold text-[var(--rocket-gray-50)]">
              Lembretes ({reminders.length})
            </h2>
            <p className="text-sm text-[var(--rocket-gray-400)] mt-1">
              Gerencie os lembretes visíveis para todos os usuários
            </p>
          </div>
          <Button
            onClick={handleCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Lembrete
          </Button>
        </motion.div>

        {/* Reminders List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : reminders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-[#1a1a24] border border-[#29292e] p-12 text-center"
          >
            <p className="text-[var(--rocket-gray-400)] mb-4">
              Nenhum lembrete criado ainda
            </p>
            <Button onClick={handleCreate} leftIcon={<Plus className="w-4 h-4" />}>
              Criar Primeiro Lembrete
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder, index) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <ActivityCard {...reminder} />
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(reminder)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(reminder.id)}
                    disabled={deleteMutation.isPending && deletingId === reminder.id}
                    className="h-8 w-8 p-0 text-[var(--rocket-danger)] hover:text-[var(--rocket-danger)] hover:bg-[var(--rocket-danger)]/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <Modal
            isOpen={showForm}
            onClose={handleFormCancel}
            title={editingReminder ? "Editar Lembrete" : "Novo Lembrete"}
            size="lg"
          >
            <ReminderForm
              reminder={editingReminder || undefined}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

