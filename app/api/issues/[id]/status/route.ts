import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const allowedStatuses = new Set(["open", "assigned", "resolved"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!allowedStatuses.has(status)) {
      return NextResponse.json({ message: "Invalid issue status." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        { message: "Supabase environment variables are not configured." },
        { status: 500 },
      );
    }

    const { data, error } = await supabase
      .from("issues")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id,status")
      .single();

    if (error) throw error;

    const { error: historyError } = await supabase.from("issue_updates").insert({
      issue_id: id,
      status,
      message: "Status changed to " + status,
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
