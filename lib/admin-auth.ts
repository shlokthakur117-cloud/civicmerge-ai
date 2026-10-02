import { createClient, type Session } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const ACCESS_COOKIE = "civicmerge_admin_access";
const REFRESH_COOKIE = "civicmerge_admin_refresh";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://ymrnwmymsitidkvyrqsd.supabase.co";

const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_w7k9HILwqdWwydgCvwPOTA_QXIaUBi1";

export function getSupabaseAuthClient() {
  return createClient(supabaseUrl, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function setAdminSessionCookies(
  response: NextResponse,
  session: Session,
) {
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(ACCESS_COOKIE, session.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(60, session.expires_in ?? 3600),
  });

  response.cookies.set(REFRESH_COOKIE, session.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export function clearAdminSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(REFRESH_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}

export async function hasAnyAdmins() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { count, error } = await supabase
    .from("admin_users")
    .select("user_id", { count: "exact", head: true });

  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function getAdminSession() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) return null;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) return null;

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id,email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !admin) return null;

  return {
    userId: user.id,
    email: admin.email,
  };
}
