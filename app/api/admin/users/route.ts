import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const adminSession = await getAdminSession();

    if (!adminSession) {
      return NextResponse.json(
        { message: "Administrator sign-in required." },
        { status: 401 },
      );
    }

    const { email, password } = await request.json();
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    const normalizedPassword = String(password ?? "");

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return NextResponse.json(
        { message: "Enter a valid email address." },
        { status: 400 },
      );
    }

    if (normalizedPassword.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        { message: "Supabase is not configured." },
        { status: 500 },
      );
    }

    const { data: existing } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { message: "An administrator with this email already exists." },
        { status: 409 },
      );
    }

    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: normalizedPassword,
        email_confirm: true,
      });

    if (createError || !created.user) {
      return NextResponse.json(
        {
          message:
            createError?.message ??
            "Could not create the administrator account.",
        },
        { status: 400 },
      );
    }

    const { error: adminError } = await supabase.from("admin_users").insert({
      user_id: created.user.id,
      email: normalizedEmail,
    });

    if (adminError) {
      await supabase.auth.admin.deleteUser(created.user.id);
      throw adminError;
    }

    return NextResponse.json(
      {
        ok: true,
        admin: {
          userId: created.user.id,
          email: normalizedEmail,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Could not create administrator.",
      },
      { status: 500 },
    );
  }
}
