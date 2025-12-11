import { useEffect, useState } from "react";
import { Lock, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { dispatchApiConfigEvent } from "@/hooks/useApiConfig";

export function GlobalApiKeySection() {
  const [key, setKey] = useState<string | null>(null);
  const [masked, setMasked] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/global-api-key", { cache: "no-store" });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData?.error?.message || 
            "Não foi possível carregar a chave global"
          );
        }
        const json = await res.json();
        if (!json.success || !json.data?.key) {
          throw new Error(
            json.error?.message || 
            "Chave global não configurada"
          );
        }
        const k = json.data.key as string;
        if (!k || typeof k !== "string") {
          throw new Error("Chave global inválida");
        }
        setKey(k);
        setMasked(`${k.slice(0, 4)}••••${k.slice(-4)}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar chave global");
      }
    };
    load();
  }, []);

  const handleCopy = async () => {
    if (!key) return;
    await navigator.clipboard.writeText(key);
    if (typeof window !== "undefined") {
      localStorage.setItem("turbozap_api_key", key);
      dispatchApiConfigEvent();
    }
    showToast("Chave global copiada", "success");
  };

  return (
    <Card className="border-white/10 bg-[var(--rocket-gray-900)]/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Chave Global (Admin)
        </CardTitle>
        <CardDescription>
          Acesso total a todas as instâncias. Mantenha esta chave em segurança.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <div className="rounded-lg border border-[var(--rocket-danger)]/30 bg-[var(--rocket-danger)]/10 px-3 py-2">
            <p className="text-sm text-[var(--rocket-danger)]">{error}</p>
            <p className="text-xs text-[var(--rocket-gray-400)] mt-1">
              Configure a variável de ambiente <code className="px-1 bg-[var(--rocket-gray-800)] rounded">API_KEY</code> no servidor.
            </p>
          </div>
        ) : key ? (
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <code className="text-sm text-white break-all flex-1">
              {masked}
            </code>
            <Button variant="ghost" size="sm" onClick={handleCopy} className="p-2">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <p className="text-sm text-[var(--rocket-gray-400)]">Carregando...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

