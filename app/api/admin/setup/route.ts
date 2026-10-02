import { NextResponse } from "next/server";
import {
  getSupabaseAuthClient,
  hasAnyAdmins,
  setAdminSessionCookies,
} from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    if (await hasAnyAdmins()) {
      return NextResponse.json(
        { message: "Administrator setup has already been completed." },
        { status: 409 },
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

    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: normalizedPassword,
        email_confirm: true,
      });

    if (createError || !created.user) {
      return NextResponse.json(
        { message: createError?.message ?? "Could not create admin user." },
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

    const authClient = getSupabaseAuthClient();
    const {
      data: { session },
      error: signInError,
    } = await authClient.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (signInError || !session) {
      return NextResponse.json(
        {
          message:
            "Administrator created. Open the admin login page and sign in.",
        },
        { status: 201 },
      );
    }

    const response = NextResponse.json({ ok: true }, { status: 201 });
    setAdminSessionCookies(response, session);
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Setup failed." },
      { status: 500 },
    );
  }
}
