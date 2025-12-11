import { auth, type Session } from "@/lib/auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface Reminder {
  id: string;
  title: string;
  description?: string;
  banner_image?: string;
  date: string;
  time?: string;
  location?: string;
  tags?: string[];
  recommended_level?: string;
  status: "active" | "finished" | "upcoming";
  category?: "all" | "events" | "content" | "news" | "offers";
  action_buttons?: {
    primary?: { label: string; href?: string };
    secondary?: { label: string; href?: string };
  };
  created_at: string;
  updated_at: string;
  created_by: string; // TEXT reference to auth_users(id)
}

// GET - List all reminders
export async function GET() {
  try {
    // Public endpoint - anyone can view reminders
    // Check if table exists first
    try {
      const { rows } = await db.query<Reminder>(
        `SELECT 
          id, title, description, banner_image, date, time, location, 
          tags, recommended_level, status, category,
          action_buttons, created_at, updated_at, created_by
        FROM reminders 
        WHERE status != 'finished' OR status IS NULL
        ORDER BY 
          CASE status
            WHEN 'upcoming' THEN 1
            WHEN 'active' THEN 2
            WHEN 'finished' THEN 3
          END,
          date DESC, 
          created_at DESC
        LIMIT 50`
      );

      return NextResponse.json({
        success: true,
        data: rows.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description || undefined,
          banner_image: row.banner_image || undefined,
          date: row.date,
          time: row.time || undefined,
          location: row.location || undefined,
          tags: row.tags || [],
          recommendedLevel: row.recommended_level || undefined,
          status: row.status || "active",
          category: row.category || "all",
          actionButtons: row.action_buttons || undefined,
        })),
      });
    } catch (dbError) {
      // If table doesn't exist, return empty array
      const error = dbError as { code?: string; message?: string };
      if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
        console.warn("[Reminders API] Table 'reminders' does not exist yet. Please run the migration.");
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error("[Reminders API] Error fetching reminders:", error);
    
    // Check if it's a database error (table doesn't exist)
    const dbError = error as { code?: string; message?: string };
    if (dbError?.code === "42P01" || dbError?.message?.includes("does not exist")) {
      // Return empty array if table doesn't exist (graceful degradation)
      return NextResponse.json({
        success: true,
        data: [],
      });
    }
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Erro ao buscar lembretes",
          details: process.env.NODE_ENV === "development" ? String(error) : undefined,
        },
      },
      { status: 500 }
    );
  }
}

// POST - Create new reminder (Admin only)
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      title,
      description,
      banner_image,
      date,
      time,
      location,
      tags = [],
      recommendedLevel,
      status = "upcoming",
      category = "all",
      actionButtons,
    } = body;

    // Validation
    if (!title || !date) {
      return NextResponse.json(
        { success: false, error: { message: "Título e data são obrigatórios" } },
        { status: 400 }
      );
    }

    // Check if table exists before trying to insert
    let result;
    try {
      result = await db.query<Reminder>(
        `INSERT INTO reminders (
          id, title, description, banner_image, date, time, location, 
          tags, recommended_level, status, category,
          action_buttons, created_by
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        ) RETURNING *`,
        [
          title,
          description || null,
          banner_image || null,
          date,
          time || null,
          location || null,
          tags.length > 0 ? tags : null,
          recommendedLevel || null,
          status,
          category,
          actionButtons ? JSON.stringify(actionButtons) : null,
          session.user.id,
        ]
      );
    } catch (dbError) {
      const error = dbError as { code?: string; message?: string };
      if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: "Tabela 'reminders' não existe. Execute a migration SQL primeiro.",
              details: "Execute: psql $DATABASE_URL -f web/migrations/create_reminders_table.sql",
            },
          },
          { status: 500 }
        );
      }
      throw dbError;
    }

    const row = result.rows[0];
    return NextResponse.json({
      success: true,
      data: {
        id: row.id,
        title: row.title,
        description: row.description || undefined,
        banner_image: row.banner_image || undefined,
        date: row.date,
        time: row.time || undefined,
        location: row.location || undefined,
        tags: row.tags || [],
        recommendedLevel: row.recommended_level || undefined,
        status: row.status,
        category: row.category || "all",
        actionButtons: row.action_buttons || undefined,
      },
    });
  } catch (error) {
    console.error("[Reminders API] Error creating reminder:", error);
    
    // Check if it's a database error (table doesn't exist)
    const dbError = error as { code?: string; message?: string };
    if (dbError?.code === "42P01" || dbError?.message?.includes("does not exist")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Tabela 'reminders' não existe. Execute a migration SQL primeiro.",
            details: "Execute: psql $DATABASE_URL -f web/migrations/create_reminders_table.sql",
          },
        },
        { status: 500 }
      );
    }
    
    // Check if it's a validation error
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
          },
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Erro ao criar lembrete",
          details: process.env.NODE_ENV === "development" ? String(error) : undefined,
        },
      },
      { status: 500 }
    );
  }
}

