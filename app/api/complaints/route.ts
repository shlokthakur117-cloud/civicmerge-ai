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

async function uploadComplaintImage(file: File | null, supabase: any) {
  if (!file || file.size === 0) return null;

  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

  if (!allowedTypes.has(file.type)) {
    throw new Error("Photo must be JPG, PNG, or WebP.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Photo must be 5 MB or smaller.");
  }

  const extension =
    file.type === "image/png" ? "png" :
    file.type === "image/webp" ? "webp" : "jpg";

  const path =
    new Date().toISOString().slice(0, 10) +
    "/" +
    crypto.randomUUID() +
    "." +
    extension;

  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("complaint-images")
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from("complaint-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();

    const body: ComplaintInput = {
      category: String(form.get("category") ?? ""),
      description: String(form.get("description") ?? "").trim(),
      latitude: Number(form.get("latitude")),
      longitude: Number(form.get("longitude")),
    };

    const imageValue = form.get("image");
    const image = imageValue instanceof File ? imageValue : null;

    if (
      !body.category ||
      !body.description ||
      !Number.isFinite(body.latitude) ||
      !Number.isFinite(body.longitude) ||
      body.latitude < -90 ||
      body.latitude > 90 ||
      body.longitude < -180 ||
      body.longitude > 180
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
      const imageUrl = await uploadComplaintImage(image, supabase);

      const { error: complaintError } = await supabase.from("complaints").insert({
        issue_id: best.id,
        description: body.description,
        latitude: body.latitude,
        longitude: body.longitude,
        image_url: imageUrl,
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
        message: "A nearby possible duplicate was found. Review it before creating a separate issue.",
        score: best.score,
        distanceMeters: best.distanceMeters,
        issueId: best.id,
      });
    }

    const imageUrl = await uploadComplaintImage(image, supabase);

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
      image_url: imageUrl,
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
