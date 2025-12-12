"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout";
import { Button, Spinner, Badge } from "@/components/ui";
import { Plus, Pencil } from "lucide-react";
import { TrashAnimatedIcon } from "@/components/icons/TrashAnimatedIcon";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  useReminders,
  useDeleteReminder,
  type Reminder,
} from "@/hooks/useReminders";
import { ReminderForm } from "@/components/admin/ReminderForm";

export default function AdminRemindersPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { data: reminders = [], isLoading } = useReminders();
  const deleteReminder = useDeleteReminder();

  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Redirect if not admin
  if (!authLoading && !isAdmin) {
    router.push("/app");
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
    setDeletingId(id);
    try {
      await deleteReminder.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingReminder(null);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Header
        title="Gerenciamento de Lembretes"
        description="Crie e gerencie lembretes do dashboard"
      />

      <div className="px-4 sm:px-8 lg:px-14 py-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--rocket-gray-50)]">
            Lembretes ({reminders.length})
          </h2>
          <Button
            onClick={handleCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo lembrete
          </Button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-[#1a1a24] border border-[#29292e] p-6"
          >
            <h3 className="text-lg font-semibold text-[var(--rocket-gray-50)] mb-4">
              {editingReminder ? "Editar Lembrete" : "Novo Lembrete"}
            </h3>
            <ReminderForm
              reminder={editingReminder || undefined}
              onSuccess={handleSuccess}
              onCancel={() => {
                setShowForm(false);
                setEditingReminder(null);
              }}
            />
          </motion.div>
        )}

        {/* Reminders List */}
        <div className="space-y-4">
          {reminders.length === 0 ? (
            <div className="text-center py-12 text-[var(--rocket-gray-400)]">
              Nenhum lembrete cadastrado. Clique em &quot;Novo lembrete&quot; para
              criar.
            </div>
          ) : (
            reminders.map((reminder, index) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl bg-[#1a1a24] border border-[#29292e] p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-[var(--rocket-gray-50)] truncate">
                      {reminder.title}
                    </h4>
                    <Badge
                      variant={
                        reminder.status === "active" ? "success" : "default"
                      }
                    >
                      {reminder.status}
                    </Badge>
                    {reminder.category && (
                      <Badge variant="purple">{reminder.category}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[var(--rocket-gray-400)] truncate">
                    {reminder.description}
                  </p>
                  {reminder.date && (
                    <p className="text-xs text-[var(--rocket-gray-500)] mt-1">
                      {reminder.date} {reminder.time && `às ${reminder.time}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(reminder)}
                    leftIcon={<Pencil className="w-4 h-4" />}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(reminder.id)}
                    disabled={deletingId === reminder.id}
                    className="text-[var(--rocket-danger)] hover:text-[var(--rocket-danger)]"
                    leftIcon={<TrashAnimatedIcon className="w-4 h-4" />}
                  >
                    {deletingId === reminder.id ? "Excluindo..." : "Excluir"}
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

