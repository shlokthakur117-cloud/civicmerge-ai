import Link from "next/link";

export default function Home() {
  return (
    <main>
      <nav className="nav">
        <div className="brand">CivicMerge AI</div>
        <div className="actions">
          <Link className="button secondary" href="/admin">Admin dashboard</Link>
          <Link className="button" href="/report">Report an issue</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="eyebrow">Smart Cities • Complaint Fusion</div>
        <h1>One civic issue. One intelligent report.</h1>
        <p className="lead">
          CivicMerge AI detects when multiple citizens are reporting the same real-world
          problem and combines those complaints into a single master issue while keeping
          every report as supporting evidence.
        </p>
        <div className="actions">
          <Link className="button" href="/report">Try duplicate detection</Link>
          <Link className="button secondary" href="/admin">View command center</Link>
        </div>
      </section>

      <section className="grid">
        <div className="card"><div className="metric">1</div><div className="muted">Master issue instead of many duplicate tickets</div></div>
        <div className="card"><div className="metric">AI</div><div className="muted">Semantic + location + category + time matching</div></div>
        <div className="card"><div className="metric">24h</div><div className="muted">Architecture intentionally scoped for hackathon delivery</div></div>
      </section>
    </main>
  );
}
