'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'turbozap_api_key';
const STORAGE_URL_KEY = 'turbozap_api_url';
const CONFIG_EVENT = 'turbozap:api-config-updated';

export function dispatchApiConfigEvent() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CONFIG_EVENT));
}

export function useApiConfig() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const load = () => {
      const storedKey = localStorage.getItem(STORAGE_KEY);
      const storedUrl =
        localStorage.getItem(STORAGE_URL_KEY) ||
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:8080';
      setApiKey(storedKey);
      setApiUrl(storedUrl);
      setIsReady(true);
    };

    load();
    window.addEventListener(CONFIG_EVENT, load);
    return () => {
      window.removeEventListener(CONFIG_EVENT, load);
    };
  }, []);

  const updateConfig = useCallback(
    (key?: string, url?: string) => {
      if (typeof window === 'undefined') return;
      if (key !== undefined) {
        if (key) {
          localStorage.setItem(STORAGE_KEY, key);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
        setApiKey(key || null);
      }
      if (url !== undefined) {
        if (url) {
          localStorage.setItem(STORAGE_URL_KEY, url);
        } else {
          localStorage.removeItem(STORAGE_URL_KEY);
        }
        setApiUrl(url || null);
      }
      dispatchApiConfigEvent();
    },
    []
  );

  return {
    apiKey,
    apiUrl,
    hasApiKey: Boolean(apiKey),
    isReady,
    updateConfig,
  };
}


