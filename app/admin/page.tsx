import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase";
import IssueActions from "./IssueActions";
import IssueMap from "./IssueMap";

type Issue = {
  id: string;
  title: string;
  category: string;
  latitude: number;
  longitude: number;
  report_count: number;
  priority_score: number;
  status: string;
  created_at?: string;
};

type Evidence = {
  id: string;
  issue_id: string;
  description: string;
  image_url: string;
  created_at: string;
};

const demoIssues: Issue[] = [
  { id: "demo-1", title: "Pothole near college gate", category: "pothole", latitude: 18.52, longitude: 73.85, report_count: 9, priority_score: 86, status: "open" },
  { id: "demo-2", title: "Streetlight not working", category: "streetlight", latitude: 18.521, longitude: 73.851, report_count: 5, priority_score: 64, status: "assigned" },
  { id: "demo-3", title: "Overflowing garbage point", category: "garbage", latitude: 18.519, longitude: 73.849, report_count: 12, priority_score: 91, status: "open" },
];

export default async function AdminPage() {
  const supabase = getSupabaseAdmin();
  let issues: Issue[] = supabase ? [] : demoIssues;
  let evidence: Evidence[] = [];

  if (supabase) {
    const [{ data: issueData, error: issueError }, { data: evidenceData }] =
      await Promise.all([
        supabase
          .from("issues")
          .select("id,title,category,latitude,longitude,report_count,priority_score,status,created_at")
          .order("priority_score", { ascending: false })
          .limit(100),
        supabase
          .from("complaints")
          .select("id,issue_id,description,image_url,created_at")
          .not("image_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(12),
      ]);

    if (!issueError) issues = (issueData ?? []) as Issue[];
    evidence = ((evidenceData ?? []) as Evidence[]).filter((item) => Boolean(item.image_url));
  }

  const totalReports = issues.reduce((sum, issue) => sum + issue.report_count, 0);
  const duplicatesAvoided = issues.reduce(
    (sum, issue) => sum + Math.max(0, issue.report_count - 1),
    0,
  );
  const highPriority = issues.filter((issue) => issue.priority_score >= 70).length;

  const latestEvidenceByIssue = new Map<string, Evidence>();
  for (const item of evidence) {
    if (!latestEvidenceByIssue.has(item.issue_id)) {
      latestEvidenceByIssue.set(item.issue_id, item);
    }
  }

  return (
    <main>
      <nav className="nav">
        <Link className="brand" href="/">CivicMerge AI</Link>
        <Link className="button" href="/report">Report issue</Link>
      </nav>

      <div className="eyebrow">Municipal command center</div>
      <h2>Live master issues</h2>
      <p className="muted">
        Duplicate reports become evidence instead of separate tickets.
      </p>

      <section className="dashboardGrid">
        <div className="card"><div className="metric">{issues.length}</div><div className="muted">Unique issues</div></div>
        <div className="card"><div className="metric">{totalReports}</div><div className="muted">Citizen reports</div></div>
        <div className="card"><div className="metric">{duplicatesAvoided}</div><div className="muted">Duplicates avoided</div></div>
        <div className="card"><div className="metric">{highPriority}</div><div className="muted">High priority</div></div>
      </section>

      {evidence.length > 0 && (
        <section className="card evidenceGalleryCard">
          <div className="sectionHeader">
            <div>
              <div className="eyebrow">Citizen evidence</div>
              <h2>Recent complaint photos</h2>
            </div>
            <span className="muted">{evidence.length} photo{evidence.length === 1 ? "" : "s"} shown</span>
          </div>

          <div className="evidenceGallery">
            {evidence.map((item) => (
              <article className="evidenceTile" key={item.id}>
                <Link href={"/issues/" + item.issue_id} className="evidenceThumbLink">
                  <img
                    src={item.image_url}
                    alt={item.description}
                    className="evidenceThumb"
                  />
                </Link>
                <div className="evidenceTileBody">
                  <strong>{item.description}</strong>
                  <Link className="button secondary evidenceButton" href={"/issues/" + item.issue_id}>
                    View complaint evidence
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="card mapCard">
        <div className="sectionHeader">
          <div>
            <div className="eyebrow">Geospatial view</div>
            <h2>Issue map</h2>
          </div>
          <div className="mapLegend">
            <span>Open</span>
            <span>Assigned</span>
            <span>Resolved</span>
          </div>
        </div>

        {issues.length > 0 ? (
          <IssueMap issues={issues} />
        ) : (
          <div className="emptyState">No live issues yet.</div>
        )}
      </section>

      <section className="card tableCard">
        <div className="sectionHeader">
          <div>
            <div className="eyebrow">Operations</div>
            <h2>Prioritized queue</h2>
          </div>
        </div>

        {issues.length === 0 ? (
          <div className="emptyState">Submit the first civic complaint to populate the queue.</div>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Photo</th>
                  <th>Category</th>
                  <th>Reports</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => {
                  const photo = latestEvidenceByIssue.get(issue.id);

                  return (
                    <tr key={issue.id}>
                      <td>
                        <Link href={"/issues/" + issue.id}>
                          <strong>{issue.title}</strong>
                        </Link>
                      </td>
                      <td>
                        {photo ? (
                          <Link href={"/issues/" + issue.id} className="tablePhotoLink">
                            <img
                              src={photo.image_url}
                              alt=""
                              className="tablePhoto"
                            />
                            <span>View</span>
                          </Link>
                        ) : (
                          <span className="muted">No photo</span>
                        )}
                      </td>
                      <td>{issue.category}</td>
                      <td>{issue.report_count}</td>
                      <td>{issue.priority_score}</td>
                      <td>
                        {issue.id.startsWith("demo-") ? (
                          <span className={"statusBadge " + issue.status}>{issue.status}</span>
                        ) : (
                          <IssueActions issueId={issue.id} status={issue.status} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
