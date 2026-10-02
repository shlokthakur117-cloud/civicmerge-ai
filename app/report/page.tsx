"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type ApiResult = {
  action: "merged" | "created" | "possible_duplicate";
  message: string;
  score?: number;
  distanceMeters?: number;
  issueId?: string;
};

export default function ReportPage() {
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      category: form.get("category"),
      description: form.get("description"),
      latitude: Number(form.get("latitude")),
      longitude: Number(form.get("longitude")),
    };

    const response = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setResult(data);
    setLoading(false);
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
          The system checks your report against existing master issues before creating a new ticket.
        </p>

        <form onSubmit={submit}>
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

          <div className="grid">
            <label>
              Latitude
              <input name="latitude" required value={coords.latitude} onChange={(e) => setCoords({ ...coords, latitude: e.target.value })} />
            </label>
            <label>
              Longitude
              <input name="longitude" required value={coords.longitude} onChange={(e) => setCoords({ ...coords, longitude: e.target.value })} />
            </label>
            <div style={{ display: "flex", alignItems: "end" }}>
              <button type="button" className="button secondary" onClick={useMyLocation}>Use my location</button>
            </div>
          </div>

          <button className="button" disabled={loading}>
            {loading ? "Checking for duplicates..." : "Submit complaint"}
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
            {result.issueId && <p>Master issue ID: {result.issueId}</p>}
          </div>
        )}
      </section>
    </main>
  );
}
