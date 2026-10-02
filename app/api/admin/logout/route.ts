import { NextResponse } from "next/server";
import { clearAdminSessionCookies } from "@/lib/admin-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAdminSessionCookies(response);
  return response;
}
