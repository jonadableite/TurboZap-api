import {
  BentoFeatures,
  CodePlayground,
  Footer,
  Hero,
  TechMarquee,
} from "@/components/landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TurboZap API - WhatsApp API de Alta Performance",
  description:
    "API WhatsApp em escala com performance de Go. Multi-instância, webhooks em tempo real e envio de mídia completo. DX moderna e deploy simples.",
  keywords: [
    "WhatsApp API",
    "WhatsApp Business",
    "API WhatsApp",
    "Envio de mensagens",
    "Multi-instância WhatsApp",
    "Webhooks WhatsApp",
    "Go",
    "TurboZap",
  ],
  openGraph: {
    title: "TurboZap API - WhatsApp API de Alta Performance",
    description:
      "API WhatsApp em escala com performance de Go. Multi-instância, webhooks em tempo real e envio de mídia completo.",
    type: "website",
    locale: "pt_BR",
    siteName: "TurboZap API",
  },
  twitter: {
    card: "summary_large_image",
    title: "TurboZap API - WhatsApp API de Alta Performance",
    description:
      "API WhatsApp em escala com performance de Go. Multi-instância, webhooks em tempo real e envio de mídia completo.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#13131b]">
      {/* Hero Section */}
      <Hero />

      {/* Tech Stack Marquee */}
      <TechMarquee />

      {/* Features Bento Grid */}
      <BentoFeatures />

      {/* Interactive Code Playground */}
      <CodePlayground />

      {/* Footer with CTA */}
      <Footer />
    </main>
  );
}
