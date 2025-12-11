import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ApiKey } from "@/hooks/useApiKeys";
import { cn } from "@/lib/utils";
import { Copy, Eye, EyeOff, Trash2 } from "lucide-react";
import { useState } from "react";

type Props = {
  apiKey: ApiKey;
  onCopy: (value: string) => void;
  onRevoke: () => void;
};

export function ApiKeyCard({ apiKey, onCopy, onRevoke }: Props) {
  const [showKey, setShowKey] = useState(false);

  const masked = apiKey.key
    ? `${apiKey.key.slice(0, 4)}••••${apiKey.key.slice(-4)}`
    : "••••••";

  const status = apiKey.revoked_at
    ? { label: "Revogada", tone: "danger" }
    : apiKey.expires_at && new Date(apiKey.expires_at) < new Date()
    ? { label: "Expirada", tone: "warning" }
    : { label: "Ativa", tone: "success" };

  return (
    <div className="rounded-xl border border-white/10 bg-[var(--rocket-gray-900)]/70 backdrop-blur-sm p-4 shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--rocket-gray-400)]">Nome</p>
          <p className="text-lg font-semibold text-white">{apiKey.name}</p>
          <p className="text-xs text-[var(--rocket-gray-500)]">
            Criada em {new Date(apiKey.created_at ?? "").toLocaleString()}
          </p>
        </div>

        <Badge
          variant={
            status.tone === "danger"
              ? "danger"
              : status.tone === "warning"
              ? "warning"
              : "success"
          }
          className={cn(
            status.tone === "warning" &&
              "bg-[var(--rocket-warning)]/20 text-[var(--rocket-warning)]",
            status.tone === "success" &&
              "bg-[var(--rocket-green)]/20 text-[var(--rocket-green)]"
          )}
        >
          {status.label}
        </Badge>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <code className="text-sm text-white break-all flex-1">
          {showKey ? apiKey.key : masked}
        </code>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowKey(!showKey)}
          className="p-2"
        >
          {showKey ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCopy(apiKey.key)}
          className="p-2"
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--rocket-gray-400)]">
        {apiKey.expires_at && (
          <span>Expira em {new Date(apiKey.expires_at).toLocaleString()}</span>
        )}
        {apiKey.last_used_at && (
          <span>
            Último uso {new Date(apiKey.last_used_at).toLocaleString()}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRevoke}
          leftIcon={<Trash2 className="w-4 h-4" />}
          disabled={!!apiKey.revoked_at}
        >
          Revogar
        </Button>
      </div>
    </div>
  );
}
