import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import db from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const { rows } = await db.query(
    `SELECT id, name, key, permissions, last_used_at, expires_at, created_at, revoked_at
     FROM api_keys
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [session.user.id]
  );

  return NextResponse.json({ success: true, data: rows });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const body = await request.json();
  const name = (body?.name as string) || "API Key";
  const permissions = Array.isArray(body?.permissions) ? body.permissions : [];
  const expiresAt = body?.expiresAt
    ? new Date(body.expiresAt as string)
    : null;

  const id = randomUUID();
  const key = randomUUID();
  const now = new Date();

  await db.query(
    `INSERT INTO api_keys (id, name, key, user_id, permissions, last_used_at, expires_at, created_at, revoked_at)
     VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, NULL)`,
    [id, name, key, session.user.id, permissions, expiresAt, now]
  );

  return NextResponse.json({
    success: true,
    data: {
      id,
      name,
      key,
      permissions,
      expires_at: expiresAt,
      created_at: now,
      revoked: false,
    },
  });
}

