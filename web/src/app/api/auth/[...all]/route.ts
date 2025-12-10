import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Export handlers directly as per Better Auth documentation
// The toNextJsHandler already handles errors internally
export const { GET, POST } = toNextJsHandler(auth);

