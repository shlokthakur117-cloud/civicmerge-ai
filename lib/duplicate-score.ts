export type DuplicateCandidate = {
  similarity: number;
  categoryMatch: boolean;
  latitude: number;
  longitude: number;
  createdAt: string;
};

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

function geoSimilarity(distance: number) {
  if (distance <= 25) return 1;
  if (distance >= 300) return 0;
  return 1 - (distance - 25) / 275;
}

function timeSimilarity(createdAt: string) {
  const ageHours = Math.max(
    0,
    (Date.now() - new Date(createdAt).getTime()) / 3_600_000,
  );
  if (ageHours <= 24) return 1;
  if (ageHours >= 24 * 30) return 0.2;
  return Math.max(0.2, 1 - ageHours / (24 * 30));
}

export function calculateDuplicateScore(
  candidate: DuplicateCandidate,
  newLatitude: number,
  newLongitude: number,
) {
  const distance = distanceMeters(
    newLatitude,
    newLongitude,
    candidate.latitude,
    candidate.longitude,
  );

  const score =
    0.55 * candidate.similarity +
    0.25 * geoSimilarity(distance) +
    0.15 * (candidate.categoryMatch ? 1 : 0) +
    0.05 * timeSimilarity(candidate.createdAt);

  return {
    score: Math.round(score * 1000) / 1000,
    distanceMeters: Math.round(distance),
  };
}
