"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { MessageSquare, List, Webhook } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  code: string;
  preview: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: "text",
    label: "Send Text",
    icon: <MessageSquare className="w-4 h-4" />,
    code: `const response = await fetch(
  "https://api.turbozap.dev/message/text",
  {
    method: "POST",
    headers: {
      "X-Api-Key": "YOUR_API_KEY",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      instance: "main",
      phone: "5511999999999",
      text: "Olá! 👋 Como posso ajudar?"
    })
  }
);

const data = await response.json();
console.log(data);
// { success: true, messageId: "3EB0B430..." }`,
    preview: (
      <div className="space-y-3">
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-tr-md px-4 py-2 bg-[#005c4b] text-white text-sm">
            Olá! 👋 Como posso ajudar?
            <div className="text-[10px] text-white/60 text-right mt-1">
              12:42 ✓✓
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "buttons",
    label: "Send Buttons",
    icon: <List className="w-4 h-4" />,
    code: `const response = await fetch(
  "https://api.turbozap.dev/message/buttons",
  {
    method: "POST",
    headers: {
      "X-Api-Key": "YOUR_API_KEY",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      instance: "main",
      phone: "5511999999999",
      title: "Central de Atendimento",
      text: "Escolha uma opção:",
      buttons: [
        { id: "1", text: "💬 Suporte" },
        { id: "2", text: "💰 Vendas" },
        { id: "3", text: "📦 Rastreio" }
      ]
    })
  }
);`,
    preview: (
      <div className="space-y-3">
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-tr-md px-4 py-3 bg-[#005c4b] text-white text-sm">
            <div className="font-medium mb-1">Central de Atendimento</div>
            <div className="text-white/80 mb-3">Escolha uma opção:</div>
            <div className="space-y-2">
              {["💬 Suporte", "💰 Vendas", "📦 Rastreio"].map((btn, i) => (
                <button
                  key={i}
                  className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/20"
                >
                  {btn}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-white/60 text-right mt-2">
              12:43 ✓✓
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "webhook",
    label: "Webhook",
    icon: <Webhook className="w-4 h-4" />,
    code: `// Seu endpoint de webhook recebe:
app.post("/webhook", (req, res) => {
  const { event, instance, data } = req.body;

  switch (event) {
    case "message.received":
      console.log(\`Nova mensagem de \${data.from}\`);
      console.log(\`Conteúdo: \${data.message.content}\`);
      
      // Resposta automática
      await sendReply(data.from, "Recebemos sua mensagem!");
      break;

    case "message.status":
      console.log(\`Status: \${data.status}\`);
      // delivered, read, failed
      break;
  }

  res.json({ received: true });
});`,
    preview: (
      <div className="space-y-3">
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-2xl rounded-tl-md px-4 py-2 bg-[#202c33] text-white text-sm">
            Oi, quero fazer um pedido!
            <div className="text-[10px] text-white/60 text-right mt-1">
              12:44
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-xs text-[var(--rocket-gray-400)]">
            <div className="w-2 h-2 rounded-full bg-[var(--rocket-green)] animate-pulse" />
            Webhook recebido
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-tr-md px-4 py-2 bg-[#005c4b] text-white text-sm">
            Recebemos sua mensagem! Em breve entraremos em contato.
            <div className="text-[10px] text-white/60 text-right mt-1">
              12:44 ✓✓
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* Phone frame */}
      <div className="relative w-[280px] h-[560px] rounded-[3rem] bg-gradient-to-b from-[#2a2a35] to-[#1a1a24] p-2 shadow-2xl">
        {/* Inner frame */}
        <div className="relative w-full h-full rounded-[2.5rem] bg-[#0b141a] overflow-hidden">
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-[#0b141a] flex items-center justify-between px-6 z-10">
            <span className="text-white/60 text-xs">12:44</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 rounded-sm border border-white/60 relative">
                <div className="absolute inset-0.5 bg-white/60 rounded-sm" style={{ width: "70%" }} />
              </div>
            </div>
          </div>

          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-20" />

          {/* WhatsApp header */}
          <div className="absolute top-8 left-0 right-0 h-14 bg-[#202c33] flex items-center px-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--rocket-purple)] to-[var(--rocket-green)] flex items-center justify-center text-white font-bold text-sm">
              TZ
            </div>
            <div className="ml-3">
              <div className="text-white font-medium text-sm">TurboZap API</div>
              <div className="text-[var(--rocket-green)] text-xs">online</div>
            </div>
          </div>

          {/* Chat content */}
          <div
            className="absolute top-[88px] bottom-16 left-0 right-0 px-3 py-4 overflow-y-auto"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundColor: "#0b141a",
            }}
          >
            {children}
          </div>

          {/* Input bar */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#202c33] flex items-center px-3 gap-2">
            <div className="flex-1 h-10 rounded-full bg-[#2a3942] flex items-center px-4">
              <span className="text-white/40 text-sm">Mensagem</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[var(--rocket-green)] flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-white"
                fill="currentColor"
              >
                <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Glow effect */}
      <div
        className="absolute -inset-4 rounded-[4rem] opacity-30 blur-2xl -z-10"
        style={{
          background:
            "radial-gradient(circle at center, var(--rocket-purple) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

export function CodePlayground() {
  const [activeTab, setActiveTab] = useState("text");
  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, var(--rocket-purple) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-[var(--rocket-green)]/10 text-[var(--rocket-green)] border border-[var(--rocket-green)]/20 mb-4 inline-block">
            Interactive Demo
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--rocket-gray-50)] mb-4">
            Experimente a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--rocket-green)] to-[var(--rocket-purple)]">
              API
            </span>
          </h2>
          <p className="text-lg text-[var(--rocket-gray-400)] max-w-2xl mx-auto">
            Veja em tempo real como suas mensagens aparecem no WhatsApp.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Code Editor */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 w-full"
          >
            {/* Tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-[var(--rocket-purple)] text-white"
                      : "bg-[#1a1a24] text-[var(--rocket-gray-400)] hover:text-white hover:bg-[#29292e]"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code Block */}
            <div className="rounded-xl border border-[#29292e] bg-[#0f0f14] overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a24] border-b border-[#29292e]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                </div>
                <span className="text-xs text-[var(--rocket-gray-400)] font-mono ml-2">
                  {currentTab.label.toLowerCase().replace(" ", "-")}.ts
                </span>
              </div>

              {/* Code content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 min-h-[350px] max-h-[400px] overflow-auto"
                >
                  <pre className="text-sm font-mono text-[var(--rocket-gray-200)] whitespace-pre-wrap">
                    <code>{currentTab.code}</code>
                  </pre>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Phone Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-shrink-0"
          >
            <PhoneMockup>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentTab.preview}
                </motion.div>
              </AnimatePresence>
            </PhoneMockup>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

