import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

// Get the base handlers from Better Auth
const { GET: baseGET, POST: basePOST } = toNextJsHandler(auth);

// Wrap handlers with error logging for debugging
export async function GET(request: NextRequest) {
  try {
    return await baseGET(request);
  } catch (error) {
    // Log the full error for debugging
    console.error("[Auth API] GET Error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url,
      method: request.method,
    });
    // Re-throw to let Better Auth handle the response
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    return await basePOST(request);
  } catch (error) {
    // Log the full error for debugging
    console.error("[Auth API] POST Error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url,
      method: request.method,
    });
    // Re-throw to let Better Auth handle the response
    throw error;
  }
}

