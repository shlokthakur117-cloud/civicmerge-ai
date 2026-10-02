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
  let updates: any[] = [];

  if (supabase) {
    const [{ data: issueData }, { data: complaintData }, { data: updateData }] =
      await Promise.all([
        supabase.from("issues").select("*").eq("id", id).single(),
        supabase
          .from("complaints")
          .select("*")
          .eq("issue_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("issue_updates")
          .select("*")
          .eq("issue_id", id)
          .order("created_at", { ascending: false }),
      ]);

    issue = issueData;
    complaints = complaintData ?? [];
    updates = updateData ?? [];
  }

  if (!issue) {
    issue = {
      id,
      title: "Issue not found",
      description: "This issue could not be loaded.",
      category: "unknown",
      status: "open",
      report_count: 0,
      priority_score: 0,
    };
  }

  return (
    <main>
      <nav className="nav">
        <Link className="brand" href="/">CivicMerge AI</Link>
        <Link className="button secondary" href="/admin">Back to dashboard</Link>
      </nav>

      <section className="card">
        <div className="sectionHeader">
          <div>
            <div className="eyebrow">Master Issue #{String(issue.id).slice(0, 8)}</div>
            <h2>{issue.title}</h2>
          </div>
          <span className={"statusBadge " + issue.status}>{issue.status}</span>
        </div>

        <p className="lead">{issue.description}</p>

        <div className="dashboardGrid issueStats">
          <div><strong>{issue.report_count}</strong><div className="muted">Supporting reports</div></div>
          <div><strong>{issue.priority_score}</strong><div className="muted">Priority score</div></div>
          <div><strong>{issue.category}</strong><div className="muted">Category</div></div>
          <div><strong>{issue.status}</strong><div className="muted">Status</div></div>
        </div>
      </section>

      <section className="detailGrid">
        <div>
          <h2>Citizen evidence</h2>
          {complaints.length === 0 ? (
            <div className="card muted">No supporting reports loaded yet.</div>
          ) : (
            complaints.map((complaint) => (
              <article className="card evidenceCard" key={complaint.id}>
                {complaint.image_url && (
                  <img
                    src={complaint.image_url}
                    alt="Citizen evidence for this civic issue"
                    className="evidenceImage"
                  />
                )}
                <strong>{complaint.description}</strong>
                <p className="muted evidenceMeta">
                  {complaint.similarity_score
                    ? "AI match: " + Math.round(complaint.similarity_score * 100) + "%"
                    : "Original report"}
                </p>
              </article>
            ))
          )}
        </div>

        <div>
          <h2>Status history</h2>
          <div className="card">
            {updates.length === 0 ? (
              <p className="muted">No status changes yet.</p>
            ) : (
              <div className="timeline">
                {updates.map((update) => (
                  <div key={update.id} className="timelineItem">
                    <strong>{update.status}</strong>
                    <span className="muted">{update.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
