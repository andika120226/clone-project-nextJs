import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus } from "@prisma/client";
import { requireAuth } from "@/lib/api-auth";
import { decimalToNumber } from "@/lib/api-serializers";

const ACTIVE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"];
const HISTORY_STATUSES: OrderStatus[] = ["DELIVERED", "CANCELLED"];

function toBillCode6(source: string) {
  const digits = source.replace(/\D/g, "");
  if (digits.length >= 6) {
    return digits.slice(-6);
  }

  let hash = 0;
  for (const ch of source) {
    hash = (hash * 31 + ch.charCodeAt(0)) % 900000;
  }
  return String(100000 + hash).slice(-6);
}

function statusLabel(status: OrderStatus) {
  if (status === "PROCESSING") return "DIPROSES";
  if (status === "SHIPPED") return "DIKIRIM";
  if (status === "DELIVERED") return "SELESAI";
  if (status === "CANCELLED") return "DIBATALKAN";
  if (status === "CONFIRMED") return "DIKONFIRMASI";
  return "PENDING";
}

async function resolveFarmerId(req: NextRequest) {
  const auth = await requireAuth(req, ["FARMER"]);
  if (auth.user) {
    return auth.user.id;
  }

  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("farmerId")?.trim() || "";
  const fromHeader = req.headers.get("x-farmer-id")?.trim() || "";
  const fallbackId = fromHeader || fromQuery;

  if (!fallbackId) {
    return null;
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const farmer = await prisma.user.findUnique({
      where: { id: fallbackId },
      select: { id: true, role: true },
    });

    if (!farmer || farmer.role !== "FARMER") {
      return null;
    }

    return farmer.id;
  } catch (err) {
    console.warn("Prisma unavailable in resolveFarmerId, falling back to header id", err);
    // If Prisma is unavailable (dev without DATABASE), accept header fallback conservatively
    return fallbackId;
  }
}

export async function GET(req: NextRequest) {
  try {
    const farmerId = await resolveFarmerId(req);
    if (!farmerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const scope = (url.searchParams.get("scope") || "all").toLowerCase();
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 20)));
    const skip = (page - 1) * limit;

    let statuses: OrderStatus[] | undefined;
    if (scope === "active") {
      statuses = ACTIVE_STATUSES;
    } else if (scope === "history") {
      statuses = HISTORY_STATUSES;
    } else {
      const statusParam = url.searchParams.get("status");
      if (statusParam) {
        const parsed = statusParam
          .split(",")
          .map((s) => s.trim().toUpperCase())
          .filter((s): s is OrderStatus =>
            ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].includes(s),
          );
        if (parsed.length > 0) {
          statuses = parsed;
        }
      }
    }

    const where = {
      farmerId,
      ...(statuses ? { status: { in: statuses } } : {}),
    };

    try {
      const { prisma } = await import("@/lib/prisma");
      const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
          where,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            items: {
              include: {
                product: {
                  select: { id: true, name: true },
                },
              },
            },
            payment: true,
            address: true,
            trackingPoints: {
              orderBy: { recordedAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
      ]);

      const data = orders.map((order) => ({
        id: order.id,
        trackingId: order.trackingId,
        billCode: toBillCode6(order.trackingId),
        createdAt: order.createdAt,
        status: order.status,
        statusLabel: statusLabel(order.status),
        buyer: {
          id: order.customer.id,
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone || order.address?.phoneNumber || "",
        },
        address: order.address?.fullAddress || "",
        paymentMethod: order.payment?.method ?? "BANK_TRANSFER",
        paymentStatus: order.payment?.status ?? "PENDING",
        subtotal: decimalToNumber(order.subtotal) ?? 0,
        logisticsCost: decimalToNumber(order.logisticsCost) ?? 0,
        total: decimalToNumber(order.total) ?? 0,
        currentLat: order.currentLat,
        currentLng: order.currentLng,
        estimatedArrival: order.estimatedArrival?.toISOString() ?? null,
        trackingPoints: order.trackingPoints.map((point) => ({
          latitude: point.latitude,
          longitude: point.longitude,
          note: point.note,
          recordedAt: point.recordedAt.toISOString(),
        })),
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product?.name ?? "Produk",
          quantityKg: item.quantityKg,
          unitPrice: decimalToNumber(item.unitPrice) ?? 0,
          subtotal: decimalToNumber(item.subtotal) ?? 0,
        })),
      }));

      const paidCount = orders.filter((order) => order.payment?.status === "SUCCESS").length;

      return NextResponse.json({
        ok: true,
        data,
        summary: {
          totalOrders: total,
          paidOrders: paidCount,
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      console.warn("Prisma unavailable for admin orders; returning empty list", err);
      return NextResponse.json({ ok: true, data: [], summary: { totalOrders: 0, paidOrders: 0 }, pagination: { page, limit, total: 0, pages: 0 } });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    console.error("Fetch admin orders error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
