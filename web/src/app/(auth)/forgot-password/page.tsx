"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShineBorder } from "@/components/ui/ShineBorder";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>(undefined);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("E-mail é obrigatório");
      return;
    }

    if (!validateEmail(email)) {
      setError("E-mail inválido");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Better-Auth: Request password reset via API endpoint
      const baseURL =
        process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";
      const response = await fetch(
        `${baseURL}/api/auth/request-password-reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            redirectTo: `${window.location.origin}/reset-password`,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(
          result.error?.message ||
            result.message ||
            "Erro ao enviar e-mail de recuperação"
        );
        return;
      }

      setIsSuccess(true);
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="relative">
        <div className="relative rounded-2xl bg-[#121214] border border-[#29292e] p-8 overflow-hidden">
          <ShineBorder
            shineColor={["#04d361", "#8257e5", "#04d361"]}
            borderWidth={1}
            duration={10}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="mx-auto w-16 h-16 bg-[#04d361]/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-[#04d361]" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              E-mail enviado!
            </h1>
            <p className="text-[#a9a9b2] mb-6">
              Se existe uma conta com o e-mail{" "}
              <span className="text-white font-medium">{email}</span>, você
              receberá um link para redefinir sua senha.
            </p>

            <div className="space-y-3">
              <p className="text-sm text-[#7c7c8a]">
                Não recebeu o e-mail? Verifique sua pasta de spam ou
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full border-[#29292e]"
                onClick={() => {
                  setIsSuccess(false);
                  setEmail("");
                }}
              >
                Tentar novamente
              </Button>
            </div>

            <Link
              href="/sign-in"
              className="mt-6 inline-flex items-center gap-2 text-[#8257e5] hover:text-[#996dff] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative rounded-2xl bg-[#121214] border border-[#29292e] p-8 overflow-hidden">
        <ShineBorder
          shineColor={["#8257e5", "#04d361", "#8257e5"]}
          borderWidth={1}
          duration={10}
        />

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 text-[#a9a9b2] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o login
          </Link>
        </motion.div>

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto w-14 h-14 bg-[#8257e5]/20 rounded-full flex items-center justify-center mb-4"
          >
            <Mail className="w-7 h-7 text-[#8257e5]" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Esqueceu sua senha?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[#a9a9b2]"
          >
            Digite seu e-mail e enviaremos um link para redefinir sua senha
          </motion.p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-[#f75a68]/10 border border-[#f75a68]/20"
          >
            <p className="text-sm text-[#f75a68]">{error}</p>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Input
              name="email"
              type="email"
              label="E-mail"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              leftIcon={<Mail className="w-5 h-5" />}
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              isLoading={isLoading}
            >
              {isLoading ? "Enviando..." : "Enviar link de recuperação"}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
