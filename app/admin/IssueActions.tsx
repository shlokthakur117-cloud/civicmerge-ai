"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

const departmentOptions = [
  { value: "unassigned", label: "Unassigned" },
  { value: "roads", label: "Roads" },
  { value: "water", label: "Water" },
  { value: "waste", label: "Waste" },
  { value: "electrical", label: "Electrical" },
  { value: "drainage", label: "Drainage" },
  { value: "general", label: "General" },
];

export default function IssueActions({
  issueId,
  status,
  department,
}: {
  issueId: string;
  status: string;
  department: string;
}) {
  const router = useRouter();
  const [statusValue, setStatusValue] = useState(status);
  const [departmentValue, setDepartmentValue] = useState(department);
  const [saving, setSaving] = useState(false);

  async function updateIssue(payload: Record<string, string>) {
    setSaving(true);

    const response = await fetch("/api/issues/" + issueId + "/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      alert(result.message ?? "Could not update issue.");
      setStatusValue(status);
      setDepartmentValue(department);
    } else {
      router.refresh();
    }

    setSaving(false);
  }

  return (
    <div className="issueActions">
      <select
        className="statusSelect"
        value={statusValue}
        disabled={saving}
        onChange={(event) => {
          const next = event.target.value;
          setStatusValue(next);
          updateIssue({ status: next });
        }}
        aria-label="Issue status"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        className="statusSelect"
        value={departmentValue}
        disabled={saving}
        onChange={(event) => {
          const next = event.target.value;
          setDepartmentValue(next);
          updateIssue({ department: next });
        }}
        aria-label="Assigned department"
      >
        {departmentOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
