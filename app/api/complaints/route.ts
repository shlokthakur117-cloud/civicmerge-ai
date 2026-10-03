import { NextResponse } from "next/server";
import { createEmbedding } from "@/lib/embeddings";
import { calculateDuplicateScore, distanceMeters } from "@/lib/duplicate-score";
import { calculatePriority } from "@/lib/priority";
import { isCivicCategory } from "@/lib/categories";
import { reverseGeocode } from "@/lib/geocoding";
import { getSupabaseAdmin } from "@/lib/supabase";

type ComplaintInput = {
  category: string;
  description: string;
  latitude: number;
  longitude: number;
};

type IssueForMerge = {
  id: string;
  title: string;
  category: string;
  latitude: number;
  longitude: number;
  location_label?: string | null;
  report_count: number;
  status: string;
  source?: string;
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

async function recentReportCount(supabase: any, issueId: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("complaints")
    .select("id", { count: "exact", head: true })
    .eq("issue_id", issueId)
    .gte("created_at", since);

  return count ?? 1;
}

async function mergeComplaint(
  supabase: any,
  issue: IssueForMerge,
  body: ComplaintInput,
  image: File | null,
  similarityScore: number | null,
  locationLabel: string | null,
) {
  const imageUrl = await uploadComplaintImage(image, supabase);

  const { error: complaintError } = await supabase.from("complaints").insert({
    issue_id: issue.id,
    description: body.description,
    latitude: body.latitude,
    longitude: body.longitude,
    location_label: locationLabel,
    image_url: imageUrl,
    similarity_score: similarityScore,
  });

  if (complaintError) throw complaintError;

  const newReportCount = (issue.report_count ?? 1) + 1;
  const recentReports = await recentReportCount(supabase, issue.id);
  const newPriority = calculatePriority({
    reportCount: newReportCount,
    category: issue.category,
    recentReports,
  });

  const { error: updateError } = await supabase
    .from("issues")
    .update({
      report_count: newReportCount,
      priority_score: newPriority,
      updated_at: new Date().toISOString(),
    })
    .eq("id", issue.id);

  if (updateError) throw updateError;

  return {
    issueId: issue.id,
    priorityScore: newPriority,
  };
}

async function createMasterIssue(
  supabase: any,
  body: ComplaintInput,
  image: File | null,
  locationLabel: string | null,
) {
  const embedding = await createEmbedding(body.description);
  const imageUrl = await uploadComplaintImage(image, supabase);
  const priorityScore = calculatePriority({
    reportCount: 1,
    category: body.category,
    recentReports: 1,
  });

  const { data: newIssue, error: issueError } = await supabase
    .from("issues")
    .insert({
      title: body.description.slice(0, 80),
      description: body.description,
      category: body.category,
      latitude: body.latitude,
      longitude: body.longitude,
      location_label: locationLabel,
      embedding,
      status: "open",
      department: "unassigned",
      source: "live",
      priority_score: priorityScore,
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
    location_label: locationLabel,
    image_url: imageUrl,
    similarity_score: null,
  });

  if (complaintError) throw complaintError;

  return {
    issueId: newIssue.id,
    priorityScore,
  };
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
    const resolutionAction = String(form.get("resolutionAction") ?? "");
    const matchedIssueId = String(form.get("matchedIssueId") ?? "");
    const resolutionScoreValue = Number(form.get("resolutionScore"));
    const resolutionScore =
      Number.isFinite(resolutionScoreValue) &&
      resolutionScoreValue >= 0 &&
      resolutionScoreValue <= 1
        ? resolutionScoreValue
        : null;

    if (
      !isCivicCategory(body.category) ||
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

    const locationLabel = await reverseGeocode(
      body.latitude,
      body.longitude,
    );

    if (resolutionAction === "create_separate") {
      const created = await createMasterIssue(supabase, body, image, locationLabel);

      return NextResponse.json({
        action: "created",
        message: "A separate master issue was created after your review.",
        issueId: created.issueId,
        priorityScore: created.priorityScore,
      });
    }

    if (resolutionAction === "merge") {
      if (!matchedIssueId) {
        return NextResponse.json({ message: "Matched issue is missing." }, { status: 400 });
      }

      const { data: issue, error } = await supabase
        .from("issues")
        .select("id,title,category,latitude,longitude,location_label,report_count,status,source")
        .eq("id", matchedIssueId)
        .single();

      if (error || !issue) {
        return NextResponse.json({ message: "Matched issue could not be found." }, { status: 404 });
      }

      const distance = distanceMeters(
        body.latitude,
        body.longitude,
        Number(issue.latitude),
        Number(issue.longitude),
      );

      if (distance > 300 || issue.status === "resolved" || issue.source !== "live") {
        return NextResponse.json(
          { message: "That master issue is no longer eligible for merging." },
          { status: 409 },
        );
      }

      const merged = await mergeComplaint(
        supabase,
        issue,
        body,
        image,
        resolutionScore,
        locationLabel,
      );

      return NextResponse.json({
        action: "merged",
        message: "Your reviewed report was merged into the selected master issue.",
        score: resolutionScore ?? undefined,
        distanceMeters: Math.round(distance),
        issueId: merged.issueId,
        priorityScore: merged.priorityScore,
      });
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

    if (
      best &&
      best.score >= 0.85 &&
      best.category === body.category
    ) {
      const merged = await mergeComplaint(
        supabase,
        best,
        body,
        image,
        best.score,
        locationLabel,
      );

      return NextResponse.json({
        action: "merged",
        message: "Existing issue detected. Your report was added as supporting evidence.",
        score: best.score,
        distanceMeters: best.distanceMeters,
        issueId: merged.issueId,
        priorityScore: merged.priorityScore,
      });
    }

    if (best && best.score >= 0.7) {
      return NextResponse.json({
        action: "possible_duplicate",
        message: "A nearby possible duplicate was found. Choose whether to merge or create a separate issue.",
        score: best.score,
        distanceMeters: best.distanceMeters,
        issueId: best.id,
        matchedTitle: best.title,
        matchedCategory: best.category,
        matchedStatus: best.status,
        matchedLocation: best.location_label ?? null,
      });
    }

    const created = await createMasterIssue(supabase, body, image, locationLabel);

    return NextResponse.json({
      action: "created",
      message: "No nearby strong duplicate found. A new master issue was created.",
      issueId: created.issueId,
      priorityScore: created.priorityScore,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unexpected server error." },
      { status: 500 },
    );
  }
}
