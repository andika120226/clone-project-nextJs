const DEFAULT_ZOOM = 13;

function isFiniteNumber(value: number) {
  return Number.isFinite(value);
}

function buildEmbedUrl(latitude: number, longitude: number) {
  return `https://maps.google.com/maps?q=${latitude},${longitude}&z=${DEFAULT_ZOOM}&output=embed`;
}

export function extractCoordinates(text: string) {
  const atMatch = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    return { latitude: Number(atMatch[1]), longitude: Number(atMatch[2]) };
  }

  const placeMatch = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (placeMatch) {
    return { latitude: Number(placeMatch[1]), longitude: Number(placeMatch[2]) };
  }

  const qMatch = text.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (qMatch) {
    return { latitude: Number(qMatch[1]), longitude: Number(qMatch[2]) };
  }

  return null;
}

export function buildGoogleMapsFallbackUrl(latitude: number, longitude: number) {
  const safeLatitude = isFiniteNumber(latitude) ? latitude : 0;
  const safeLongitude = isFiniteNumber(longitude) ? longitude : 0;
  return buildEmbedUrl(safeLatitude, safeLongitude);
}

export function normalizeGoogleMapsEmbedUrl(
  input: string | null | undefined,
) {
  const rawValue = input?.trim();
  if (!rawValue) {
    return null;
  }

  // 1. Extract src if it is a copy-pasted iframe tag
  let target = rawValue;
  const iframeMatch = rawValue.match(/src=["'](https:\/\/[^"']+)["']/i);
  if (iframeMatch) {
    target = iframeMatch[1];
  }

  // 2. If it is NOT a URL, treat it as a plain-text search query (e.g. "Jakarta" or "Lampung")
  if (target && !target.startsWith("http://") && !target.startsWith("https://")) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(target)}&z=${DEFAULT_ZOOM}&output=embed`;
  }

  try {
    const url = new URL(target);

    // Standardize hostname from www.google.com to maps.google.com to prevent X-Frame-Options block
    if (url.hostname === "www.google.com" && url.pathname.startsWith("/maps")) {
      url.hostname = "maps.google.com";
    }

    if (url.searchParams.get("output") === "embed") {
      return url.toString();
    }

    if (url.pathname.includes("/maps/embed")) {
      return url.toString();
    }

    const directCoordinates = extractCoordinates(target) ?? extractCoordinates(url.toString());
    if (directCoordinates) {
      return buildEmbedUrl(directCoordinates.latitude, directCoordinates.longitude);
    }

    // Extract search query from place URL pathname e.g. /maps/place/Bandar+Lampung/
    const placePathMatch = url.pathname.match(/\/maps\/place\/([^/]+)/);
    if (placePathMatch) {
      const placeName = decodeURIComponent(placePathMatch[1].replace(/\+/g, " "));
      return `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&z=${DEFAULT_ZOOM}&output=embed`;
    }

    const query = url.searchParams.get("q")?.trim() || url.searchParams.get("query")?.trim();
    if (query) {
      const queryCoordinates = extractCoordinates(query);
      if (queryCoordinates) {
        return buildEmbedUrl(queryCoordinates.latitude, queryCoordinates.longitude);
      }

      return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${DEFAULT_ZOOM}&output=embed`;
    }
  } catch {
    const directCoordinates = extractCoordinates(target);
    if (directCoordinates) {
      return buildEmbedUrl(directCoordinates.latitude, directCoordinates.longitude);
    }
  }

  return null;
}