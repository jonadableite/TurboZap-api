"use client";

import { Button, Input } from "@/components/ui";
import { useCreateReminder, useUpdateReminder, type CreateReminderInput, type Reminder } from "@/hooks/useReminders";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Clock,
  FileText,
  Link as LinkIcon,
  MapPin,
  Save,
  Tag,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ReminderFormProps {
  reminder?: Reminder;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReminderForm({ reminder, onSuccess, onCancel }: ReminderFormProps) {
  const createMutation = useCreateReminder();
  const updateMutation = useUpdateReminder();
  const isEditing = !!reminder;

  const [formData, setFormData] = useState<CreateReminderInput>({
    title: reminder?.title || "",
    description: reminder?.description || "",
    date: reminder?.date || "",
    time: reminder?.time || "",
    location: reminder?.location || "",
    tags: reminder?.tags || [],
    recommendedLevel: reminder?.recommendedLevel || "",
    status: reminder?.status || "upcoming",
    category: reminder?.category || "all",
    actionButtons: reminder?.actionButtons || {},
  });

  const [tagInput, setTagInput] = useState("");
  const [primaryButtonLabel, setPrimaryButtonLabel] = useState(reminder?.actionButtons?.primary?.label || "");
  const [primaryButtonHref, setPrimaryButtonHref] = useState(reminder?.actionButtons?.primary?.href || "");
  const [secondaryButtonLabel, setSecondaryButtonLabel] = useState(reminder?.actionButtons?.secondary?.label || "");
  const [secondaryButtonHref, setSecondaryButtonHref] = useState(reminder?.actionButtons?.secondary?.href || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const actionButtons: CreateReminderInput["actionButtons"] = {};
    if (primaryButtonLabel) {
      actionButtons.primary = { label: primaryButtonLabel };
      if (primaryButtonHref) actionButtons.primary.href = primaryButtonHref;
    }
    if (secondaryButtonLabel) {
      actionButtons.secondary = { label: secondaryButtonLabel };
      if (secondaryButtonHref) actionButtons.secondary.href = secondaryButtonHref;
    }

    const data: CreateReminderInput = {
      ...formData,
      actionButtons: Object.keys(actionButtons).length > 0 ? actionButtons : undefined,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: reminder.id, ...data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Error saving reminder:", error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim().toUpperCase())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim().toUpperCase()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((tag) => tag !== tagToRemove) || [],
    });
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-4 max-w-full"
    >
      {/* Title */}
      <Input
        label="Título *"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Ex: ÚLTIMAS VAGAS! Imersão ao vivo..."
        leftIcon={<FileText className="w-4 h-4" />}
        required
      />

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-[var(--rocket-gray-100)] mb-2">
          Descrição
        </label>
        <textarea
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição detalhada do lembrete..."
          rows={4}
          className={cn(
            "w-full px-4 py-3 rounded-lg",
            "bg-[var(--rocket-gray-900)] border border-[var(--rocket-gray-600)]",
            "text-[var(--rocket-gray-50)] placeholder:text-[var(--rocket-gray-400)]",
            "transition-all duration-200",
            "focus:outline-none focus:border-[var(--rocket-purple)] focus:ring-2 focus:ring-[var(--rocket-purple)]/20",
            "hover:border-[var(--rocket-gray-500)]",
            "resize-none"
          )}
        />
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Data *"
          type="text"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          placeholder="Ex: 13 DEZ ou 01 - 10 DEZ"
          leftIcon={<Calendar className="w-4 h-4" />}
          helperText="Formato: DD MMM ou DD - DD MMM"
          required
        />
        <Input
          label="Hora"
          type="text"
          value={formData.time || ""}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          placeholder="Ex: 13:30"
          leftIcon={<Clock className="w-4 h-4" />}
          helperText="Formato: HH:MM"
        />
      </div>

      {/* Location */}
      <Input
        label="Localização"
        value={formData.location || ""}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        placeholder="Ex: Online, Classroom do Discord"
        leftIcon={<MapPin className="w-4 h-4" />}
      />

      {/* Recommended Level */}
      <Input
        label="Nível Recomendado"
        value={formData.recommendedLevel || ""}
        onChange={(e) => setFormData({ ...formData, recommendedLevel: e.target.value })}
        placeholder="Ex: Intermediário - Avançado ou A1 - B1..."
        helperText="Nível de habilidade recomendado para o evento"
      />

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-[var(--rocket-gray-100)] mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          <AnimatePresence>
            {formData.tags?.map((tag) => (
              <motion.div
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--rocket-purple)]/20 text-[var(--rocket-purple)] border border-[var(--rocket-purple)]/30 text-xs"
              >
                <Tag className="w-3 h-3" />
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-[var(--rocket-danger)] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Adicionar tag (Enter para adicionar)"
            leftIcon={<Tag className="w-4 h-4" />}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addTag}
            disabled={!tagInput.trim()}
          >
            Adicionar
          </Button>
        </div>
      </div>

      {/* Status and Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--rocket-gray-100)] mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as "active" | "finished" | "upcoming",
              })
            }
            className={cn(
              "w-full px-4 py-3 rounded-lg",
              "bg-[var(--rocket-gray-900)] border border-[var(--rocket-gray-600)]",
              "text-[var(--rocket-gray-50)]",
              "transition-all duration-200",
              "focus:outline-none focus:border-[var(--rocket-purple)] focus:ring-2 focus:ring-[var(--rocket-purple)]/20",
              "hover:border-[var(--rocket-gray-500)]"
            )}
          >
            <option value="upcoming">Próximo</option>
            <option value="active">Ativo</option>
            <option value="finished">Finalizado</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--rocket-gray-100)] mb-2">
            Categoria
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({
                ...formData,
                category: e.target.value as "all" | "events" | "content" | "news" | "offers",
              })
            }
            className={cn(
              "w-full px-4 py-3 rounded-lg",
              "bg-[var(--rocket-gray-900)] border border-[var(--rocket-gray-600)]",
              "text-[var(--rocket-gray-50)]",
              "transition-all duration-200",
              "focus:outline-none focus:border-[var(--rocket-purple)] focus:ring-2 focus:ring-[var(--rocket-purple)]/20",
              "hover:border-[var(--rocket-gray-500)]"
            )}
          >
            <option value="all">Todos</option>
            <option value="events">Eventos</option>
            <option value="content">Conteúdos</option>
            <option value="news">Novidades da Plataforma</option>
            <option value="offers">Ofertas</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4 p-4 rounded-lg bg-[var(--rocket-gray-900)]/50 border border-[var(--rocket-gray-600)]">
        <h3 className="text-sm font-semibold text-[var(--rocket-gray-100)]">
          Botões de Ação
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-[var(--rocket-gray-400)]">
              Botão Primário
            </label>
            <Input
              value={primaryButtonLabel}
              onChange={(e) => setPrimaryButtonLabel(e.target.value)}
              placeholder="Ex: Garantir meu ingresso"
              leftIcon={<LinkIcon className="w-4 h-4" />}
            />
            <Input
              value={primaryButtonHref}
              onChange={(e) => setPrimaryButtonHref(e.target.value)}
              placeholder="URL (opcional)"
              type="url"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-[var(--rocket-gray-400)]">
              Botão Secundário
            </label>
            <Input
              value={secondaryButtonLabel}
              onChange={(e) => setSecondaryButtonLabel(e.target.value)}
              placeholder="Ex: Adicionar ao calendário"
              leftIcon={<LinkIcon className="w-4 h-4" />}
            />
            <Input
              value={secondaryButtonHref}
              onChange={(e) => setSecondaryButtonHref(e.target.value)}
              placeholder="URL (opcional)"
              type="url"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--rocket-gray-600)]">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          isLoading={isLoading}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {isEditing ? "Atualizar" : "Criar"} Lembrete
        </Button>
      </div>
    </motion.form>
  );
}

