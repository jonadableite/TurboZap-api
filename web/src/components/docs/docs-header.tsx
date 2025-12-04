"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/Input";
import {
  Search,
  ExternalLink,
  Github,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const tabs = [
  { name: "Documentação", href: "/docs" },
  { name: "Referência da API", href: "/docs/api" },
];

export const DocsHeader = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isApiReference = pathname.startsWith("/docs/api");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/whatsapp.svg" 
              alt="TurboZap Logo" 
              width={32} 
              height={32}
              className="h-8 w-8"
            />
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              TurboZap
            </span>
          </Link>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive =
                tab.href === "/docs"
                  ? pathname === "/docs" || (!isApiReference && pathname.startsWith("/docs"))
                  : isApiReference;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.name}
                  {isActive && (
                    <div className="mt-1 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar na documentação..."
              className="pl-9 pr-12 bg-muted/50 border-border"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="https://github.com/jonadableite/turbozap-api"
            target="_blank"
            className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </Link>

          <Link
            href="/instances"
            className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Dashboard
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4">
          <nav className="flex flex-col gap-2">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
              >
                {tab.name}
              </Link>
            ))}
            <hr className="my-2 border-border" />
            <Link
              href="/instances"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

