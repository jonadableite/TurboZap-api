"use client";

import { ApiPlayground } from "./api-playground";
import { CodeBlock } from "./terminal";
import { cn } from "@/lib/utils";

interface Param {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  default?: string;
}

interface ResponseField {
  name: string;
  type: string;
  description: string;
}

interface ApiDocLayoutProps {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  endpoint: string;
  title: string;
  description?: string;
  pathParams?: Param[];
  queryParams?: Param[];
  bodyParams?: Param[];
  responses?: {
    status: number;
    description: string;
    example?: unknown;
    fields?: ResponseField[];
  }[];
  exampleResponse?: unknown;
}

export function ApiDocLayout({
  method,
  endpoint,
  title,
  description,
  pathParams = [],
  queryParams = [],
  bodyParams = [],
  responses = [],
  exampleResponse,
}: ApiDocLayoutProps) {
  const methodColors = {
    GET: "bg-green-500/20 text-green-400 border-green-500/30",
    POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    PUT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
    PATCH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left Column - Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          {description && (
            <p className="text-muted-foreground mb-4">{description}</p>
          )}
        </div>

        {/* Endpoint */}
        <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
          <span
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-bold border",
              methodColors[method]
            )}
          >
            {method}
          </span>
          <code className="text-sm text-foreground font-mono flex-1">
            {endpoint}
          </code>
        </div>

        {/* Parameters */}
        {(pathParams.length > 0 || queryParams.length > 0 || bodyParams.length > 0) && (
          <div className="space-y-6">
            {pathParams.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Path Parameters</h2>
                <div className="space-y-3">
                  {pathParams.map((param) => (
                    <div
                      key={param.name}
                      className="p-4 rounded-lg border border-border bg-card"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-primary">
                            {param.name}
                          </code>
                          <span className="text-xs text-muted-foreground">
                            {param.type}
                          </span>
                          {param.required && (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                              required
                            </span>
                          )}
                        </div>
                      </div>
                      {param.description && (
                        <p className="text-sm text-muted-foreground">
                          {param.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {queryParams.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Query Parameters</h2>
                <div className="space-y-3">
                  {queryParams.map((param) => (
                    <div
                      key={param.name}
                      className="p-4 rounded-lg border border-border bg-card"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-primary">
                            {param.name}
                          </code>
                          <span className="text-xs text-muted-foreground">
                            {param.type}
                          </span>
                          {param.required && (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                              required
                            </span>
                          )}
                        </div>
                      </div>
                      {param.description && (
                        <p className="text-sm text-muted-foreground">
                          {param.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bodyParams.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Body Parameters</h2>
                <div className="space-y-3">
                  {bodyParams.map((param) => (
                    <div
                      key={param.name}
                      className="p-4 rounded-lg border border-border bg-card"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-primary">
                            {param.name}
                          </code>
                          <span className="text-xs text-muted-foreground">
                            {param.type}
                          </span>
                          {param.required && (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                              required
                            </span>
                          )}
                        </div>
                      </div>
                      {param.description && (
                        <p className="text-sm text-muted-foreground">
                          {param.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Responses */}
        {responses.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Response</h2>
            <div className="space-y-4">
              {responses.map((response, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-2 py-1 rounded text-xs font-bold",
                        response.status >= 200 && response.status < 300
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      )}
                    >
                      {response.status}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {response.description}
                    </span>
                  </div>
                  {response.fields && response.fields.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-3 font-semibold">
                              Campo
                            </th>
                            <th className="text-left py-2 px-3 font-semibold">
                              Tipo
                            </th>
                            <th className="text-left py-2 px-3 font-semibold">
                              Descrição
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {response.fields.map((field) => (
                            <tr
                              key={field.name}
                              className="border-b border-border"
                            >
                              <td className="py-2 px-3">
                                <code className="text-primary">{field.name}</code>
                              </td>
                              <td className="py-2 px-3 text-muted-foreground">
                                {field.type}
                              </td>
                              <td className="py-2 px-3 text-muted-foreground">
                                {field.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                 {response.example !== undefined && response.example !== null && (
  <CodeBlock
    title={`${response.status} - application/json`}
    language="json"
    code={JSON.stringify(response.example, null, 2)}
  />
)}

                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Playground */}
        <div className="pt-4">
          <ApiPlayground
            method={method}
            endpoint={endpoint}
            description={description}
            pathParams={pathParams}
            queryParams={queryParams}
            bodyParams={bodyParams}
          />
        </div>
      </div>

      {/* Right Column - Code Examples */}
      <div className="lg:col-span-1 space-y-6">
        <div className="sticky top-20">
         {exampleResponse != null && (
  <div>
    <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">
      Example Response
    </h3>
    <CodeBlock
      title="200"
      language="json"
      code={JSON.stringify(exampleResponse, null, 2)}
    />
  </div>
)}

        </div>
      </div>
    </div>
  );
}

