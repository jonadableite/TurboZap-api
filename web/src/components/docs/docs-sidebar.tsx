"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Key,
  MessageSquare,
  Play,
  Rocket,
  Users,
  Webhook,
  Zap,
  Contact,
  Shield,
  Phone,
  Radio,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: "Introdução",
    items: [
      {
        title: "Comece aqui",
        href: "/docs",
        icon: <Play className="h-4 w-4" />,
      },
      {
        title: "Autenticação",
        href: "/docs/autenticacao",
        icon: <Key className="h-4 w-4" />,
      },
      {
        title: "Webhooks",
        href: "/docs/webhooks",
        icon: <Webhook className="h-4 w-4" />,
      },
      {
        title: "Indo para produção",
        href: "/docs/producao",
        icon: <Rocket className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Instâncias",
    items: [
      {
        title: "Referência",
        href: "/docs/api/instances",
        icon: <BookOpen className="h-4 w-4" />,
      },
      {
        title: "Criar instância",
        href: "/docs/api/instances/create",
        badge: "POST",
      },
      {
        title: "Listar instâncias",
        href: "/docs/api/instances/list",
        badge: "GET",
      },
      {
        title: "Conectar (QR Code)",
        href: "/docs/api/instances/connect",
        badge: "POST",
      },
      {
        title: "Status da instância",
        href: "/docs/api/instances/status",
        badge: "GET",
      },
      {
        title: "Desconectar",
        href: "/docs/api/instances/logout",
        badge: "POST",
      },
    ],
  },
  {
    title: "Mensagens",
    items: [
      {
        title: "Referência",
        href: "/docs/api/messages",
        icon: <MessageSquare className="h-4 w-4" />,
      },
      {
        title: "Enviar texto",
        href: "/docs/api/messages/text",
        badge: "POST",
      },
      {
        title: "Enviar imagem",
        href: "/docs/api/messages/image",
        badge: "POST",
      },
      {
        title: "Enviar áudio",
        href: "/docs/api/messages/audio",
        badge: "POST",
      },
      {
        title: "Enviar documento",
        href: "/docs/api/messages/document",
        badge: "POST",
      },
      {
        title: "Enviar localização",
        href: "/docs/api/messages/location",
        badge: "POST",
      },
      {
        title: "Enviar contato",
        href: "/docs/api/messages/contact",
        badge: "POST",
      },
      {
        title: "Enviar reação",
        href: "/docs/api/messages/reaction",
        badge: "POST",
      },
      {
        title: "Enviar botões",
        href: "/docs/api/messages/buttons",
        badge: "POST",
      },
      {
        title: "Enviar lista",
        href: "/docs/api/messages/list",
        badge: "POST",
      },
    ],
  },
  {
    title: "Grupos",
    items: [
      {
        title: "Referência",
        href: "/docs/api/groups",
        icon: <Users className="h-4 w-4" />,
      },
      {
        title: "Criar grupo",
        href: "/docs/api/groups/create",
        badge: "POST",
      },
      {
        title: "Listar grupos",
        href: "/docs/api/groups/list",
        badge: "GET",
      },
      {
        title: "Adicionar participantes",
        href: "/docs/api/groups/add-participants",
        badge: "POST",
      },
    ],
  },
  {
    title: "Contatos",
    items: [
      {
        title: "Referência",
        href: "/docs/api/contacts",
        icon: <Contact className="h-4 w-4" />,
      },
      {
        title: "Verificar número",
        href: "/docs/api/contacts/check",
        badge: "POST",
      },
      {
        title: "Obter foto de perfil",
        href: "/docs/api/contacts/profile-pic",
        badge: "GET",
      },
    ],
  },
  {
    title: "Presença",
    items: [
      {
        title: "Referência",
        href: "/docs/api/presence",
        icon: <Zap className="h-4 w-4" />,
      },
      {
        title: "Definir presença",
        href: "/docs/api/presence/set",
        badge: "POST",
      },
    ],
  },
  {
    title: "Perfil & Privacidade",
    items: [
      {
        title: "Referência",
        href: "/docs/api/profile",
        icon: <Shield className="h-4 w-4" />,
      },
      {
        title: "Obter privacidade",
        href: "/docs/api/profile/privacy",
        badge: "GET",
      },
      {
        title: "Alterar privacidade",
        href: "/docs/api/profile/privacy-set",
        badge: "POST",
      },
      {
        title: "Alterar recado/about",
        href: "/docs/api/profile/status",
        badge: "POST",
      },
    ],
  },
  {
    title: "Chamadas",
    items: [
      {
        title: "Referência",
        href: "/docs/api/calls",
        icon: <Phone className="h-4 w-4" />,
      },
      {
        title: "Rejeitar chamada",
        href: "/docs/api/calls/reject",
        badge: "POST",
      },
    ],
  },
  {
    title: "SSE (Eventos)",
    items: [
      {
        title: "Referência",
        href: "/docs/api/sse",
        icon: <Radio className="h-4 w-4" />,
      },
      {
        title: "Stream de instância",
        href: "/docs/api/sse/stream",
        badge: "GET",
      },
      {
        title: "Stream global",
        href: "/docs/api/sse/global",
        badge: "GET",
      },
    ],
  },
];

const MethodBadge = ({ method }: { method: string }) => {
  const colors: Record<string, string> = {
    GET: "bg-green-500/20 text-green-400",
    POST: "bg-blue-500/20 text-blue-400",
    PUT: "bg-yellow-500/20 text-yellow-400",
    PATCH: "bg-orange-500/20 text-orange-400",
    DELETE: "bg-red-500/20 text-red-400",
    "Em breve": "bg-gray-500/20 text-gray-400",
  };

  return (
    <span
      className={cn(
        "px-1.5 py-0.5 text-[10px] font-bold rounded",
        colors[method] || "bg-gray-500/20 text-gray-400"
      )}
    >
      {method}
    </span>
  );
};

export const DocsSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-background/50 backdrop-blur-sm">
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto py-6 px-4">
        <nav className="space-y-6">
          {navigation.map((section) => (
            <div key={section.title}>
              <h4 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                      >
                        {item.icon && (
                          <span className="shrink-0">{item.icon}</span>
                        )}
                        <span className="flex-1 truncate">{item.title}</span>
                        {item.badge && <MethodBadge method={item.badge} />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

