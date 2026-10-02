import { NextResponse } from "next/server";
import {
  getSupabaseAuthClient,
  setAdminSessionCookies,
} from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 },
      );
    }

    const authClient = getSupabaseAuthClient();
    const {
      data: { user, session },
      error,
    } = await authClient.auth.signInWithPassword({
      email: String(email).trim(),
      password: String(password),
    });

    if (error || !user || !session) {
      return NextResponse.json(
        { message: "Invalid admin email or password." },
        { status: 401 },
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { message: "Supabase is not configured." },
        { status: 500 },
      );
    }

    const { data: admin } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!admin) {
      return NextResponse.json(
        { message: "This account does not have administrator access." },
        { status: 403 },
      );
    }

    const response = NextResponse.json({ ok: true });
    setAdminSessionCookies(response, session);
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Could not sign in." },
      { status: 500 },
    );
  }
}
