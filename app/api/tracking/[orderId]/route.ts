import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Default Lampung coordinates (Bandar Lampung fallback)
const DEFAULT_COORDS = { currentLat: -5.397139, currentLng: 105.266137 };

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/");
    const orderId = parts[parts.length - 1];
    if (!orderId) return NextResponse.json({ ok: false, error: "orderId required" }, { status: 400 });

    const latest = await prisma.trackingPoint.findFirst({
      where: { orderId },
      orderBy: { recordedAt: "desc" },
    });

    if (!latest) {
      return NextResponse.json({ ok: true, data: DEFAULT_COORDS });
    }

    return NextResponse.json({ ok: true, data: { currentLat: latest.latitude, currentLng: latest.longitude } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch tracking";
    console.error("GET /api/tracking/[orderId] error:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/");
    const orderId = parts[parts.length - 1];
    if (!orderId) return NextResponse.json({ ok: false, error: "orderId required" }, { status: 400 });

    const body = await req.json();
    const lat = typeof body?.currentLat === "number" ? body.currentLat : null;
    const lng = typeof body?.currentLng === "number" ? body.currentLng : null;
    const note = typeof body?.note === "string" ? body.note : null;

    if (lat === null || lng === null) {
      return NextResponse.json({ ok: false, error: "currentLat and currentLng required" }, { status: 400 });
    }

    const created = await prisma.trackingPoint.create({
      data: { orderId, latitude: lat, longitude: lng, note },
    });

    // also update order current coords for quick lookup
    await prisma.order.update({ where: { id: orderId }, data: { currentLat: lat, currentLng: lng } }).catch(() => null);

    return NextResponse.json({ ok: true, data: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update tracking";
    console.error("PUT /api/tracking/[orderId] error:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
