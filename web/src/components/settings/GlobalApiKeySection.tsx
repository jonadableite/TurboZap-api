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
          throw new Error("Não foi possível carregar a chave global");
        }
        const json = await res.json();
        const k = json.data?.key as string;
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
        {error && <p className="text-sm text-[var(--rocket-danger)]">{error}</p>}
        {!error && (
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <code className="text-sm text-white break-all flex-1">
              {masked || "••••••"}
            </code>
            <Button variant="ghost" size="sm" onClick={handleCopy} className="p-2">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

