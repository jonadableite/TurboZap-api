"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

interface CodeExample {
  title: string;
  code: string;
  response?: string;
}

const codeExamples: CodeExample[] = [
  {
    title: "Send Text Message",
    code: `curl -X POST "https://api.turbozap.dev/message/text" \\
  -H "X-Api-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "instance": "main",
    "phone": "5511999999999",
    "text": "Olá! Esta é uma mensagem via TurboZap API 🚀"
  }'`,
    response: `{
  "success": true,
  "data": {
    "messageId": "3EB0B430A8B...",
    "status": "sent"
  }
}`,
  },
  {
    title: "Send Button Message",
    code: `curl -X POST "https://api.turbozap.dev/message/buttons" \\
  -H "X-Api-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "instance": "main",
    "phone": "5511999999999",
    "title": "Escolha uma opção",
    "buttons": [
      { "id": "1", "text": "Suporte" },
      { "id": "2", "text": "Vendas" }
    ]
  }'`,
    response: `{
  "success": true,
  "data": {
    "messageId": "3EB0C540B9C...",
    "status": "sent"
  }
}`,
  },
  {
    title: "Webhook Event",
    code: `// Incoming webhook payload
{
  "event": "message.received",
  "instance": "main",
  "data": {
    "from": "5511999999999",
    "pushName": "João",
    "message": {
      "type": "text",
      "content": "Quero saber mais sobre o produto!"
    },
    "timestamp": 1702389600
  }
}`,
    response: `// Your webhook response
{
  "status": "received",
  "processed": true
}`,
  },
];

export function Terminal() {
  const [currentExample, setCurrentExample] = useState(0);
  const [displayedCode, setDisplayedCode] = useState("");
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [showResponse, setShowResponse] = useState(false);

  const typeCode = useCallback(async () => {
    const example = codeExamples[currentExample];
    setDisplayedCode("");
    setDisplayedResponse("");
    setShowResponse(false);
    setIsTyping(true);

    // Type the code
    for (let i = 0; i <= example.code.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 8));
      setDisplayedCode(example.code.slice(0, i));
    }

    // Small pause before showing response
    await new Promise((resolve) => setTimeout(resolve, 500));

    setShowResponse(true);
    setIsTyping(false);

    // Type the response if exists
    if (example.response) {
      for (let i = 0; i <= example.response.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 5));
        setDisplayedResponse(example.response.slice(0, i));
      }
    }

    // Wait before switching to next example
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Move to next example
    setCurrentExample((prev) => (prev + 1) % codeExamples.length);
  }, [currentExample]);

  useEffect(() => {
    typeCode();
  }, [typeCode]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative w-full max-w-2xl"
      style={{ perspective: "1000px" }}
    >
      {/* Terminal Window */}
      <div className="rounded-xl border border-[#29292e] bg-[#0f0f14] shadow-2xl shadow-[var(--rocket-purple)]/20 overflow-hidden">
        {/* Title Bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a24] border-b border-[#29292e]">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-[var(--rocket-gray-400)] font-mono">
              {codeExamples[currentExample].title}
            </span>
          </div>
          <div className="w-12" />
        </div>

        {/* Terminal Content */}
        <div className="p-4 font-mono text-sm min-h-[320px] max-h-[400px] overflow-auto">
          {/* Code */}
          <pre className="text-[var(--rocket-gray-200)] whitespace-pre-wrap break-all">
            <code>
              <span className="text-[var(--rocket-green)]">$ </span>
              {displayedCode}
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-2 h-4 bg-[var(--rocket-purple)] ml-0.5"
                />
              )}
            </code>
          </pre>

          {/* Response */}
          <AnimatePresence>
            {showResponse && displayedResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 pt-4 border-t border-[#29292e]"
              >
                <span className="text-[var(--rocket-gray-400)] text-xs mb-2 block">
                  Response:
                </span>
                <pre className="text-[var(--rocket-purple-light)] whitespace-pre-wrap">
                  <code>{displayedResponse}</code>
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Example Tabs */}
      <div className="flex justify-center gap-2 mt-4">
        {codeExamples.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentExample(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              currentExample === index
                ? "bg-[var(--rocket-purple)] w-6"
                : "bg-[var(--rocket-gray-600)] hover:bg-[var(--rocket-gray-500)]"
            )}
          />
        ))}
      </div>
    </motion.div>
  );
}

