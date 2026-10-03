import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase";
import { priorityBand } from "@/lib/priority";
import { civicCategoryLabel } from "@/lib/categories";
import TrackActions from "./TrackActions";

function label(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "No update recorded";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

const workflow = ["open", "assigned", "in_progress", "resolved"] as const;

export default async function TrackingResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  let issue: any = null;
  let latestUpdate: any = null;

  if (supabase) {
    const { data: issueData } = await supabase
      .from("issues")
      .select(
        "id,title,category,status,department,priority_score,report_count,location_label,latitude,longitude,created_at,updated_at",
      )
      .eq("id", id)
      .maybeSingle();

    issue = issueData;

    if (issueData) {
      const { data: updateData } = await supabase
        .from("issue_updates")
        .select("status,message,created_at")
        .eq("issue_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      latestUpdate = updateData;
    }
  }

  if (!issue) {
    return (
      <main>
        <nav className="nav glassNav">
          <Link className="brand" href="/">
            <span className="brandMark">CM</span>
            <span>CivicMerge AI</span>
          </Link>
          <Link className="button secondary" href="/track">
            Back to tracking
          </Link>
        </nav>

        <section className="card trackingNotFound">
          <div className="eyebrow">Tracking result</div>
          <h2>Tracking ID not found</h2>
          <p className="muted">
            Check the ID from your complaint confirmation and try again.
          </p>
          <div className="trackingCode">{id}</div>
          <Link className="button" href="/track">
            Try another ID
          </Link>
        </section>
      </main>
    );
  }

  const band = priorityBand(Number(issue.priority_score) || 0);
  const currentIndex = Math.max(0, workflow.indexOf(issue.status));

  return (
    <main>
      <nav className="nav glassNav">
        <Link className="brand" href="/">
          <span className="brandMark">CM</span>
          <span>CivicMerge AI</span>
        </Link>
        <div className="actions">
          <Link className="button secondary" href="/report">
            Report issue
          </Link>
          <Link className="button secondary" href="/track">
            Track another
          </Link>
        </div>
      </nav>

      <section className="trackingResultShell">
        <div className="trackingTopBar">
          <div>
            <div className="eyebrow">Citizen complaint tracking</div>
            <h1 className="pageTitle">Complaint status</h1>
          </div>
          <div className="pageHeaderBadge">
            <span className="statusDot" />
            Live master issue
          </div>
        </div>

        <div className="card trackingResultCard">
        <div className="sectionHeader">
          <div className="trackingIssueHeading">
            <span className="trackingIssueLabel">Master issue</span>
            <h2>{issue.title}</h2>
            <div className="trackingCode">{issue.id}</div>
          </div>

          <div className="issueBadgeStack">
            <span className={"statusBadge " + issue.status}>
              {label(issue.status)}
            </span>
            <span className={"priorityBadge " + band}>
              {band} priority
            </span>
          </div>
        </div>

        <TrackActions trackingId={issue.id} />

        <div className="trackingSectionHeader">
          <div>
            <span className="eyebrow">Workflow progress</span>
            <strong>{label(issue.status)}</strong>
          </div>
          <span className="muted">Updates from the municipal command center</span>
        </div>

        <div className="trackingProgress">
          {workflow.map((step, index) => {
            const completed = index <= currentIndex;
            const current = index === currentIndex;

            return (
              <div
                key={step}
                className={
                  "trackingStep " +
                  (completed ? "completed " : "") +
                  (current ? "current" : "")
                }
              >
                <div className="trackingStepDot">{completed ? "✓" : index + 1}</div>
                <div>
                  <strong>{label(step)}</strong>
                  {current && <div className="muted">Current status</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="trackingSectionHeader">
          <div>
            <span className="eyebrow">Issue summary</span>
            <strong>Current operational details</strong>
          </div>
        </div>

        <div className="trackingInfoGrid">
          <div className="trackingInfo">
            <span className="muted">Department</span>
            <strong>{label(issue.department ?? "unassigned")}</strong>
          </div>
          <div className="trackingInfo">
            <span className="muted">Category</span>
            <strong>{civicCategoryLabel(issue.category)}</strong>
          </div>
          <div className="trackingInfo">
            <span className="muted">Priority</span>
            <strong>
              {issue.priority_score} • {label(band)}
            </strong>
          </div>
          <div className="trackingInfo">
            <span className="muted">Citizen reports</span>
            <strong>{issue.report_count}</strong>
          </div>
        </div>

        <div className="trackingPanels">
          <div className="trackingPanel">
            <div className="eyebrow">Issue location</div>
            {issue.location_label && <h3>{issue.location_label}</h3>}
            <span className="coordinateChip">
              {Number(issue.latitude).toFixed(5)},{" "}
              {Number(issue.longitude).toFixed(5)}
            </span>
          </div>

          <div className="trackingPanel">
            <div className="eyebrow">Latest municipal update</div>
            <h3>
              {latestUpdate
                ? label(latestUpdate.status)
                : label(issue.status)}
            </h3>
            <p className="muted">
              {latestUpdate?.message ??
                "Your complaint is registered and is waiting for its next workflow update."}
            </p>
            <span className="trackingTimestamp">
              {formatDate(latestUpdate?.created_at ?? issue.updated_at)}
            </span>
          </div>
        </div>
        </div>
      </section>
    </main>
  );
}
