import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: { message: "Forbidden" } },
      { status: 403 }
    );
  }

  const key = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY;
  if (!key) {
    return NextResponse.json(
      { success: false, error: { message: "Global API key not configured" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: { key } });
}

