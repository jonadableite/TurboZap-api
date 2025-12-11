import { NextRequest, NextResponse } from "next/server";
import { auth, type Session } from "@/lib/auth";
import db from "@/lib/db";

export const runtime = "nodejs";

// PUT - Update reminder (Admin only)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await auth.api.getSession({ headers: request.headers })) as Session | null;
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { message: "Forbidden - Admin only" } },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const {
      title,
      description,
      banner_image,
      date,
      time,
      location,
      tags,
      recommendedLevel,
      status,
      category,
      actionButtons,
    } = body;

    const { rows } = await db.query(
      `UPDATE reminders SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        date = COALESCE($3, date),
        time = COALESCE($4, time),
        location = COALESCE($5, location),
        tags = COALESCE($6, tags),
        recommended_level = COALESCE($7, recommended_level),
        status = COALESCE($8, status),
        category = COALESCE($9, category),
        action_buttons = COALESCE($10, action_buttons),
        banner_image = COALESCE($11, banner_image),
        updated_at = NOW()
      WHERE id = $12
      RETURNING *`,
      [
        title,
        description,
        date,
        time,
        location,
        tags ? (tags.length > 0 ? tags : null) : null,
        recommendedLevel,
        status,
        category,
        actionButtons ? JSON.stringify(actionButtons) : null,
        banner_image,
        id,
      ]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: "Lembrete não encontrado" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: rows[0].id,
        title: rows[0].title,
        description: rows[0].description || undefined,
        banner_image: rows[0].banner_image || undefined,
        date: rows[0].date,
        time: rows[0].time || undefined,
        location: rows[0].location || undefined,
        tags: rows[0].tags || [],
        recommendedLevel: rows[0].recommended_level || undefined,
        status: rows[0].status,
        category: rows[0].category || "all",
        actionButtons: rows[0].action_buttons || undefined,
      },
    });
  } catch (error) {
    console.error("[Reminders API] Error updating reminder:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Erro ao atualizar lembrete",
        },
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete reminder (Admin only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await auth.api.getSession({ headers: request.headers })) as Session | null;
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { message: "Forbidden - Admin only" } },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const { rows } = await db.query(
      `DELETE FROM reminders WHERE id = $1 RETURNING id`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: "Lembrete não encontrado" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error("[Reminders API] Error deleting reminder:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Erro ao deletar lembrete",
        },
      },
      { status: 500 }
    );
  }
}

