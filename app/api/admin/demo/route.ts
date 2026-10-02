import { NextResponse } from "next/server";
import { calculatePriority } from "@/lib/priority";
import { getSupabaseAdmin } from "@/lib/supabase";

const demoIssues = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    title: "Large pothole near NMIET main gate",
    description: "Deep pothole slowing traffic near the college main gate.",
    category: "pothole",
    latitude: 18.7441,
    longitude: 73.6818,
    reports: 8,
    status: "in_progress",
    department: "roads",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    title: "Streetlights not working on Station Road",
    description: "Multiple streetlights remain off after sunset.",
    category: "streetlight",
    latitude: 18.7429,
    longitude: 73.6831,
    reports: 5,
    status: "assigned",
    department: "electrical",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    title: "Garbage overflow near local market",
    description: "Garbage collection point is overflowing onto the roadside.",
    category: "garbage",
    latitude: 18.7452,
    longitude: 73.6799,
    reports: 11,
    status: "open",
    department: "waste",
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    title: "Water pipeline leakage near bus stop",
    description: "Continuous water leakage is flooding the edge of the road.",
    category: "water_leak",
    latitude: 18.7418,
    longitude: 73.6805,
    reports: 4,
    status: "assigned",
    department: "water",
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    title: "Blocked drainage near hostel road",
    description: "Drainage line is blocked and water is collecting after rain.",
    category: "drainage",
    latitude: 18.7436,
    longitude: 73.684,
    reports: 7,
    status: "in_progress",
    department: "drainage",
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    title: "Damaged footpath near college junction",
    description: "Broken footpath tiles are creating a pedestrian hazard.",
    category: "other",
    latitude: 18.746,
    longitude: 73.6824,
    reports: 3,
    status: "open",
    department: "roads",
  },
  {
    id: "10000000-0000-4000-8000-000000000007",
    title: "Open manhole near residential lane",
    description: "An uncovered manhole is creating a serious safety risk.",
    category: "other",
    latitude: 18.7424,
    longitude: 73.6789,
    reports: 6,
    status: "assigned",
    department: "general",
  },
  {
    id: "10000000-0000-4000-8000-000000000008",
    title: "Repeated signal congestion at main junction",
    description: "Signal timing is causing long vehicle queues during peak hours.",
    category: "other",
    latitude: 18.7448,
    longitude: 73.685,
    reports: 9,
    status: "resolved",
    department: "general",
  },
];

export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        { message: "Supabase environment variables are not configured." },
        { status: 500 },
      );
    }

    if (action === "reset") {
      const { error } = await supabase.from("issues").delete().eq("source", "demo");
      if (error) throw error;

      return NextResponse.json({
        message: "Demo records were reset. Live issues were preserved.",
      });
    }

    if (action !== "seed") {
      return NextResponse.json({ message: "Invalid demo action." }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from("issues")
      .delete()
      .eq("source", "demo");

    if (deleteError) throw deleteError;

    const issuesToInsert = demoIssues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      category: issue.category,
      latitude: issue.latitude,
      longitude: issue.longitude,
      status: issue.status,
      department: issue.department,
      source: "demo",
      report_count: issue.reports,
      priority_score: calculatePriority({
        reportCount: issue.reports,
        category: issue.category,
        recentReports: Math.min(issue.reports, 6),
      }),
    }));

    const { error: issueError } = await supabase.from("issues").insert(issuesToInsert);
    if (issueError) throw issueError;

    const complaints = demoIssues.flatMap((issue) =>
      Array.from({ length: issue.reports }, (_, index) => ({
        issue_id: issue.id,
        description:
          index === 0
            ? issue.description
            : "Supporting citizen report #" + (index + 1) + " for " + issue.title,
        latitude: issue.latitude + index * 0.000005,
        longitude: issue.longitude + index * 0.000005,
        similarity_score: index === 0 ? null : Math.max(0.72, 0.98 - index * 0.02),
        created_at: new Date(Date.now() - index * 35 * 60 * 1000).toISOString(),
      })),
    );

    const { error: complaintError } = await supabase.from("complaints").insert(complaints);
    if (complaintError) throw complaintError;

    return NextResponse.json({
      message: "Hackathon demo data loaded.",
      issues: demoIssues.length,
      reports: complaints.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Demo operation failed." },
      { status: 500 },
    );
  }
}
