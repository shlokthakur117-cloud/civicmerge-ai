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

const demoIssues: Issue[] = [
  { id: "demo-1", title: "Pothole near college gate", category: "pothole", latitude: 18.52, longitude: 73.85, report_count: 9, priority_score: 86, status: "open" },
  { id: "demo-2", title: "Streetlight not working", category: "streetlight", latitude: 18.521, longitude: 73.851, report_count: 5, priority_score: 64, status: "assigned" },
  { id: "demo-3", title: "Overflowing garbage point", category: "garbage", latitude: 18.519, longitude: 73.849, report_count: 12, priority_score: 91, status: "open" },
];

export default async function AdminPage() {
  const supabase = getSupabaseAdmin();
  let issues: Issue[] = supabase ? [] : demoIssues;

  if (supabase) {
    const { data, error } = await supabase
      .from("issues")
      .select("id,title,category,latitude,longitude,report_count,priority_score,status,created_at")
      .order("priority_score", { ascending: false })
      .limit(100);

    if (!error) issues = (data ?? []) as Issue[];
  }

  const totalReports = issues.reduce((sum, issue) => sum + issue.report_count, 0);
  const duplicatesAvoided = issues.reduce(
    (sum, issue) => sum + Math.max(0, issue.report_count - 1),
    0,
  );
  const highPriority = issues.filter((issue) => issue.priority_score >= 70).length;

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
                  <th>Category</th>
                  <th>Reports</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue.id}>
                    <td>
                      <Link href={"/issues/" + issue.id}>
                        <strong>{issue.title}</strong>
                      </Link>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
