import { useCallback, useEffect, useState } from "react";

export type ApiKey = {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  last_used_at?: string | null;
  expires_at?: string | null;
  created_at?: string;
  revoked_at?: string | null;
};

type ApiKeyPayload = {
  name?: string;
  permissions?: string[];
  expiresAt?: string | null;
};

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/apikeys", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Falha ao listar API Keys");
      }
      const json = await res.json();
      setKeys(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao listar API Keys");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createKey = useCallback(
    async (payload: ApiKeyPayload) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/user/apikeys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error("Falha ao criar API Key");
        }
        const json = await res.json();
        const key: ApiKey = json.data;
        setKeys((prev) => [key, ...prev]);
        return key;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar API Key");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateKey = useCallback(
    async (id: string, payload: ApiKeyPayload) => {
      setError(null);
      const res = await fetch(`/api/user/apikeys/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Falha ao atualizar API Key");
      }
      const json = await res.json();
      const updated: ApiKey = json.data;
      setKeys((prev) =>
        prev.map((k) => (k.id === id ? { ...k, ...updated } : k))
      );
      return updated;
    },
    []
  );

  const revokeKey = useCallback(async (id: string) => {
    setError(null);
    const res = await fetch(`/api/user/apikeys/${id}`, { method: "DELETE" });
    if (!res.ok) {
      throw new Error("Falha ao revogar API Key");
    }
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }, []);

  useEffect(() => {
    listKeys();
  }, [listKeys]);

  return {
    keys,
    isLoading,
    error,
    listKeys,
    createKey,
    updateKey,
    revokeKey,
  };
}

