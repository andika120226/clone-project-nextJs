import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreateOrderItemInput = {
  productId: string;
  productName: string;
  quantityKg: number;
  unitPrice: number;
};

function generateTrackingId() {
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `TRK-${Date.now()}-${suffix}`;
}

function toSafeEmailLocalPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tenant";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId,
      customerName,
      customerEmail,
      items,
      logisticsMethod,
      vehicleCount,
      totalCost,
    } = body;

    // Validate required fields
    if (!tenantId || !customerName || !customerEmail || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedItems: CreateOrderItemInput[] = items
      .map((item: CreateOrderItemInput) => ({
        productId: String(item.productId || "").trim(),
        productName: String(item.productName || "").trim(),
        quantityKg: Number(item.quantityKg),
        unitPrice: Number(item.unitPrice),
      }))
      .filter(
        (item) =>
          item.productId.length > 0 &&
          item.productName.length > 0 &&
          Number.isFinite(item.quantityKg) &&
          item.quantityKg > 0 &&
          Number.isFinite(item.unitPrice) &&
          item.unitPrice >= 0,
      );

    if (normalizedItems.length === 0) {
      return NextResponse.json(
        { error: "Order items are invalid" },
        { status: 400 },
      );
    }

    const normalizedCustomerEmail = String(customerEmail).trim().toLowerCase();
    const computedSubtotal = normalizedItems.reduce(
      (sum, item) => sum + item.quantityKg * item.unitPrice,
      0,
    );
    const requestedTotal = Number(totalCost);
    const finalTotal = Number.isFinite(requestedTotal) && requestedTotal > 0
      ? requestedTotal
      : computedSubtotal;
    const logisticsCost = Math.max(0, finalTotal - computedSubtotal);
    const deliveryMethod = logisticsMethod === "PT_INFO_TANI" ? "LOGISTICS" : "SELF_PICKUP";
    const trackingId = generateTrackingId();

    const order = await prisma.$transaction(async (tx) => {
      const customer = await tx.user.upsert({
        where: { email: normalizedCustomerEmail },
        update: {
          name: String(customerName).trim() || "Customer InfoTani",
        },
        create: {
          name: String(customerName).trim() || "Customer InfoTani",
          email: normalizedCustomerEmail,
          passwordHash: "-",
          role: "CUSTOMER",
        },
      });

      const farmer = await tx.user.findUnique({
        where: { id: tenantId },
      });

      if (!farmer) {
        await tx.user.create({
          data: {
            id: tenantId,
            name: `Farmer ${tenantId.slice(0, 8)}`,
            email: `${toSafeEmailLocalPart(tenantId)}@tenant.infotani.local`,
            passwordHash: "-",
            role: "FARMER",
          },
        });
      }

      for (const item of normalizedItems) {
        const existingProduct = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!existingProduct) {
          await tx.product.create({
            data: {
              id: item.productId,
              farmerId: tenantId,
              name: item.productName,
              pricePerKg: item.unitPrice,
              stockKg: Math.max(1000, Math.ceil(item.quantityKg)),
              isActive: true,
            },
          });
        }
      }

      return tx.order.create({
        data: {
          trackingId,
          customerId: customer.id,
          farmerId: tenantId,
          status: "PENDING",
          deliveryMethod,
          subtotal: computedSubtotal,
          logisticsCost,
          discountPercentage: 0,
          total: finalTotal,
          notes: `Order from catalog tenant ${tenantId}. Requested vehicle count: ${Number(vehicleCount) || 1}`,
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.productId,
              quantityKg: Math.ceil(item.quantityKg),
              unitPrice: item.unitPrice,
              subtotal: item.quantityKg * item.unitPrice,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        trackingCode: order.trackingId,
        totalCost: order.total,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
