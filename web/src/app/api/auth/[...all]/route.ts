import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

// Wrap handler with error handling
async function handleAuthRequest(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
) {
  try {
    return await handler(request);
  } catch (error) {
    console.error("[Auth API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}

const { GET: baseGET, POST: basePOST } = toNextJsHandler(auth);

export async function GET(request: NextRequest) {
  return handleAuthRequest(request, baseGET);
}

export async function POST(request: NextRequest) {
  return handleAuthRequest(request, basePOST);
}

