"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DemoControls() {
  const router = useRouter();
  const [busy, setBusy] = useState<"seed" | "reset" | null>(null);

  async function run(action: "seed" | "reset") {
    const confirmed =
      action === "reset"
        ? window.confirm("Reset only the hackathon demo records? Live complaints will be kept.")
        : true;

    if (!confirmed) return;

    setBusy(action);

    const response = await fetch("/api/admin/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      alert(result.message ?? "Demo operation failed.");
    } else {
      router.refresh();
    }

    setBusy(null);
  }

  return (
    <div className="demoControls">
      <button
        type="button"
        className="button secondary"
        disabled={Boolean(busy)}
        onClick={() => run("seed")}
      >
        {busy === "seed" ? "Loading demo..." : "Load demo data"}
      </button>
      <button
        type="button"
        className="button ghost"
        disabled={Boolean(busy)}
        onClick={() => run("reset")}
      >
        {busy === "reset" ? "Resetting..." : "Reset demo data"}
      </button>
    </div>
  );
}
