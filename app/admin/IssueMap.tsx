"use client";

import dynamic from "next/dynamic";

const LeafletIssueMap = dynamic(() => import("./LeafletIssueMap"), {
  ssr: false,
  loading: () => <div className="mapLoading">Loading issue map…</div>,
});

export type MapIssue = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  location_label?: string | null;
  status: string;
  report_count: number;
  priority_score: number;
};

export default function IssueMap({ issues }: { issues: MapIssue[] }) {
  return <LeafletIssueMap issues={issues} />;
}
