import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";

export const runtime = "nodejs";

async function getKey(id: string) {
  const { rows } = await db.query(
    `SELECT id, name, key, permissions, last_used_at, expires_at, created_at, revoked_at, user_id
     FROM api_keys WHERE id = $1`,
    [id]
  );
  return rows[0];
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const current = await getKey(params.id);
  if (!current) {
    return NextResponse.json(
      { success: false, error: { message: "API key not found" } },
      { status: 404 }
    );
  }

  if (current.user_id && current.user_id !== session.user.id) {
    return NextResponse.json(
      { success: false, error: { message: "Forbidden" } },
      { status: 403 }
    );
  }

  const body = await request.json();
  const name = body?.name ?? current.name;
  const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : current.expires_at;

  await db.query(
    `UPDATE api_keys
     SET name = $1,
         expires_at = $2
     WHERE id = $3`,
    [name, expiresAt, params.id]
  );

  return NextResponse.json({
    success: true,
    data: { ...current, name, expires_at: expiresAt },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const current = await getKey(params.id);
  if (!current) {
    return NextResponse.json(
      { success: false, error: { message: "API key not found" } },
      { status: 404 }
    );
  }

  if (current.user_id && current.user_id !== session.user.id) {
    return NextResponse.json(
      { success: false, error: { message: "Forbidden" } },
      { status: 403 }
    );
  }

  await db.query(`DELETE FROM api_keys WHERE id = $1`, [params.id]);

  return NextResponse.json({
    success: true,
    data: { id: params.id },
  });
}

