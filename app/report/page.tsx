"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";

type ApiResult = {
  action?: "merged" | "created" | "possible_duplicate";
  message: string;
  score?: number;
  distanceMeters?: number;
  issueId?: string;
  matchedTitle?: string;
  matchedCategory?: string;
  matchedStatus?: string;
};

export default function ReportPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [coords, setCoords] = useState({ latitude: "", longitude: "" });

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
      <nav className="nav">
        <Link className="brand" href="/">CivicMerge AI</Link>
        <Link className="button secondary" href="/admin">Admin dashboard</Link>
      </nav>

      <section className="card">
        <div className="eyebrow">Citizen reporting</div>
        <h2>Report a civic issue</h2>
        <p className="muted">
          Your report is checked against nearby master issues before a new ticket is created.
        </p>

        <form ref={formRef} onSubmit={submit}>
          <label>
            Category
            <select name="category" required>
              <option value="pothole">Pothole</option>
              <option value="streetlight">Broken streetlight</option>
              <option value="garbage">Garbage</option>
              <option value="water_leak">Water leak</option>
              <option value="drainage">Drainage</option>
              <option value="other">Other</option>
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

          <button className="button" disabled={loading}>
            {loading ? "Checking nearby issues..." : "Submit complaint"}
          </button>
        </form>

        {result && (
          <div className="result">
            <strong>{result.message}</strong>

            {typeof result.score === "number" && (
              <p>Duplicate confidence: {Math.round(result.score * 100)}%</p>
            )}

            {typeof result.distanceMeters === "number" && (
              <p>Distance from matched issue: {result.distanceMeters} m</p>
            )}

            {result.action === "possible_duplicate" && result.issueId && (
              <div className="duplicateDecision">
                <div className="duplicatePreview">
                  <span className="eyebrow">Nearby master issue</span>
                  <strong>{result.matchedTitle ?? "Possible matching issue"}</strong>
                  <span className="muted">
                    {result.matchedCategory ?? "civic issue"} • {result.matchedStatus ?? "open"}
                  </span>
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
              <div className="resultActions">
                <Link className="button" href={"/issues/" + result.issueId}>
                  View complaint & photo
                </Link>
                <Link className="button secondary" href="/admin">
                  Open admin dashboard
                </Link>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
