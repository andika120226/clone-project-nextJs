import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleMapsFallbackUrl,
  normalizeGoogleMapsEmbedUrl,
  extractCoordinates,
} from "@/lib/google-maps";

async function resolveGoogleMapsUrl(inputUrl: string, latitude: number, longitude: number) {
  const normalized = normalizeGoogleMapsEmbedUrl(inputUrl);
  if (normalized) {
    return normalized;
  }

  if (!inputUrl.trim()) {
    return buildGoogleMapsFallbackUrl(latitude, longitude);
  }

  try {
    const response = await fetch(inputUrl, { redirect: "follow" });
    const resolved = normalizeGoogleMapsEmbedUrl(response.url);
    return resolved ?? buildGoogleMapsFallbackUrl(latitude, longitude);
  } catch {
    return buildGoogleMapsFallbackUrl(latitude, longitude);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const inputUrl = String(body?.url || "").trim();
    const latitude = Number(body?.latitude ?? 0);
    const longitude = Number(body?.longitude ?? 0);

    const embedUrl = await resolveGoogleMapsUrl(inputUrl, latitude, longitude);
    const coords = extractCoordinates(embedUrl);

    return NextResponse.json({
      ok: true,
      data: {
        embedUrl,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memproses URL Google Maps.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}