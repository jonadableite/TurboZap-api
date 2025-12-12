"use client";

import FancyButton from "@/components/ui/FancyButton";
import { motion } from "framer-motion";
import { ArrowRight, Github, Linkedin, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const footerLinks = {
    Produto: [
      { label: "Features", href: "#features" },
      { label: "Documentação", href: "/docs" },
      { label: "Preços", href: "#pricing" },
      { label: "Changelog", href: "#changelog" },
    ],
    Recursos: [
      { label: "API Reference", href: "/docs/api" },
      { label: "Tutoriais", href: "/docs" },
      { label: "Exemplos", href: "/docs" },
      { label: "Status", href: "#status" },
    ],
    Empresa: [
      { label: "Sobre", href: "#about" },
      { label: "Blog", href: "#blog" },
      { label: "Contato", href: "#contact" },
      { label: "Segurança", href: "/SECURITY.md" },
    ],
    Legal: [
      { label: "Privacidade", href: "#privacy" },
      { label: "Termos", href: "#terms" },
      { label: "Cookies", href: "#cookies" },
    ],
  };

  return (
    <footer className="relative bg-[#0a0a0f] border-t border-[#29292e]">
      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-[var(--rocket-gray-50)] mb-6">
              Pronto para{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--rocket-purple)] to-[var(--rocket-green)]">
                turbinar
              </span>{" "}
              seu WhatsApp?
            </h2>
            <p className="text-lg text-[var(--rocket-gray-400)] mb-8 max-w-2xl mx-auto">
              Comece a usar a TurboZap API agora mesmo. Setup em minutos, escala
              ilimitada.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up" className="group">
                <FancyButton>
                  <span className="flex items-center gap-2 text-sm sm:text-base">
                    Criar conta grátis
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </FancyButton>
              </Link>
              <Link href="/docs">
                <button className="px-4 py-2 rounded-xl font-semibold text-[var(--rocket-gray-200)] border border-[var(--rocket-gray-600)] hover:border-[var(--rocket-purple)] hover:text-[var(--rocket-purple-light)] transition-all duration-300">
                  Explorar documentação
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Links Section */}
      <div className="border-t border-[#29292e] py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Image
                  src="/whatsapp.svg"
                  alt="TurboZap"
                  width={32}
                  height={32}
                />
                <span className="font-bold text-lg text-[var(--rocket-gray-50)]">
                  TurboZap
                </span>
              </Link>
              <p className="text-sm text-[var(--rocket-gray-400)] mb-4">
                API WhatsApp de alta performance para empresas modernas.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-[#1a1a24] border border-[#29292e] flex items-center justify-center text-[var(--rocket-gray-400)] hover:text-[var(--rocket-purple)] hover:border-[var(--rocket-purple)]/50 transition-colors"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-[#1a1a24] border border-[#29292e] flex items-center justify-center text-[var(--rocket-gray-400)] hover:text-[var(--rocket-purple)] hover:border-[var(--rocket-purple)]/50 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-[#1a1a24] border border-[#29292e] flex items-center justify-center text-[var(--rocket-gray-400)] hover:text-[var(--rocket-purple)] hover:border-[var(--rocket-purple)]/50 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Links */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-semibold text-[var(--rocket-gray-100)] mb-4">
                  {category}
                </h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--rocket-gray-400)] hover:text-[var(--rocket-purple-light)] transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#29292e] py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--rocket-gray-500)]">
            © {new Date().getFullYear()} TurboZap. Todos os direitos reservados.
          </p>
          <p className="text-sm text-[var(--rocket-gray-500)]">
            Feito com <span className="text-[var(--rocket-purple)]">♥</span> em
            Go + Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}
