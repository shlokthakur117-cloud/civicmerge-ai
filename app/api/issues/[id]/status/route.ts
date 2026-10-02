import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAdminSession } from "@/lib/admin-auth";

const allowedStatuses = new Set(["open", "assigned", "in_progress", "resolved"]);
const allowedDepartments = new Set([
  "unassigned",
  "roads",
  "water",
  "waste",
  "electrical",
  "drainage",
  "general",
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json(
        { message: "Administrator sign-in required." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const status = body.status ? String(body.status) : undefined;
    const department = body.department ? String(body.department) : undefined;

    if (!status && !department) {
      return NextResponse.json({ message: "No update was provided." }, { status: 400 });
    }

    if (status && !allowedStatuses.has(status)) {
      return NextResponse.json({ message: "Invalid issue status." }, { status: 400 });
    }

    if (department && !allowedDepartments.has(department)) {
      return NextResponse.json({ message: "Invalid department." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        { message: "Supabase environment variables are not configured." },
        { status: 500 },
      );
    }

    const patch: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };

    if (status) patch.status = status;
    if (department) patch.department = department;

    const { data, error } = await supabase
      .from("issues")
      .update(patch)
      .eq("id", id)
      .select("id,status,department")
      .single();

    if (error) throw error;

    const messages: string[] = [];
    if (status) messages.push("Status changed to " + status.replaceAll("_", " "));
    if (department) messages.push("Assigned department: " + department);

    const { error: historyError } = await supabase.from("issue_updates").insert({
      issue_id: id,
      status: data.status,
      message: messages.join(" • "),
    });

    if (historyError) throw historyError;

    return NextResponse.json({ issue: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not update issue." },
      { status: 500 },
    );
  }
}
