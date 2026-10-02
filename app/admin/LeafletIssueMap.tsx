"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { MapIssue } from "./IssueMap";

function statusColor(status: string) {
  if (status === "resolved") return "#16a34a";
  if (status === "in_progress") return "#2563eb";
  if (status === "assigned") return "#f59e0b";
  return "#dc2626";
}

export default function LeafletIssueMap({ issues }: { issues: MapIssue[] }) {
  const latitude = issues.reduce((sum, issue) => sum + issue.latitude, 0) / issues.length;
  const longitude = issues.reduce((sum, issue) => sum + issue.longitude, 0) / issues.length;

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={issues.length > 1 ? 13 : 15}
      scrollWheelZoom={false}
      className="leafletMap"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {issues.map((issue) => {
        const color = statusColor(issue.status);

        return (
          <CircleMarker
            key={issue.id}
            center={[issue.latitude, issue.longitude]}
            radius={Math.min(15, 7 + issue.report_count)}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.75 }}
          >
            <Popup>
              <strong>{issue.title}</strong>
              <br />
              Reports: {issue.report_count}
              <br />
              Priority: {issue.priority_score}
              <br />
              Status: {issue.status.replaceAll("_", " ")}
              <br />
              Coordinates: {issue.latitude.toFixed(5)}, {issue.longitude.toFixed(5)}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
