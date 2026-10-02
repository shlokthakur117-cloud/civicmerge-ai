import { NextResponse } from "next/server";
import { createEmbedding } from "@/lib/embeddings";
import { calculateDuplicateScore } from "@/lib/duplicate-score";
import { getSupabaseAdmin } from "@/lib/supabase";

type ComplaintInput = {
  category: string;
  description: string;
  latitude: number;
  longitude: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ComplaintInput;

    if (
      !body.category ||
      !body.description ||
      !Number.isFinite(body.latitude) ||
      !Number.isFinite(body.longitude)
    ) {
      return NextResponse.json({ message: "Invalid complaint data." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        { message: "Supabase environment variables are not configured." },
        { status: 500 },
      );
    }

    const embedding = await createEmbedding(body.description);

    const { data: candidates, error: matchError } = await supabase.rpc("match_issues", {
      query_embedding: embedding,
      query_latitude: body.latitude,
      query_longitude: body.longitude,
      match_count: 10,
      max_distance_m: 300,
    });

    if (matchError) throw matchError;

    const scored = (candidates ?? [])
      .map((candidate: any) => {
        const hybrid = calculateDuplicateScore(
          {
            similarity: Number(candidate.similarity),
            categoryMatch: candidate.category === body.category,
            latitude: Number(candidate.latitude),
            longitude: Number(candidate.longitude),
            createdAt: candidate.created_at,
          },
          body.latitude,
          body.longitude,
        );

        return {
          ...candidate,
          ...hybrid,
          distanceMeters: Math.round(Number(candidate.distance_m)),
        };
      })
      .sort((a: any, b: any) => b.score - a.score);

    const best = scored[0];

    if (best && best.score >= 0.85) {
      const { error: complaintError } = await supabase.from("complaints").insert({
        issue_id: best.id,
        description: body.description,
        latitude: body.latitude,
        longitude: body.longitude,
        similarity_score: best.score,
      });

      if (complaintError) throw complaintError;

      const { error: updateError } = await supabase
        .from("issues")
        .update({
          report_count: (best.report_count ?? 1) + 1,
          priority_score: Math.min(100, (best.priority_score ?? 40) + 5),
          updated_at: new Date().toISOString(),
        })
        .eq("id", best.id);

      if (updateError) throw updateError;

      return NextResponse.json({
        action: "merged",
        message: "Existing issue detected. Your report was added as supporting evidence.",
        score: best.score,
        distanceMeters: best.distanceMeters,
        issueId: best.id,
      });
    }

    if (best && best.score >= 0.7) {
      return NextResponse.json({
        action: "possible_duplicate",
        message: "A nearby possible duplicate was found. Review before creating a separate issue.",
        score: best.score,
        distanceMeters: best.distanceMeters,
        issueId: best.id,
      });
    }

    const { data: newIssue, error: issueError } = await supabase
      .from("issues")
      .insert({
        title: body.description.slice(0, 80),
        description: body.description,
        category: body.category,
        latitude: body.latitude,
        longitude: body.longitude,
        embedding,
        status: "open",
        priority_score: 40,
        report_count: 1,
      })
      .select("id")
      .single();

    if (issueError) throw issueError;

    const { error: complaintError } = await supabase.from("complaints").insert({
      issue_id: newIssue.id,
      description: body.description,
      latitude: body.latitude,
      longitude: body.longitude,
      similarity_score: null,
    });

    if (complaintError) throw complaintError;

    return NextResponse.json({
      action: "created",
      message: "No nearby strong duplicate found. A new master issue was created.",
      issueId: newIssue.id,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unexpected server error." },
      { status: 500 },
    );
  }
}
