import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useToast } from "@/components/ui/Toast";
import { dispatchApiConfigEvent } from "@/hooks/useApiConfig";
import { ApiKeyCard } from "./ApiKeyCard";
import { CreateApiKeyModal } from "./CreateApiKeyModal";

export function ApiKeysSection() {
  const { keys, isLoading, error, createKey, revokeKey } = useApiKeys();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCopy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("turbozap_api_key", value);
      dispatchApiConfigEvent();
    }
    showToast("Chave copiada!", "success");
  };

  const handleCreate = async (data: { name: string; expiresAt?: string | null }) => {
    const key = await createKey({
      name: data.name,
      expiresAt: data.expiresAt ?? undefined,
    });
    if (key?.key) {
      // Persist for immediate use on requests and update listeners
      localStorage.setItem("turbozap_api_key", key.key);
      dispatchApiConfigEvent();
      await navigator.clipboard.writeText(key.key);
    }
    showToast("API Key criada. Copie e guarde com segurança.", "success");
    setIsModalOpen(false);
  };

  return (
    <Card className="border-white/10 bg-[var(--rocket-gray-900)]/60 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>API Keys</CardTitle>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
          Nova API Key
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--rocket-gray-300)]">
            <Spinner className="w-4 h-4" />
            Carregando...
          </div>
        )}

        {error && <p className="text-sm text-[var(--rocket-danger)]">{error}</p>}

        {keys.length === 0 && !isLoading && (
          <p className="text-sm text-[var(--rocket-gray-400)]">
            Nenhuma API Key criada. Clique em &quot;Nova API Key&quot; para gerar.
          </p>
        )}

        <div className="grid gap-3">
          {keys.map((key) => (
            <ApiKeyCard
              key={key.id}
              apiKey={key}
              onCopy={() => handleCopy(key.key)}
              onRevoke={() => revokeKey(key.id)}
            />
          ))}
        </div>
      </CardContent>

      <CreateApiKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />
    </Card>
  );
}

