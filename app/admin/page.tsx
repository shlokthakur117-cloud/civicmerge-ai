import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { priorityBand } from "@/lib/priority";
import { civicCategoryLabel } from "@/lib/categories";
import { getAdminSession, hasAnyAdmins } from "@/lib/admin-auth";
import AdminLogout from "./AdminLogout";
import DemoControls from "./DemoControls";
import IssueActions from "./IssueActions";
import IssueMap from "./IssueMap";

type Issue = {
  id: string;
  title: string;
  category: string;
  latitude: number;
  longitude: number;
  location_label: string | null;
  report_count: number;
  priority_score: number;
  status: string;
  department: string;
  source: string;
  created_at?: string;
};

type Evidence = {
  id: string;
  issue_id: string;
  description: string;
  image_url: string;
  latitude: number;
  longitude: number;
  location_label: string | null;
  created_at: string;
};

function label(value: string) {
  return value.replaceAll("_", " ").replace(/w/g, (letter) => letter.toUpperCase());
}

function barWidth(value: number, max: number) {
  if (max <= 0) return "0%";
  return Math.max(8, Math.round((value / max) * 100)) + "%";
}

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session) {
    const hasAdmins = await hasAnyAdmins();
    redirect(hasAdmins ? "/admin/login" : "/admin/setup");
  }

  const supabase = getSupabaseAdmin();
  let issues: Issue[] = [];
  let evidence: Evidence[] = [];

  if (supabase) {
    const [{ data: issueData, error: issueError }, { data: evidenceData }] =
      await Promise.all([
        supabase
          .from("issues")
          .select("id,title,category,latitude,longitude,location_label,report_count,priority_score,status,department,source,created_at")
          .order("priority_score", { ascending: false })
          .limit(100),
        supabase
          .from("complaints")
          .select("id,issue_id,description,image_url,latitude,longitude,location_label,created_at")
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
  const duplicateReduction =
    totalReports > 0 ? Math.round((duplicatesAvoided / totalReports) * 100) : 0;

  const latestEvidenceByIssue = new Map<string, Evidence>();
  for (const item of evidence) {
    if (!latestEvidenceByIssue.has(item.issue_id)) {
      latestEvidenceByIssue.set(item.issue_id, item);
    }
  }

  const categoryCounts = Array.from(
    issues.reduce((map, issue) => {
      map.set(issue.category, (map.get(issue.category) ?? 0) + issue.report_count);
      return map;
    }, new Map<string, number>()),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const statusCounts = Array.from(
    issues.reduce((map, issue) => {
      map.set(issue.status, (map.get(issue.status) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const hotspots = Array.from(
    issues.reduce((map, issue) => {
      const key =
        issue.location_label ??
        issue.latitude.toFixed(3) + ", " + issue.longitude.toFixed(3);
      const current = map.get(key) ?? { reports: 0, issues: 0 };
      current.reports += issue.report_count;
      current.issues += 1;
      map.set(key, current);
      return map;
    }, new Map<string, { reports: number; issues: number }>()),
  )
    .map(([location, data]) => ({ location, ...data }))
    .sort((a, b) => b.reports - a.reports)
    .slice(0, 4);

  const topIssues = [...issues].sort((a, b) => b.priority_score - a.priority_score).slice(0, 4);
  const maxCategory = Math.max(1, ...categoryCounts.map((item) => item.value));
  const maxStatus = Math.max(1, ...statusCounts.map((item) => item.value));

  return (
    <main>
      <nav className="nav">
        <Link className="brand" href="/">CivicMerge AI</Link>
        <div className="actions">
          <span className="adminIdentity">{session.email}</span>
          <DemoControls />
          <Link className="button" href="/report">Report issue</Link>
          <AdminLogout />
        </div>
      </nav>

      <div className="eyebrow">Municipal command center</div>
      <h2>Live master issues</h2>
      <p className="muted">
        Duplicate reports become evidence instead of separate tickets.
      </p>

      <section className="dashboardGrid">
        <div className="card"><div className="metric">{issues.length}</div><div className="muted">Unique issues</div></div>
        <div className="card"><div className="metric">{totalReports}</div><div className="muted">Citizen reports</div></div>
        <div className="card"><div className="metric">{duplicatesAvoided}</div><div className="muted">Duplicate tickets prevented</div></div>
        <div className="card"><div className="metric">{duplicateReduction}%</div><div className="muted">Ticket reduction</div></div>
      </section>

      {topIssues.length > 0 && (
        <section className="issueCardGrid">
          {topIssues.map((issue) => {
            const photo = latestEvidenceByIssue.get(issue.id);
            const band = priorityBand(issue.priority_score);

            return (
              <article className="issueSummaryCard" key={issue.id}>
                {photo ? (
                  <img className="issueCardImage" src={photo.image_url} alt="" />
                ) : (
                  <div className="issueCardPlaceholder">{civicCategoryLabel(issue.category)}</div>
                )}

                <div className="issueCardBody">
                  <div className="issueCardMeta">
                    <span className={"priorityBadge " + band}>{band}</span>
                    {issue.source === "demo" && <span className="demoBadge">Demo</span>}
                  </div>
                  <strong>{issue.title}</strong>
                  <span className="muted">
                    {issue.report_count} reports • {label(issue.department)}
                  </span>
                  {issue.location_label && (
                    <span className="locationLabel">{issue.location_label}</span>
                  )}
                  <span className="coordinateChip">
                    {issue.latitude.toFixed(5)}, {issue.longitude.toFixed(5)}
                  </span>
                  <Link className="button secondary" href={"/issues/" + issue.id}>
                    View & manage
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <section className="analyticsGrid">
        <div className="card">
          <div className="eyebrow">Analytics</div>
          <h2>Reports by category</h2>
          <div className="barChart">
            {categoryCounts.map((item) => (
              <div className="barRow" key={item.name}>
                <div className="barLabel">
                  <span>{civicCategoryLabel(item.name)}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className="barTrack">
                  <div className="barFill" style={{ width: barWidth(item.value, maxCategory) }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="eyebrow">Operations</div>
          <h2>Issues by status</h2>
          <div className="barChart">
            {statusCounts.map((item) => (
              <div className="barRow" key={item.name}>
                <div className="barLabel">
                  <span>{label(item.name)}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className="barTrack">
                  <div className="barFill" style={{ width: barWidth(item.value, maxStatus) }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="eyebrow">Hotspots</div>
          <h2>Top location clusters</h2>
          <div className="hotspotList">
            {hotspots.map((hotspot) => (
              <div className="hotspotItem" key={hotspot.location}>
                <strong>{hotspot.location}</strong>
                <span className="muted">
                  {hotspot.reports} reports across {hotspot.issues} issue{hotspot.issues === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </div>
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
                  <img src={item.image_url} alt={item.description} className="evidenceThumb" />
                </Link>
                <div className="evidenceTileBody">
                  <strong>{item.description}</strong>
                  {item.location_label && (
                    <span className="locationLabel">{item.location_label}</span>
                  )}
                  <span className="coordinateChip">
                    {Number(item.latitude).toFixed(5)}, {Number(item.longitude).toFixed(5)}
                  </span>
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
            <span>In Progress</span>
            <span>Resolved</span>
          </div>
        </div>

        {issues.length > 0 ? (
          <IssueMap issues={issues} />
        ) : (
          <div className="emptyState">No live issues yet. Load demo data or submit a complaint.</div>
        )}
      </section>

      <section className="card tableCard">
        <div className="sectionHeader">
          <div>
            <div className="eyebrow">Operations</div>
            <h2>Prioritized queue</h2>
          </div>
          <span className="muted">{highPriority} high-priority issues</span>
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
                  <th>Location</th>
                  <th>Reports</th>
                  <th>Priority</th>
                  <th>Workflow</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => {
                  const photo = latestEvidenceByIssue.get(issue.id);
                  const band = priorityBand(issue.priority_score);

                  return (
                    <tr key={issue.id}>
                      <td>
                        <Link href={"/issues/" + issue.id}>
                          <strong>{issue.title}</strong>
                        </Link>
                        <div className="tableSubline">
                          {civicCategoryLabel(issue.category)}
                          {issue.source === "demo" ? " • Demo" : ""}
                        </div>
                      </td>
                      <td>
                        {photo ? (
                          <Link href={"/issues/" + issue.id} className="tablePhotoLink">
                            <img src={photo.image_url} alt="" className="tablePhoto" />
                            <span>View</span>
                          </Link>
                        ) : (
                          <span className="muted">No photo</span>
                        )}
                      </td>
                      <td>
                        <div className="tableLocation">
                          {issue.location_label && (
                            <strong>{issue.location_label}</strong>
                          )}
                          <span className="coordinateChip">
                            {issue.latitude.toFixed(5)}, {issue.longitude.toFixed(5)}
                          </span>
                        </div>
                      </td>
                      <td>{issue.report_count}</td>
                      <td>
                        <span className={"priorityBadge " + band}>
                          {issue.priority_score} • {band}
                        </span>
                      </td>
                      <td>
                        <IssueActions
                          issueId={issue.id}
                          status={issue.status}
                          department={issue.department}
                        />
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
