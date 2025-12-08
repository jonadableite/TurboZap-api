"use client";

import { useState, useEffect } from "react";
import { Play, Copy, Loader2, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, Button, Input } from "@/components/ui";
import { useApiConfig } from "@/hooks/useApiConfig";

interface Param {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  default?: string;
}

interface ApiPlaygroundProps {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  endpoint: string;
  description?: string;
  pathParams?: Param[];
  bodyParams?: Param[];
  queryParams?: Param[];
}

const methodColors = {
  GET: "bg-green-500/10 text-green-500 border-green-500/20",
  POST: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  PUT: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
  PATCH: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

type PlaygroundResponse =
  | {
      status: number;
      statusText: string;
      data: unknown;
      headers: Record<string, string>;
      time: string;
      error?: string;
    }
  | {
      error: string;
      data?: unknown;
      status?: number;
      statusText?: string;
      headers?: Record<string, string>;
      time?: string;
    };

const LanguageSelector = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (lang: string) => void;
}) => {
  const languages = ["cURL", "JavaScript", "Python", "Go"];
  return (
    <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => onSelect(lang)}
          className={cn(
            "px-3 py-1 rounded-md text-xs font-medium transition-colors",
            selected === lang
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {lang}
        </button>
      ))}
    </div>
  );
};

export function ApiPlayground({
  method,
  endpoint,
  description,
  pathParams = [],
  bodyParams = [],
  queryParams = [],
}: ApiPlaygroundProps) {
  const { apiKey: storedApiKey, apiUrl: storedApiUrl } = useApiConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<PlaygroundResponse | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [apiKey, setApiKey] = useState("");
  const [activeTab, setActiveTab] = useState("response"); // response, code
  const [selectedLang, setSelectedLang] = useState("JavaScript");

  // Auto-fill API key from storage
  useEffect(() => {
    if (storedApiKey && !apiKey) {
      setApiKey(storedApiKey);
    }
  }, [storedApiKey, apiKey]);

  // Initialize params with defaults
  useEffect(() => {
    const initialParams: Record<string, string> = {};
    [...pathParams, ...bodyParams, ...queryParams].forEach((p) => {
      if (p.default) initialParams[p.name] = p.default;
    });
    setParams(initialParams);
  }, [pathParams, bodyParams, queryParams]);

  const handleParamChange = (name: string, value: string) => {
    setParams(prev => ({ ...prev, [name]: value }));
  };

  const getBaseUrl = () => {
    return storedApiUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  };

  const getFullUrl = () => {
    let url = endpoint;
    // Replace path params
    pathParams.forEach(p => {
      const value = params[p.name] || `:${p.name}`;
      url = url.replace(`:${p.name}`, value);
    });

    // Add query params
    const queryParts = queryParams
      .filter(p => params[p.name])
      .map(p => `${p.name}=${encodeURIComponent(params[p.name])}`);

    if (queryParts.length > 0) {
      url += `?${queryParts.join("&")}`;
    }

    // Base URL from config or env
    return `${getBaseUrl()}${url}`;
  };

  const generateCode = () => {
    const url = getFullUrl();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-API-Key": apiKey } : {}),
    };

    const body: Record<string, string> = {};
    bodyParams.forEach((p) => {
      if (params[p.name]) body[p.name] = params[p.name];
    });

    switch (selectedLang) {
      case "cURL":
        let curl = `curl -X ${method} "${url}" \\`;
        Object.entries(headers).forEach(([k, v]) => {
          curl += `\n  -H "${k}: ${v}" \\`;
        });
        if (Object.keys(body).length > 0) {
          curl += `\n  -d '${JSON.stringify(body, null, 2)}'`;
        }
        return curl;

      case "JavaScript":
        return `const options = {
  method: '${method}',
  headers: ${JSON.stringify(headers, null, 2)},
  ${Object.keys(body).length > 0 ? `body: JSON.stringify(${JSON.stringify(body, null, 2)})` : ''}
};

fetch('${url}', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));`;

      case "Python":
        return `import requests

url = "${url}"
headers = ${JSON.stringify(headers, null, 2)}
${Object.keys(body).length > 0 ? `payload = ${JSON.stringify(body, null, 2)}` : ''}

response = requests.request("${method}", url, headers=headers${Object.keys(body).length > 0 ? ', json=payload' : ''})

print(response.text)`;

      case "Go":
        return `package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
    ${Object.keys(body).length > 0 ? "\"strings\"" : ""}
)

func main() {
	url := "${url}"
	req, _ := http.NewRequest("${method}", url, ${Object.keys(body).length > 0 ? `strings.NewReader(\`${JSON.stringify(body)}\`)` : 'nil'})

	${Object.entries(headers).map(([k, v]) => `req.Header.Add("${k}", "${v}")`).join('\n\t')}

	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()
	body, _ := ioutil.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))
}`;

      default:
        return "Select a language";
    }
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setResponse(null);
    setActiveTab("response");

    try {
      const url = getFullUrl();
      const headers: Record<string, string> = {
        ...(apiKey ? { "X-API-Key": apiKey } : {}),
      };

      const body: Record<string, string> = {};
      bodyParams.forEach((p) => {
        if (params[p.name]) body[p.name] = params[p.name];
      });

      const res = await axios({
        method,
        url,
        headers,
        data: Object.keys(body).length > 0 ? body : undefined,
        validateStatus: () => true, // Don't throw on error status
      });

      setResponse({
        status: res.status,
        statusText: res.statusText,
        data: res.data,
        headers: res.headers as Record<string, string>,
        time: "120ms" // Mock time for now or calculate real duration
      });
    } catch (error: unknown) {
      const isAxiosError = axios.isAxiosError(error);
      const message = isAxiosError
        ? error.message
        : "Unexpected error executing request";
      const data = isAxiosError ? error.response?.data : undefined;
      setResponse({
        error: message,
        data,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="my-8 rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3 font-mono">
          <Badge className={cn("text-xs font-bold px-2 py-0.5 border", methodColors[method])}>
            {method}
          </Badge>
          <span className="text-sm font-medium text-foreground/80">{endpoint}</span>
        </div>
        <Button
          variant="default" // Changed from outline to default for primary action
          size="sm"
          onClick={() => setIsOpen(true)}
          className={cn(
            "gap-2 transition-all duration-300",
            isOpen ? "bg-primary text-primary-foreground" : ""
          )}
        >
          <Play className="w-3 h-3" />
          Try it
        </Button>
      </div>

      {/* Description */}
      {description && (
        <div className="px-4 py-3 text-sm text-muted-foreground border-b border-border bg-card/50">
          {description}
        </div>
      )}

      {/* Playground Area */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border overflow-hidden"
          >
            <div className="p-6 grid lg:grid-cols-2 gap-8 bg-card">
              {/* Left Column: Config */}
              <div className="space-y-6">

                {/* Auth */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    Authorization
                    <Badge  className="text-[10px] py-0 h-4">Header</Badge>
                    {/* variant="secondary" */}
                  </h4>
                  <Input
                    placeholder="Enter your X-API-Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-background font-mono text-sm"
                  />
                </div>

                {/* Path Params */}
                {pathParams.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Path Parameters</h4>
                    <div className="space-y-3">
                      {pathParams.map(param => (
                        <div key={param.name} className="grid gap-1">
                          <div className="flex justify-between">
                            <label className="text-sm font-medium font-mono text-foreground/80">{param.name}</label>
                            {param.required && <span className="text-[10px] text-red-400 font-mono">required</span>}
                          </div>
                          <Input
                            placeholder={param.description || `Value for ${param.name}`}
                            value={params[param.name] || ""}
                            onChange={(e) => handleParamChange(param.name, e.target.value)}
                            className="bg-background font-mono text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Body Params */}
                {bodyParams.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Body Parameters</h4>
                    <div className="space-y-3">
                      {bodyParams.map(param => (
                        <div key={param.name} className="grid gap-1">
                          <div className="flex justify-between">
                            <label className="text-sm font-medium font-mono text-foreground/80">{param.name}</label>
                            {param.required && <span className="text-[10px] text-red-400 font-mono">required</span>}
                          </div>
                          <Input
                            placeholder={param.description || `Value for ${param.name}`}
                            value={params[param.name] || ""}
                            onChange={(e) => handleParamChange(param.name, e.target.value)}
                            className="bg-background font-mono text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleExecute}
                  disabled={isLoading}
                  className="w-full gap-2 mt-4"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Send Request
                </Button>
              </div>

              {/* Right Column: Output & Code */}
              <div className="flex flex-col h-full min-h-[400px] border border-border rounded-lg bg-[#1e1e1e] overflow-hidden shadow-inner">
                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-[#2d2d2d]">
                  <button
                    onClick={() => setActiveTab("response")}
                    className={cn(
                      "px-4 py-2 text-xs font-medium transition-colors border-r border-white/10",
                      activeTab === "response"
                        ? "bg-[#1e1e1e] text-white"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    Response
                  </button>
                  <button
                    onClick={() => setActiveTab("code")}
                    className={cn(
                      "px-4 py-2 text-xs font-medium transition-colors border-r border-white/10",
                      activeTab === "code"
                        ? "bg-[#1e1e1e] text-white"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    Code Samples
                  </button>
                </div>

                <div className="flex-1 p-4 overflow-auto font-mono text-xs">
                  {activeTab === "response" ? (
                    response ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <div className="flex items-center gap-3">
                            <Badge
                              //variant="outline"
                              className={cn(
                                "font-bold",
                                typeof response.status === "number" && response.status >= 200 && response.status < 300
                                  ? "text-green-400 border-green-500/50"
                                  : "text-red-400 border-red-500/50"
                              )}
                            >
                              {typeof response.status === "number" ? response.status : "-"} {response.statusText || ""}
                            </Badge>
                            <span className="text-gray-500">{response.time}</span>
                          </div>
                          <span className="text-gray-500">{new Date().toLocaleTimeString()}</span>
                        </div>
                        <pre className="text-green-400 whitespace-pre-wrap">
                          {JSON.stringify(response.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2 opacity-50">
                        <Terminal className="w-8 h-8" />
                        <p>Execute a request to see the response</p>
                      </div>
                    )
                  ) : (
                    <div className="h-full flex flex-col">
                      <LanguageSelector selected={selectedLang} onSelect={setSelectedLang} />
                      <div className="relative flex-1 group">
                        <pre className="text-blue-300 h-full overflow-auto pt-2">
                          {generateCode()}
                        </pre>
                        <button
                          onClick={() => navigator.clipboard.writeText(generateCode())}
                          className="absolute top-2 right-2 p-2 rounded bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
                          title="Copy code"
                        >
                          <Copy className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
