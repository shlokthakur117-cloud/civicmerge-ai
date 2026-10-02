import Link from "next/link";
import TrackForm from "./TrackForm";

export default function TrackPage() {
  return (
    <main>
      <nav className="nav">
        <Link className="brand" href="/">CivicMerge AI</Link>
        <div className="actions">
          <Link className="button secondary" href="/report">
            Report issue
          </Link>
          <Link className="button secondary" href="/admin">
            Admin
          </Link>
        </div>
      </nav>

      <section className="trackingHero">
        <div className="eyebrow">Citizen tracking</div>
        <h1>Track your civic complaint.</h1>
        <p className="lead">
          Enter the tracking ID you received after reporting an issue to see
          the latest municipal status, department, priority, and location.
        </p>

        <div className="card trackingSearchCard">
          <TrackForm />
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <div className="metric">1</div>
          <div className="muted">
            Tracking ID follows the master issue even when reports are merged.
          </div>
        </div>
        <div className="card">
          <div className="metric">Live</div>
          <div className="muted">
            See Open, Assigned, In Progress, or Resolved status.
          </div>
        </div>
        <div className="card">
          <div className="metric">Safe</div>
          <div className="muted">
            Tracking is read-only and exposes no administrator controls.
          </div>
        </div>
      </section>
    </main>
  );
}
