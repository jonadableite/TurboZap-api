import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; expiresAt?: string | null }) => Promise<void>;
};

export function CreateApiKeyModal({ isOpen, onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setCreatedKey(null);
    try {
      await onCreate({ name: name || "API Key", expiresAt });
      setCreatedKey("gerada com sucesso - copie agora");
      setName("");
      setExpiresAt(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar chave");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gerar nova API Key"
      description="A chave gerada só será exibida uma vez. Copie e guarde com segurança."
      size="md"
    >
      <div className="space-y-4">
        <Input
          label="Nome da chave"
          placeholder="Minha API Key"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          label="Expiração (opcional)"
          type="datetime-local"
          value={expiresAt ?? ""}
          onChange={(e) => setExpiresAt(e.target.value || null)}
        />

        {error && (
          <p className="text-sm text-[var(--rocket-danger)]">{error}</p>
        )}

        {createdKey && (
          <p className="text-sm text-[var(--rocket-green)]">{createdKey}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            Gerar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

