"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const options = [
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "resolved", label: "Resolved" },
];

export default function IssueActions({
  issueId,
  status,
}: {
  issueId: string;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function changeStatus(nextStatus: string) {
    const previous = value;
    setValue(nextStatus);
    setSaving(true);

    const response = await fetch("/api/issues/" + issueId + "/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!response.ok) {
      setValue(previous);
      const result = await response.json().catch(() => ({}));
      alert(result.message ?? "Could not update issue status.");
    } else {
      router.refresh();
    }

    setSaving(false);
  }

  return (
    <select
      className="statusSelect"
      value={value}
      disabled={saving}
      onChange={(event) => changeStatus(event.target.value)}
      aria-label="Issue status"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
