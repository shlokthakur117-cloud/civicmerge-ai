import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function IssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  let issue: any = null;
  let complaints: any[] = [];

  if (supabase) {
    const { data: issueData } = await supabase.from("issues").select("*").eq("id", id).single();
    const { data: complaintData } = await supabase
      .from("complaints")
      .select("*")
      .eq("issue_id", id)
      .order("created_at", { ascending: false });

    issue = issueData;
    complaints = complaintData ?? [];
  }

  if (!issue) {
    issue = {
      id,
      title: "Demo master issue",
      description: "Connect Supabase and run schema.sql to see live issue data.",
      category: "pothole",
      status: "open",
      report_count: 3,
      priority_score: 78,
    };
  }

  return (
    <main>
      <nav className="nav">
        <Link className="brand" href="/">CivicMerge AI</Link>
        <Link className="button secondary" href="/admin">Back to dashboard</Link>
      </nav>

      <section className="card">
        <div className="eyebrow">Master Issue #{String(issue.id).slice(0, 8)}</div>
        <h2>{issue.title}</h2>
        <p className="lead">{issue.description}</p>
        <div className="grid">
          <div><strong>{issue.report_count}</strong><div className="muted">Supporting reports</div></div>
          <div><strong>{issue.priority_score}</strong><div className="muted">Priority score</div></div>
          <div><strong>{issue.status}</strong><div className="muted">Status</div></div>
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Citizen evidence</h2>
        {complaints.length === 0 ? (
          <div className="card muted">No live complaints loaded yet.</div>
        ) : (
          complaints.map((complaint) => (
            <div className="card" key={complaint.id} style={{ marginBottom: 12 }}>
              <strong>{complaint.description}</strong>
              <p className="muted">Similarity score: {complaint.similarity_score ?? "Original report"}</p>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
