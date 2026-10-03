import Link from "next/link";

export default function Home() {
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
          <Link className="button" href="/report">Report an issue</Link>
        </div>
      </nav>

      <section className="hero heroPolished">
        <div className="heroCopy">
          <div className="eyebrow">AI-powered civic complaint fusion</div>
          <h1>One civic issue.<br />One intelligent report.</h1>
          <p className="lead">
            CivicMerge AI detects duplicate civic complaints using semantic similarity,
            location, category, and time—then combines them into one master issue with
            every citizen report preserved as evidence.
          </p>

          <div className="heroChips">
            <span>Semantic AI matching</span>
            <span>300 m geo validation</span>
            <span>Citizen tracking</span>
          </div>

          <div className="actions heroActions">
            <Link className="button primaryLarge" href="/report">Report an issue</Link>
            <Link className="button secondary" href="/track">Track complaint</Link>
          </div>
        </div>

        <div className="heroDemoPanel">
          <div className="demoPanelHeader">
            <div>
              <div className="eyebrow">AI decision engine</div>
              <strong>Duplicate complaint detected</strong>
            </div>
            <span className="livePill">Live</span>
          </div>

          <div className="demoIssue">
            <div className="demoIssueIcon">!</div>
            <div>
              <strong>Pothole near Main Gate</strong>
              <span>Roads • 8 citizen reports</span>
            </div>
          </div>

          <div className="scoreStack">
            <div className="scoreRow"><span>Semantic similarity</span><strong>94%</strong></div>
            <div className="scoreTrack"><div className="scoreFill score94" /></div>
            <div className="scoreRow"><span>Location distance</span><strong>18 m</strong></div>
            <div className="scoreTrack"><div className="scoreFill score88" /></div>
            <div className="scoreRow"><span>Category</span><strong>Match</strong></div>
            <div className="scoreTrack"><div className="scoreFill score100" /></div>
          </div>

          <div className="aiDecision">
            <span>Final decision</span>
            <strong>Merge into master issue</strong>
          </div>
        </div>
      </section>

      <section className="impactGrid">
        <div className="impactCard">
          <span className="impactKicker">Duplicate handling</span>
          <div className="metric">1</div>
          <strong>Master issue</strong>
          <p className="muted">Multiple citizen reports become evidence, not duplicate tickets.</p>
        </div>
        <div className="impactCard">
          <span className="impactKicker">Geospatial validation</span>
          <div className="metric">300 m</div>
          <strong>Maximum candidate radius</strong>
          <p className="muted">Similar wording far away does not create a false duplicate.</p>
        </div>
        <div className="impactCard">
          <span className="impactKicker">Automatic action</span>
          <div className="metric">85%</div>
          <strong>Auto-merge threshold</strong>
          <p className="muted">Uncertain matches stay in human review instead of being forced.</p>
        </div>
      </section>

      <section className="card workflowShowcase">
        <div className="sectionHeader">
          <div>
            <div className="eyebrow">Complete civic lifecycle</div>
            <h2>From citizen report to municipal resolution</h2>
          </div>
          <Link className="textLink" href="/admin">Open command center →</Link>
        </div>

        <div className="workflowStrip">
          <div className="workflowStep"><span>01</span><strong>Report</strong><small>Photo + category + location</small></div>
          <div className="workflowArrow">→</div>
          <div className="workflowStep"><span>02</span><strong>Detect</strong><small>AI + geo duplicate analysis</small></div>
          <div className="workflowArrow">→</div>
          <div className="workflowStep"><span>03</span><strong>Prioritize</strong><small>Volume + severity scoring</small></div>
          <div className="workflowArrow">→</div>
          <div className="workflowStep"><span>04</span><strong>Resolve</strong><small>Assign, update, track</small></div>
        </div>
      </section>
    </main>
  );
}
