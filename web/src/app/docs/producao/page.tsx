"use client";

import { OnThisPage } from "@/components/docs/on-this-page";
import { CodeBlock } from "@/components/docs/terminal";
import { Rocket, Shield, Server, Database, AlertTriangle, Check } from "lucide-react";

const tocItems = [
  { id: "checklist", title: "Checklist de produção", level: 2 },
  { id: "infraestrutura", title: "Infraestrutura", level: 2 },
  { id: "seguranca", title: "Segurança", level: 2 },
  { id: "monitoramento", title: "Monitoramento", level: 2 },
  { id: "backup", title: "Backup e recuperação", level: 2 },
];

export default function ProductionPage() {
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 px-8 py-10 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-primary mb-6">
          <span>Introdução</span>
          <span className="text-muted-foreground">/</span>
          <span>Indo para produção</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">Indo para produção</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Guia completo para deploy da TurboZap API em produção
        </p>

        {/* Checklist */}
        <section id="checklist" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Checklist de produção</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/10">
              <Check className="h-5 w-5 text-green-500" />
              <span>HTTPS habilitado (certificado SSL/TLS)</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/10">
              <Check className="h-5 w-5 text-green-500" />
              <span>Variáveis de ambiente configuradas corretamente</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/10">
              <Check className="h-5 w-5 text-green-500" />
              <span>Banco de dados PostgreSQL em servidor dedicado</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/10">
              <Check className="h-5 w-5 text-green-500" />
              <span>Logs estruturados configurados</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/10">
              <Check className="h-5 w-5 text-green-500" />
              <span>Backup automático do banco de dados</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/10">
              <Check className="h-5 w-5 text-green-500" />
              <span>Monitoramento e alertas configurados</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/10">
              <Check className="h-5 w-5 text-green-500" />
              <span>Rate limiting habilitado</span>
            </div>
          </div>
        </section>

        {/* Infraestrutura */}
        <section id="infraestrutura" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Infraestrutura</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Docker Compose (Recomendado)</h3>
              <CodeBlock
                title="docker-compose.yml"
                language="yaml"
                showLineNumbers
                code={`version: '3.8'

services:
  api:
    image: turbozap-api:latest
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/turbozap
      - LOG_LEVEL=info
      - LOG_FORMAT=json
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=turbozap
      - POSTGRES_PASSWORD=secure_password
      - POSTGRES_DB=turbozap
    restart: unless-stopped

volumes:
  postgres_data:`}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Requisitos mínimos</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">Recurso</th>
                      <th className="text-left py-3 px-4 font-semibold">Mínimo</th>
                      <th className="text-left py-3 px-4 font-semibold">Recomendado</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border">
                      <td className="py-3 px-4">CPU</td>
                      <td className="py-3 px-4">1 vCPU</td>
                      <td className="py-3 px-4">2+ vCPUs</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4">RAM</td>
                      <td className="py-3 px-4">512 MB</td>
                      <td className="py-3 px-4">2+ GB</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4">Disco</td>
                      <td className="py-3 px-4">5 GB</td>
                      <td className="py-3 px-4">20+ GB SSD</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Segurança */}
        <section id="seguranca" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Segurança</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <h4 className="font-semibold text-foreground mb-2">Use HTTPS sempre</h4>
              <p className="text-sm text-muted-foreground">
                Configure um reverse proxy (Nginx, Traefik) com certificado 
                Let&apos;s Encrypt para habilitar HTTPS.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <h4 className="font-semibold text-foreground mb-2">Firewall configurado</h4>
              <p className="text-sm text-muted-foreground">
                Permita apenas portas 80, 443 e SSH. Bloqueie acesso direto à 
                porta 8080 da API.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <h4 className="font-semibold text-foreground mb-2">Rotação de API Keys</h4>
              <p className="text-sm text-muted-foreground">
                Implemente rotação periódica de API Keys e revogue chaves 
                comprometidas imediatamente.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-500 mb-1">Aviso importante</h4>
                  <p className="text-sm text-muted-foreground">
                    Nunca exponha variáveis de ambiente ou API Keys em logs ou 
                    mensagens de erro em produção.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Monitoramento */}
        <section id="monitoramento" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Monitoramento</h2>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              A TurboZap API expõe métricas Prometheus no endpoint{" "}
              <code className="px-1 py-0.5 bg-muted rounded text-sm">/metrics</code>.
            </p>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Métricas importantes</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Tempo de resposta das requisições HTTP</li>
                <li>Número de instâncias conectadas</li>
                <li>Mensagens enviadas/recebidas por minuto</li>
                <li>Erros por tipo</li>
                <li>Uso de memória e CPU</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Backup */}
        <section id="backup" className="mb-16 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Backup e recuperação</h2>
          </div>

          <div className="space-y-4">
            <p className="text-muted-foreground">
              Configure backups automáticos do PostgreSQL para garantir recuperação 
              em caso de falhas:
            </p>

            <CodeBlock
              title="Script de backup"
              language="bash"
              code={`#!/bin/bash
# backup.sh - Execute diariamente via cron

BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="turbozap_$TIMESTAMP.sql.gz"

pg_dump -h localhost -U turbozap turbozap | gzip > "$BACKUP_DIR/$FILENAME"

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete`}
            />

            <div className="p-4 rounded-xl border border-primary/30 bg-primary/10">
              <p className="text-sm text-muted-foreground">
                <strong className="text-primary">Importante:</strong> As sessões 
                do WhatsApp são armazenadas no banco. Sem backup, você perderá 
                todas as conexões em caso de falha do servidor.
              </p>
            </div>
          </div>
        </section>
      </div>

      <OnThisPage items={tocItems} />
    </div>
  );
}

