type NominatimAddress = Record<string, string | undefined>;

function unique(values: Array<string | undefined>) {
  return values.filter(
    (value, index, array): value is string =>
      Boolean(value) && array.indexOf(value) === index,
  );
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("zoom", "18");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "CivicMergeAI-Hackathon/1.0",
        "Accept-Language": "en",
      },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      display_name?: string;
      name?: string;
      address?: NominatimAddress;
    };

    const address = data.address ?? {};

    const primary =
      data.name ??
      address.amenity ??
      address.building ??
      address.road ??
      address.neighbourhood ??
      address.suburb;

    const locality =
      address.suburb ??
      address.neighbourhood ??
      address.city_district ??
      address.village;

    const city =
      address.city ??
      address.town ??
      address.village ??
      address.municipality;

    const state = address.state;

    const parts = unique([primary, locality, city, state]).slice(0, 3);

    if (parts.length > 0) return parts.join(", ");

    return data.display_name
      ? data.display_name.split(",").slice(0, 3).join(",").trim()
      : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
