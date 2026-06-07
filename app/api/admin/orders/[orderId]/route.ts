import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus } from "@prisma/client";
import { decimalToNumber } from "@/lib/api-serializers";

const VALID_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

function resolveTenantId(req: NextRequest) {
  return req.headers.get("x-farmer-id")?.trim() || "";
}

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function loadOrder(orderId: string, tenantId: string) {
  const prisma = await getPrisma();
  return prisma.order.findFirst({
    where: { id: orderId, farmerId: tenantId },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      items: { include: { product: { select: { id: true, name: true } } } },
      payment: true,
      messages: { orderBy: { createdAt: "desc" } },
      trackingPoints: { orderBy: { recordedAt: "desc" } },
      logisticsVehicle: true,
      address: true,
    },
  });
}

function serializeOrder(order: NonNullable<Awaited<ReturnType<typeof loadOrder>>>) {
  return {
    ...order,
    subtotal: decimalToNumber(order.subtotal),
    logisticsCost: decimalToNumber(order.logisticsCost),
    total: decimalToNumber(order.total),
    items: order.items.map((item) => ({
      ...item,
      unitPrice: decimalToNumber(item.unitPrice),
      subtotal: decimalToNumber(item.subtotal),
    })),
    logisticsVehicle: order.logisticsVehicle
      ? {
          ...order.logisticsVehicle,
          capacityTon: decimalToNumber(order.logisticsVehicle.capacityTon),
          price: decimalToNumber(order.logisticsVehicle.price),
        }
      : null,
  };
}

export async function GET(req: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return NextResponse.json({ error: "Header x-farmer-id wajib diisi" }, { status: 400 });
    }

    const { orderId } = await context.params;
    const order = await loadOrder(orderId, tenantId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: serializeOrder(order) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return NextResponse.json({ error: "Header x-farmer-id wajib diisi" }, { status: 400 });
    }

    const { orderId } = await context.params;
    const body = await req.json();
    const status = typeof body?.status === "string" ? body.status.trim().toUpperCase() : "";
    const message = body?.message ? String(body.message).trim() : "";
    const truckLocationLabel = body?.truckLocationLabel ? String(body.truckLocationLabel).trim() : "";
    const currentLat = body?.currentLat !== undefined ? Number(body.currentLat) : undefined;
    const currentLng = body?.currentLng !== undefined ? Number(body.currentLng) : undefined;
    const estimatedArrival = body?.estimatedArrival ? new Date(body.estimatedArrival) : undefined;

    if (!VALID_STATUSES.includes(status as OrderStatus)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    if (estimatedArrival && Number.isNaN(estimatedArrival.getTime())) {
      return NextResponse.json({ error: "estimatedArrival tidak valid" }, { status: 400 });
    }

    if ((currentLat !== undefined && Number.isNaN(currentLat)) || (currentLng !== undefined && Number.isNaN(currentLng))) {
      return NextResponse.json({ error: "Koordinat truk tidak valid" }, { status: 400 });
    }

    const prisma = await getPrisma();
    const existing = await prisma.order.findFirst({ where: { id: orderId, farmerId: tenantId } });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          status: status as OrderStatus,
          currentLat,
          currentLng,
          estimatedArrival,
        },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
          payment: true,
          messages: { orderBy: { createdAt: "desc" } },
          trackingPoints: { orderBy: { recordedAt: "desc" } },
          logisticsVehicle: true,
          address: true,
        },
      });

      const resolvedTruckLocation = truckLocationLabel || order.trackingPoints[0]?.note || "Armada bergerak";

      if (message) {
        await tx.orderMessage.create({
          data: {
            orderId: order.id,
            sender: "ADMIN",
            message,
          },
        });
      }

      if (currentLat !== undefined || currentLng !== undefined || truckLocationLabel) {
        await tx.trackingPoint.create({
          data: {
            orderId: order.id,
            latitude: currentLat ?? order.currentLat ?? 0,
            longitude: currentLng ?? order.currentLng ?? 0,
            note: resolvedTruckLocation,
          },
        });
      }

      return tx.order.findFirstOrThrow({
        where: { id: order.id, farmerId: tenantId },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
          payment: true,
          messages: { orderBy: { createdAt: "desc" } },
          trackingPoints: { orderBy: { recordedAt: "desc" } },
          logisticsVehicle: true,
          address: true,
        },
      });
    });

    return NextResponse.json({ ok: true, data: serializeOrder(updated), message: "Order berhasil diperbarui" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update order";
    console.error("PATCH /api/admin/orders/[orderId] error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  return PATCH(req, context);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return NextResponse.json({ error: "Header x-farmer-id wajib diisi" }, { status: 400 });
    }

    const { orderId } = await context.params;
    const prisma = await getPrisma();

    const existing = await prisma.order.findFirst({ where: { id: orderId, farmerId: tenantId } });
    if (!existing) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    await prisma.order.delete({
      where: { id: orderId },
    });

    return NextResponse.json({ ok: true, message: "Transaksi berhasil dihapus" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete order";
    console.error("DELETE /api/admin/orders/[orderId] error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
