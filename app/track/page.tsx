import Link from "next/link";
import TrackForm from "./TrackForm";

export default function TrackPage() {
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
          <Link className="button secondary" href="/admin">
            Admin
          </Link>
        </div>
      </nav>

      <section className="trackingHero trackingHeroPolished">
        <div className="trackingHeroCopy">
          <div className="eyebrow">Citizen tracking</div>
          <h1>Know exactly where your complaint stands.</h1>
          <p className="lead">
            Enter your tracking ID to see the live municipal status, assigned department,
            priority, location, report count, and latest workflow update.
          </p>

          <div className="heroChips">
            <span>Read-only citizen view</span>
            <span>Live workflow status</span>
            <span>Shared master issue tracking</span>
          </div>
        </div>

        <div className="card trackingSearchCard">
          <div className="searchCardHeader">
            <span className="trackingSearchIcon">#</span>
            <div>
              <strong>Enter tracking ID</strong>
              <small>Use the ID shown after submitting your complaint.</small>
            </div>
          </div>
          <TrackForm />
        </div>
      </section>

      <section className="impactGrid trackBenefits">
        <div className="impactCard">
          <span className="impactKicker">One reference</span>
          <div className="metric">1 ID</div>
          <strong>Shared master tracking</strong>
          <p className="muted">Your ID follows the same real-world issue even when duplicate reports are fused.</p>
        </div>
        <div className="impactCard">
          <span className="impactKicker">Municipal workflow</span>
          <div className="metric">Live</div>
          <strong>Status visibility</strong>
          <p className="muted">See Open, Assigned, In Progress, and Resolved without contacting an operator.</p>
        </div>
        <div className="impactCard">
          <span className="impactKicker">Citizen safety</span>
          <div className="metric">Read</div>
          <strong>No admin controls</strong>
          <p className="muted">The public tracking view is intentionally read-only.</p>
        </div>
      </section>
    </main>
  );
}
