"use client";

import { useState } from "react";
import Link from "next/link";

export default function TrackActions({ trackingId }: { trackingId: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(trackingId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="trackingActions">
      <button type="button" className="button secondary" onClick={copy}>
        {copied ? "Copied" : "Copy tracking ID"}
      </button>
      <Link className="button secondary" href="/track">
        Track another complaint
      </Link>
    </div>
  );
}
