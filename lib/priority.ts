export type PriorityInput = {
  reportCount: number;
  category: string;
  recentReports?: number;
};

const categoryWeight: Record<string, number> = {
  water_leak: 12,
  drainage: 10,
  pothole: 8,
  garbage: 7,
  streetlight: 5,
  other: 4,
};

export function calculatePriority({
  reportCount,
  category,
  recentReports = 1,
}: PriorityInput) {
  const base = 20;
  const volume = Math.min(40, Math.max(1, reportCount) * 5);
  const severity = categoryWeight[category] ?? categoryWeight.other;
  const frequency = Math.min(20, Math.max(1, recentReports) * 3);
  const recency = 5;

  return Math.min(100, Math.round(base + volume + severity + frequency + recency));
}

export function priorityBand(score: number) {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  return "low";
}
