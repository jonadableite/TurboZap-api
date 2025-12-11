import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Simple handler as per Better Auth documentation
export const { POST, GET } = toNextJsHandler(auth);