"use client";

import { Badge, Button, Input } from "@/components/ui";
import { useApiConfig } from "@/hooks/useApiConfig";
import { cn } from "@/lib/utils";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Loader2, Play, Terminal } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

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

// Language icon component using SVG files from public folder
const LanguageIcon = ({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) => (
  <Image
    src={src}
    alt={alt}
    width={14}
    height={14}
    className={cn("shrink-0 object-contain", className)}
  />
);

// Language configuration with icons and colors
const languageConfig = {
  cURL: {
    iconSrc: "/programacao-da-web.svg",
    iconAlt: "cURL",
    color: "text-gray-300",
    hoverColor: "text-gray-200",
    borderColor: "border-white/10",
    hoverBorder: "border-white/30",
    selectedBorder: "border-white/50",
    bgGradient: "from-black/60 to-black/40",
    hoverGradient: "from-white/10 to-black/40",
    shimmerColor: "via-white/10",
    glow: "shadow-white/20",
    hoverGlow: "shadow-2xl shadow-white/20",
    rotate: "hover:rotate-3",
  },
  JavaScript: {
    iconSrc: "/arquivo-js.svg",
    iconAlt: "JavaScript",
    color: "text-yellow-400",
    hoverColor: "text-yellow-300",
    borderColor: "border-yellow-500/20",
    hoverBorder: "border-yellow-500/50",
    selectedBorder: "border-yellow-500/70",
    bgGradient: "from-black/60 to-black/40",
    hoverGradient: "from-yellow-500/10 to-black/40",
    shimmerColor: "via-yellow-400/20",
    glow: "shadow-yellow-500/20",
    hoverGlow: "shadow-2xl shadow-yellow-500/30",
    rotate: "hover:rotate-2",
  },
  Python: {
    iconSrc: "/python.svg",
    iconAlt: "Python",
    color: "text-blue-400",
    hoverColor: "text-blue-300",
    borderColor: "border-blue-500/20",
    hoverBorder: "border-blue-500/50",
    selectedBorder: "border-blue-500/70",
    bgGradient: "from-black/60 to-black/40",
    hoverGradient: "from-blue-500/10 to-black/40",
    shimmerColor: "via-blue-400/20",
    glow: "shadow-blue-500/20",
    hoverGlow: "shadow-2xl shadow-blue-500/30",
    rotate: "hover:-rotate-2",
  },
  Go: {
    iconSrc: "/Go-Logo_Blue.svg",
    iconAlt: "Go",
    color: "text-cyan-400",
    hoverColor: "text-cyan-300",
    borderColor: "border-cyan-500/20",
    hoverBorder: "border-cyan-500/50",
    selectedBorder: "border-cyan-500/70",
    bgGradient: "from-black/60 to-black/40",
    hoverGradient: "from-cyan-500/10 to-black/40",
    shimmerColor: "via-cyan-400/20",
    glow: "shadow-cyan-500/20",
    hoverGlow: "shadow-2xl shadow-cyan-500/30",
    rotate: "hover:rotate-2",
  },
} as const;

const LanguageSelector = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (lang: string) => void;
}) => {
  const languages = Object.keys(languageConfig) as Array<
    keyof typeof languageConfig
  >;

  return (
    <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700/50 scrollbar-track-transparent hover:scrollbar-thumb-gray-700/80">
      {languages.map((lang) => {
        const config = languageConfig[lang];
        const isSelected = selected === lang;

        return (
          <button
            key={lang}
            onClick={() => onSelect(lang)}
            className={cn(
              "group relative inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md",
              "backdrop-blur-lg border transition-all duration-300 ease-out",
              "min-w-fit whitespace-nowrap overflow-hidden",
              "text-sm font-medium ring-offset-background",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "shadow-lg active:scale-95",
              // Background gradients
              "bg-gradient-to-tr from-black/60 to-black/40",
              isSelected
                ? cn(
                    config.selectedBorder,
                    config.color,
                    config.hoverGlow,
                    "scale-[1.02]"
                  )
                : cn(
                    config.borderColor,
                    "text-gray-400",
                    config.hoverBorder,
                    config.hoverGlow,
                    "hover:scale-[1.01]"
                  ),
              // Hover gradient backgrounds
              lang === "cURL" && "hover:bg-gradient-to-tr hover:from-white/10 hover:to-black/40",
              lang === "JavaScript" && "hover:bg-gradient-to-tr hover:from-yellow-500/10 hover:to-black/40",
              lang === "Python" && "hover:bg-gradient-to-tr hover:from-blue-500/10 hover:to-black/40",
              lang === "Go" && "hover:bg-gradient-to-tr hover:from-cyan-500/10 hover:to-black/40"
            )}
            title={`Switch to ${lang} code example`}
          >
            {/* Shimmer effect */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-r from-transparent to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out rounded-md",
                config.shimmerColor
              )}
            />

            {/* Content */}
            <div className="relative z-10 flex items-center gap-2">
              {/* Icon with language-specific color */}
              <div className="shrink-0 flex items-center justify-center">
                <LanguageIcon
                  src={config.iconSrc}
                  alt={config.iconAlt}
                  className={cn(
                    "w-4 h-4 transition-all duration-300",
                    isSelected
                      ? config.color
                      : "opacity-70 group-hover:opacity-100",
                    !isSelected && lang === "cURL" && "group-hover:text-gray-200",
                    !isSelected && lang === "JavaScript" && "group-hover:text-yellow-300",
                    !isSelected && lang === "Python" && "group-hover:text-blue-300",
                    !isSelected && lang === "Go" && "group-hover:text-cyan-300"
                  )}
                />
              </div>

              {/* Language name */}
              <span
                className={cn(
                  "text-xs font-medium leading-none transition-all duration-300",
                  isSelected ? config.color : "text-gray-400",
                  !isSelected && lang === "cURL" && "group-hover:text-gray-200",
                  !isSelected && lang === "JavaScript" && "group-hover:text-yellow-300",
                  !isSelected && lang === "Python" && "group-hover:text-blue-300",
                  !isSelected && lang === "Go" && "group-hover:text-cyan-300"
                )}
              >
                {lang}
              </span>
            </div>
          </button>
        );
      })}
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
    setParams((prev) => ({ ...prev, [name]: value }));
  };

  const getBaseUrl = () => {
    return (
      storedApiUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
    );
  };

  const getFullUrl = () => {
    let url = endpoint;
    // Replace path params
    pathParams.forEach((p) => {
      const value = params[p.name] || `:${p.name}`;
      url = url.replace(`:${p.name}`, value);
    });

    // Add query params
    const queryParts = queryParams
      .filter((p) => params[p.name])
      .map((p) => `${p.name}=${encodeURIComponent(params[p.name])}`);

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
  ${
    Object.keys(body).length > 0
      ? `body: JSON.stringify(${JSON.stringify(body, null, 2)})`
      : ""
  }
};

fetch('${url}', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));`;

      case "Python":
        return `import requests

url = "${url}"
headers = ${JSON.stringify(headers, null, 2)}
${
  Object.keys(body).length > 0
    ? `payload = ${JSON.stringify(body, null, 2)}`
    : ""
}

response = requests.request("${method}", url, headers=headers${
          Object.keys(body).length > 0 ? ", json=payload" : ""
        })

print(response.text)`;

      case "Go":
        return `package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
    ${Object.keys(body).length > 0 ? '"strings"' : ""}
)

func main() {
	url := "${url}"
	req, _ := http.NewRequest("${method}", url, ${
          Object.keys(body).length > 0
            ? `strings.NewReader(\`${JSON.stringify(body)}\`)`
            : "nil"
        })

	${Object.entries(headers)
    .map(([k, v]) => `req.Header.Add("${k}", "${v}")`)
    .join("\n\t")}

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
        time: "120ms", // Mock time for now or calculate real duration
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
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3 font-mono">
          <Badge
            className={cn(
              "text-xs font-bold px-2 py-0.5 border",
              methodColors[method]
            )}
          >
            {method}
          </Badge>
          <span className="text-sm font-medium text-foreground/80">
            {endpoint}
          </span>
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
        <div className="px-6 py-4 text-sm leading-relaxed text-muted-foreground border-b border-border bg-card/50">
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
            <div className="p-8 lg:p-10 grid lg:grid-cols-2 gap-10 lg:gap-12 bg-card">
              {/* Left Column: Config */}
              <div className="space-y-7">
                {/* Auth */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-1">
                    Authorization
                    <Badge variant="default" className="text-[10px] py-0 h-4">
                      Header
                    </Badge>
                  </h4>
                  <Input
                    placeholder="Enter your X-API-Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-background font-mono text-sm h-10"
                  />
                </div>

                {/* Path Params */}
                {pathParams.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Path Parameters
                    </h4>
                    <div className="space-y-4">
                      {pathParams.map((param) => (
                        <div key={param.name} className="grid gap-2">
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-medium font-mono text-foreground/80">
                              {param.name}
                            </label>
                            {param.required && (
                              <span className="text-[10px] text-red-400 font-mono">
                                required
                              </span>
                            )}
                          </div>
                          <Input
                            placeholder={
                              param.description || `Value for ${param.name}`
                            }
                            value={params[param.name] || ""}
                            onChange={(e) =>
                              handleParamChange(param.name, e.target.value)
                            }
                            className="bg-background font-mono text-sm h-10"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Body Params */}
                {bodyParams.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Body Parameters
                    </h4>
                    <div className="space-y-4">
                      {bodyParams.map((param) => (
                        <div key={param.name} className="grid gap-2">
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-medium font-mono text-foreground/80">
                              {param.name}
                            </label>
                            {param.required && (
                              <span className="text-[10px] text-red-400 font-mono">
                                required
                              </span>
                            )}
                          </div>
                          <Input
                            placeholder={
                              param.description || `Value for ${param.name}`
                            }
                            value={params[param.name] || ""}
                            onChange={(e) =>
                              handleParamChange(param.name, e.target.value)
                            }
                            className="bg-background font-mono text-sm h-10"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleExecute}
                  disabled={isLoading}
                  className="w-full gap-2 mt-6 h-11"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Send Request
                </Button>
              </div>

              {/* Right Column: Output & Code */}
              <div className="flex flex-col h-full min-h-[450px] border border-border rounded-lg bg-[#1e1e1e] overflow-hidden shadow-inner">
                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-[#2d2d2d]">
                  <button
                    onClick={() => setActiveTab("response")}
                    className={cn(
                      "px-5 py-3 text-xs font-medium transition-colors border-r border-white/10",
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
                      "px-5 py-3 text-xs font-medium transition-colors border-r border-white/10",
                      activeTab === "code"
                        ? "bg-[#1e1e1e] text-white"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    Code Samples
                  </button>
                </div>

                <div className="flex-1 p-5 lg:p-6 overflow-auto font-mono text-xs">
                  {activeTab === "response" ? (
                    response ? (
                      (() => {
                        const isError = "error" in response;
                        const isSuccess = !isError && "status" in response;

                        return (
                          <div className="space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                              <div className="flex items-center gap-3">
                                {isError ? (
                                  <Badge
                                    variant="default"
                                    className="font-bold text-red-400 border-red-500/50"
                                  >
                                    Error
                                  </Badge>
                                ) : isSuccess ? (
                                  <Badge
                                    variant="default"
                                    className={cn(
                                      "font-bold",
                                      response.status >= 200 &&
                                        response.status < 300
                                        ? "text-green-400 border-green-500/50"
                                        : "text-red-400 border-red-500/50"
                                    )}
                                  >
                                    {response.status} {response.statusText}
                                  </Badge>
                                ) : null}
                                {isSuccess && response.time && (
                                  <span className="text-gray-500">
                                    {response.time}
                                  </span>
                                )}
                              </div>
                              <span className="text-gray-500">
                                {new Date().toLocaleTimeString()}
                              </span>
                            </div>
                            <pre className="text-green-400 whitespace-pre-wrap">
                              {JSON.stringify(
                                isError
                                  ? response.data || { error: response.error }
                                  : isSuccess
                                  ? response.data
                                  : null,
                                null,
                                2
                              )}
                            </pre>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3 opacity-50 py-12">
                        <Terminal className="w-10 h-10" />
                        <p className="text-sm">Execute a request to see the response</p>
                      </div>
                    )
                  ) : (
                    <div className="h-full flex flex-col">
                      <div className="mb-3">
                        <LanguageSelector
                          selected={selectedLang}
                          onSelect={setSelectedLang}
                        />
                      </div>
                      <div className="relative flex-1 group">
                        <pre className="text-blue-300 h-full overflow-auto pt-1 leading-relaxed">
                          {generateCode()}
                        </pre>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(generateCode())
                          }
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
