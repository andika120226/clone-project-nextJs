import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { decimalToNumber } from "@/lib/api-serializers";

type Context = {
  params: Promise<{ trackingId: string }>;
};

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export async function GET(request: NextRequest, context: Context) {
  const auth = await requireAuth(request, ["CUSTOMER", "FARMER"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { trackingId } = await context.params;

  const order = await prisma.order.findUnique({
    where: { trackingId },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      farmer: { select: { id: true, name: true, email: true } },
      logisticsVehicle: true,
      trackingPoints: {
        orderBy: { recordedAt: "desc" },
      },
      items: {
        include: {
          product: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Tracking tidak ditemukan." }, { status: 404 });
  }

  const isOwner =
    (auth.user.role === "CUSTOMER" && order.customerId === auth.user.id) ||
    (auth.user.role === "FARMER" && order.farmerId === auth.user.id);

  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    data: {
      ...order,
      subtotal: decimalToNumber(order.subtotal),
      logisticsCost: decimalToNumber(order.logisticsCost),
      total: decimalToNumber(order.total),
      logisticsVehicle: order.logisticsVehicle
        ? {
            ...order.logisticsVehicle,
            capacityTon: decimalToNumber(order.logisticsVehicle.capacityTon),
            price: decimalToNumber(order.logisticsVehicle.price),
          }
        : null,
      items: order.items.map((item) => ({
        ...item,
        unitPrice: decimalToNumber(item.unitPrice),
        subtotal: decimalToNumber(item.subtotal),
      })),
    },
  });
}

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireAuth(request, ["FARMER"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { trackingId } = await context.params;

  try {
    const body = await request.json();
    const status = body?.status ? String(body.status).toUpperCase() : undefined;
    const currentLat = body?.currentLat === undefined ? undefined : Number(body.currentLat);
    const currentLng = body?.currentLng === undefined ? undefined : Number(body.currentLng);
    const estimatedArrival = body?.estimatedArrival ? new Date(body.estimatedArrival) : undefined;
    const note = body?.note ? String(body.note).trim() : null;

    if (status && !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
      return NextResponse.json({ error: "status tidak valid." }, { status: 400 });
    }

    if (estimatedArrival && Number.isNaN(estimatedArrival.getTime())) {
      return NextResponse.json({ error: "estimatedArrival tidak valid." }, { status: 400 });
    }

    if (currentLat !== undefined && Number.isNaN(currentLat)) {
      return NextResponse.json({ error: "currentLat tidak valid." }, { status: 400 });
    }

    if (currentLng !== undefined && Number.isNaN(currentLng)) {
      return NextResponse.json({ error: "currentLng tidak valid." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { trackingId } });
    if (!order) {
      return NextResponse.json({ error: "Tracking tidak ditemukan." }, { status: 404 });
    }

    if (order.farmerId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: status as "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | undefined,
          currentLat,
          currentLng,
          estimatedArrival,
        },
      });

      if (currentLat !== undefined && currentLng !== undefined) {
        await tx.trackingPoint.create({
          data: {
            orderId: order.id,
            latitude: currentLat,
            longitude: currentLng,
            note,
          },
        });
      }

      return nextOrder;
    });

    return NextResponse.json({
      ok: true,
      data: {
        ...updated,
        subtotal: decimalToNumber(updated.subtotal),
        logisticsCost: decimalToNumber(updated.logisticsCost),
        total: decimalToNumber(updated.total),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal update tracking.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
