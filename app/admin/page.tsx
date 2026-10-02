import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase";

const demoIssues = [
  { id: "demo-1", title: "Pothole near college gate", category: "pothole", report_count: 9, priority_score: 86, status: "open" },
  { id: "demo-2", title: "Streetlight not working", category: "streetlight", report_count: 5, priority_score: 64, status: "assigned" },
  { id: "demo-3", title: "Overflowing garbage point", category: "garbage", report_count: 12, priority_score: 91, status: "open" },
];

export default async function AdminPage() {
  const supabase = getSupabaseAdmin();
  let issues = demoIssues;

  if (supabase) {
    const { data } = await supabase
      .from("issues")
      .select("id,title,category,report_count,priority_score,status")
      .order("priority_score", { ascending: false })
      .limit(25);

    if (data?.length) issues = data;
  }

  const totalReports = issues.reduce((sum, issue) => sum + (issue.report_count ?? 0), 0);
  const duplicatesAvoided = issues.reduce((sum, issue) => sum + Math.max(0, (issue.report_count ?? 1) - 1), 0);

  return (
    <main>
      <nav className="nav">
        <Link className="brand" href="/">CivicMerge AI</Link>
        <Link className="button" href="/report">Report issue</Link>
      </nav>

      <div className="eyebrow">Municipal command center</div>
      <h2>Master issues</h2>

      <section className="grid">
        <div className="card"><div className="metric">{issues.length}</div><div className="muted">Unique issues</div></div>
        <div className="card"><div className="metric">{totalReports}</div><div className="muted">Citizen reports</div></div>
        <div className="card"><div className="metric">{duplicatesAvoided}</div><div className="muted">Duplicate tickets avoided</div></div>
      </section>

      <div className="tableWrap" style={{ marginTop: 20 }}>
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
                <td><Link href={`/issues/${issue.id}`}><strong>{issue.title}</strong></Link></td>
                <td>{issue.category}</td>
                <td>{issue.report_count}</td>
                <td>{issue.priority_score}</td>
                <td>{issue.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
