"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShineBorder } from "@/components/ui/ShineBorder";
import { signIn } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const { data, error } = await signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
        callbackURL: "/", // garante redirecionamento no backend
      });

      if (error) {
        if (error.message?.toLowerCase().includes("too many")) {
          setErrors({
            general: "Muitas tentativas. Aguarde um minuto e tente novamente.",
          });
          return;
        }
        // Handle specific error messages
        if (
          error.message?.includes("Invalid") ||
          error.message?.includes("credentials")
        ) {
          setErrors({ general: "E-mail ou senha incorretos" });
        } else if (error.message?.includes("banned")) {
          setErrors({
            general: "Sua conta foi suspensa. Entre em contato com o suporte.",
          });
        } else {
          setErrors({ general: error.message || "Erro ao fazer login" });
        }
        return;
      }

      if (data) {
        // Redirect to dashboard on success
        router.push("/");
        router.refresh();
        return;
      }

      // Se chegar aqui, nem data nem error foram retornados — trate como falha genérica
      setErrors({
        general:
          "Não foi possível efetuar login agora. Tente novamente em instantes.",
      });
    } catch (err) {
      setErrors({ general: "Erro inesperado. Tente novamente." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="relative">
      {/* Card with Shine Border */}
      <div className="relative rounded-2xl bg-[#121214] border border-[#29292e] p-8 overflow-hidden">
        <ShineBorder
          shineColor={["#8257e5", "#04d361", "#8257e5"]}
          borderWidth={1}
          duration={10}
        />

        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Bem-vindo de volta
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[#a9a9b2]"
          >
            Entre na sua conta para continuar
          </motion.p>
        </div>

        {/* Error Alert */}
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-[#f75a68]/10 border border-[#f75a68]/20"
          >
            <p className="text-sm text-[#f75a68]">{errors.general}</p>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
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
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              leftIcon={<Mail className="w-5 h-5" />}
              disabled={isLoading}
              autoComplete="email"
            />
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              label="Senha"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-[#8257e5] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              }
              disabled={isLoading}
              autoComplete="current-password"
            />
          </motion.div>

          {/* Remember Me & Forgot Password */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between"
          >
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="sr-only peer"
                  disabled={isLoading}
                />
                <div className="w-5 h-5 border-2 border-[#29292e] rounded bg-[#121214] peer-checked:bg-[#8257e5] peer-checked:border-[#8257e5] transition-all group-hover:border-[#8257e5]/50">
                  <svg
                    className="w-full h-full text-white opacity-0 peer-checked:opacity-100 transition-opacity p-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <svg
                  className={`absolute inset-0 w-full h-full text-white p-0.5 transition-opacity ${
                    formData.rememberMe ? "opacity-100" : "opacity-0"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-sm text-[#a9a9b2] group-hover:text-[#c4c4cc] transition-colors">
                Lembrar de mim
              </span>
            </label>

            <Link
              href="/forgot-password"
              className="text-sm text-[#8257e5] hover:text-[#996dff] transition-colors"
            >
              Esqueceu a senha?
            </Link>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              isLoading={isLoading}
              rightIcon={!isLoading && <ArrowRight className="w-5 h-5" />}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </motion.div>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#29292e]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-[#121214] px-4 text-[#7c7c8a]">
              ou continue com
            </span>
          </div>
        </div>

        {/* Social Login */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3"
        >
          <Button
            type="button"
            variant="outline"
            className="h-11 border-[#29292e] hover:border-[#8257e5]/50 hover:bg-[#8257e5]/5"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-11 border-[#29292e] hover:border-[#8257e5]/50 hover:bg-[#8257e5]/5"
            disabled={isLoading}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </Button>
        </motion.div>

        {/* Sign Up Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-8 text-center text-[#a9a9b2]"
        >
          Não tem uma conta?{" "}
          <Link
            href="/sign-up"
            className="text-[#8257e5] hover:text-[#996dff] font-medium transition-colors"
          >
            Criar conta gratuita
          </Link>
        </motion.p>
      </div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 flex items-center justify-center gap-2 text-xs text-[#7c7c8a]"
      >
        <svg
          className="w-4 h-4 text-[#04d361]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>Conexão segura e criptografada</span>
      </motion.div>
    </div>
  );
}
