"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { civicCategories, civicCategoryLabel } from "@/lib/categories";

type ApiResult = {
  action?: "merged" | "created" | "reopened" | "possible_duplicate";
  message: string;
  score?: number;
  distanceMeters?: number;
  issueId?: string;
  matchedTitle?: string;
  matchedCategory?: string;
  matchedStatus?: string;
  matchedLocation?: string | null;
};

export default function ReportPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [coords, setCoords] = useState({ latitude: "", longitude: "" });
  const [copied, setCopied] = useState(false);

  function useMyLocation() {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setCoords({
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }),
      () => alert("Location permission was not granted."),
    );
  }

  async function sendComplaint(form: FormData) {
    setLoading(true);

    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        body: form,
      });

      const data = await response.json();
      setResult(data);
    } catch {
      setResult({ message: "Could not submit the complaint. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function copyTrackingId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    await sendComplaint(new FormData(event.currentTarget));
  }

  async function resolvePossibleDuplicate(
    action: "merge" | "create_separate",
  ) {
    if (!formRef.current || !result?.issueId) return;

    const form = new FormData(formRef.current);
    form.set("resolutionAction", action);
    form.set("matchedIssueId", result.issueId);

    if (typeof result.score === "number") {
      form.set("resolutionScore", String(result.score));
    }

    await sendComplaint(form);
  }

  return (
    <main>
      <nav className="nav glassNav">
        <Link className="brand" href="/">
          <span className="brandMark">CM</span>
          <span>CivicMerge AI</span>
        </Link>
        <div className="actions">
          <Link className="button secondary" href="/track">Track complaint</Link>
          <Link className="button secondary" href="/admin">Admin dashboard</Link>
        </div>
      </nav>

      <header className="pageHeader">
        <div>
          <div className="eyebrow">Citizen reporting</div>
          <h1 className="pageTitle">Report a civic issue</h1>
          <p className="lead compactLead">
            Send one clear report. CivicMerge AI checks nearby master issues before creating another ticket.
          </p>
        </div>
        <div className="pageHeaderBadge">
          <span className="statusDot" />
          AI duplicate check enabled
        </div>
      </header>

      <div className="reportLayout">
        <section className="card reportCard">
          <div className="formSectionTitle">
            <span>01</span>
            <div>
              <strong>Issue details</strong>
              <small>Category, description and evidence</small>
            </div>
          </div>

          <form ref={formRef} onSubmit={submit}>
          <label>
            Category
            <select name="category" required>
              {civicCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Describe the problem
            <textarea
              name="description"
              required
              placeholder="Example: Dangerous pothole outside the college main gate."
            />
          </label>

          <label>
            Photo <span className="muted">(optional, max 5 MB)</span>
            <input
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            />
          </label>

          <div className="formSectionTitle locationSectionTitle">
            <span>02</span>
            <div>
              <strong>Issue location</strong>
              <small>Used for 300 m geographic duplicate validation</small>
            </div>
          </div>

          <div className="grid compactGrid">
            <label>
              Latitude
              <input
                name="latitude"
                required
                value={coords.latitude}
                onChange={(e) => setCoords({ ...coords, latitude: e.target.value })}
              />
            </label>
            <label>
              Longitude
              <input
                name="longitude"
                required
                value={coords.longitude}
                onChange={(e) => setCoords({ ...coords, longitude: e.target.value })}
              />
            </label>
            <div className="locationButton">
              <button type="button" className="button secondary" onClick={useMyLocation}>
                Use my location
              </button>
            </div>
          </div>

          <button className="button submitButton" disabled={loading}>
            {loading && <span className="buttonSpinner" />}
            {loading ? "Checking nearby issues..." : "Submit complaint"}
          </button>
        </form>

        {result && (
          <div className={"result resultPolished " + (result.action ? "result-" + result.action : "")}>
            <div className="resultHeadline">
              <span className="resultIcon">
                {result.action === "merged" ? "✓" :
                 result.action === "reopened" ? "↻" :
                 result.action === "possible_duplicate" ? "?" :
                 result.action === "created" ? "+" : "!"}
              </span>
              <div>
                <span className="eyebrow">AI decision</span>
                <strong>{result.message}</strong>
              </div>
            </div>

            {(typeof result.score === "number" || typeof result.distanceMeters === "number") && (
              <div className="resultMetrics">
                {typeof result.score === "number" && (
                  <div>
                    <span>Duplicate confidence</span>
                    <strong>{Math.round(result.score * 100)}%</strong>
                  </div>
                )}
                {typeof result.distanceMeters === "number" && (
                  <div>
                    <span>Distance</span>
                    <strong>{result.distanceMeters} m</strong>
                  </div>
                )}
              </div>
            )}

            {result.action === "possible_duplicate" && result.issueId && (
              <div className="duplicateDecision">
                <div className="duplicatePreview">
                  <span className="eyebrow">Nearby master issue</span>
                  <strong>{result.matchedTitle ?? "Possible matching issue"}</strong>
                  <span className="muted">
                    {result.matchedCategory
                      ? civicCategoryLabel(result.matchedCategory)
                      : "Civic issue"} • {result.matchedStatus ?? "open"}
                  </span>
                  {result.matchedLocation && (
                    <span className="locationLabel">{result.matchedLocation}</span>
                  )}
                  <Link href={"/issues/" + result.issueId}>
                    Review master issue →
                  </Link>
                </div>

                <div className="decisionActions">
                  <button
                    className="button"
                    type="button"
                    disabled={loading}
                    onClick={() => resolvePossibleDuplicate("merge")}
                  >
                    Merge with this issue
                  </button>
                  <button
                    className="button secondary"
                    type="button"
                    disabled={loading}
                    onClick={() => resolvePossibleDuplicate("create_separate")}
                  >
                    Create separate issue
                  </button>
                </div>
              </div>
            )}

            {result.action !== "possible_duplicate" && result.issueId && (
              <div className="trackingConfirmation">
                <div>
                  <div className="eyebrow">Your tracking ID</div>
                  <div className="trackingCode">{result.issueId}</div>
                  <p className="muted trackingHint">
                    Save this ID. If your report was merged, this tracks the shared master issue.
                  </p>
                </div>

                <div className="resultActions">
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => copyTrackingId(result.issueId!)}
                  >
                    {copied ? "Copied" : "Copy tracking ID"}
                  </button>
                  <Link className="button" href={"/track/" + result.issueId}>
                    Track complaint
                  </Link>
                  <Link className="button secondary" href={"/issues/" + result.issueId}>
                    View evidence
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
        </section>

        <aside className="reportAside">
          <div className="card aiCheckCard">
            <div className="eyebrow">How CivicMerge checks</div>
            <h2>Before creating a new ticket</h2>

            <div className="checkList">
              <div className="checkItem">
                <span>1</span>
                <div><strong>Category gate</strong><small>Only the same civic issue category is considered.</small></div>
              </div>
              <div className="checkItem">
                <span>2</span>
                <div><strong>300 m location filter</strong><small>Far-away issues are rejected before scoring.</small></div>
              </div>
              <div className="checkItem">
                <span>3</span>
                <div><strong>Semantic AI match</strong><small>Different wording can still describe the same real-world problem.</small></div>
              </div>
              <div className="checkItem">
                <span>4</span>
                <div><strong>Safe decision</strong><small>High confidence merges; uncertain cases stay in review.</small></div>
              </div>
            </div>
          </div>

          <div className="card privacyCard">
            <strong>Citizen-first workflow</strong>
            <p className="muted">
              After submission you receive a tracking ID that follows the master issue through assignment and resolution.
            </p>
            <Link className="textLink" href="/track">Track an existing complaint →</Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
