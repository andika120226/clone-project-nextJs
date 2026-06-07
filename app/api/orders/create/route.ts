import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreateOrderItemInput = {
  productId: string;
  quantity: number;
  priceAtBuy: number;
};

function generateBillCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function generateUniqueBillCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const billCode = generateBillCode();
    const existing = await prisma.order.findUnique({
      where: { trackingId: billCode },
      select: { id: true },
    });

    if (!existing) {
      return billCode;
    }
  }

  throw new Error("Gagal membuat bill code unik.");
}

function toDecimal(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} tidak valid.`);
  }

  return new Prisma.Decimal(value);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customerId = String(body?.customerId || "").trim();
    const customerEmail = String(body?.customerEmail || "").trim().toLowerCase();
    const addressId = String(body?.addressId || "").trim() || null;
    const paymentMethod = String(body?.paymentMethod || "").trim();
    const isSelfPickup = Boolean(body?.isSelfPickup);
    const vehicleType = String(body?.vehicleType || "").trim();
    const items = Array.isArray(body?.items) ? (body.items as CreateOrderItemInput[]) : [];

    if (!customerId && !customerEmail) {
      return NextResponse.json({ error: "customerId atau customerEmail wajib diisi." }, { status: 400 });
    }

    if (items.length === 0) {
      return NextResponse.json({ error: "items wajib diisi minimal 1 produk." }, { status: 400 });
    }

    const totalProductPrice = Number(body?.totalProductPrice);
    const totalShippingCost = Number(body?.totalShippingCost);
    const grandTotal = Number(body?.grandTotal);

    const normalizedItems = items
      .map((item) => ({
        productId: String(item.productId || "").trim(),
        quantity: Number(item.quantity),
        priceAtBuy: Number(item.priceAtBuy),
      }))
      .filter(
        (item) =>
          item.productId.length > 0 &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0 &&
          Number.isFinite(item.priceAtBuy) &&
          item.priceAtBuy >= 0,
      );

    if (normalizedItems.length === 0) {
      return NextResponse.json({ error: "Daftar item tidak valid." }, { status: 400 });
    }

    if (!Number.isFinite(totalProductPrice) || totalProductPrice < 0) {
      return NextResponse.json({ error: "totalProductPrice tidak valid." }, { status: 400 });
    }

    if (!Number.isFinite(totalShippingCost) || totalShippingCost < 0) {
      return NextResponse.json({ error: "totalShippingCost tidak valid." }, { status: 400 });
    }

    if (!Number.isFinite(grandTotal) || grandTotal < 0) {
      return NextResponse.json({ error: "grandTotal tidak valid." }, { status: 400 });
    }

    const computedProductTotal = normalizedItems.reduce(
      (sum, item) => sum + item.quantity * item.priceAtBuy,
      0,
    );

    if (Math.abs(computedProductTotal - totalProductPrice) > 0.01) {
      return NextResponse.json({ error: "totalProductPrice tidak sesuai dengan items." }, { status: 400 });
    }

    const billCode = await generateUniqueBillCode();

    const createdOrder = await prisma.$transaction(async (tx) => {
      const customer = customerId
        ? await tx.user.findUnique({
            where: { id: customerId },
            select: { id: true, role: true },
          })
        : await tx.user.findUnique({
            where: { email: customerEmail },
            select: { id: true, role: true },
          });

      if (!customer || customer.role !== "CUSTOMER") {
        throw new Error(customerId ? "Customer tidak ditemukan." : "Customer email tidak ditemukan.");
      }

      if (addressId) {
        const address = await tx.address.findFirst({
          where: { id: addressId, userId: customerId },
          select: { id: true },
        });

        if (!address) {
          throw new Error("Alamat tidak ditemukan.");
        }
      }

      const productIds = normalizedItems.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
        },
      });

      if (products.length !== productIds.length) {
        throw new Error("Ada produk yang tidak ditemukan atau nonaktif.");
      }

      const farmerId = products[0].farmerId;
      const mixedFarmer = products.some((product) => product.farmerId !== farmerId);
      if (mixedFarmer) {
        throw new Error("Satu order hanya boleh berasal dari satu petani.");
      }

      for (const item of normalizedItems) {
        const product = products.find((candidate) => candidate.id === item.productId);
        if (!product) {
          throw new Error("Produk tidak ditemukan.");
        }

        if (Number(product.stock) < item.quantity) {
          throw new Error(`Stok ${product.name} tidak mencukupi.`);
        }
      }

      let logisticsVehicleId: string | null = null;
      let deliveryMethod: "LOGISTICS" | "SELF_PICKUP" = isSelfPickup ? "SELF_PICKUP" : "LOGISTICS";

      if (!isSelfPickup) {
        if (!vehicleType) {
          throw new Error("vehicleType wajib diisi jika bukan self pickup.");
        }

        const vehicle = await tx.logisticsVehicle.findFirst({
          where: {
            vehicleType,
            isActive: true,
          },
          select: { id: true },
        });

        if (!vehicle) {
          throw new Error("Kendaraan logistik tidak ditemukan.");
        }

        logisticsVehicleId = vehicle.id;
        deliveryMethod = "LOGISTICS";
      }

      const order = await tx.order.create({
        data: {
          trackingId: billCode,
          customerId: customer.id,
          farmerId,
          addressId,
          logisticsVehicleId,
          status: "PENDING",
          deliveryMethod,
          subtotal: toDecimal(totalProductPrice, "totalProductPrice"),
          logisticsCost: toDecimal(totalShippingCost, "totalShippingCost"),
          discountPercentage: 0,
          total: toDecimal(grandTotal, "grandTotal"),
          notes: paymentMethod ? `Payment method: ${paymentMethod}` : null,
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.productId,
              quantityKg: item.quantity,
              unitPrice: new Prisma.Decimal(item.priceAtBuy),
              subtotal: new Prisma.Decimal(item.quantity).mul(item.priceAtBuy),
            })),
          },
        },
      });

      for (const item of normalizedItems) {
        const product = products.find((candidate) => candidate.id === item.productId);
        const remainingStock = Number(product?.stock ?? 0) - item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: new Prisma.Decimal(item.quantity),
            },
            status: remainingStock < 50 ? "Menipis" : "Ready",
          },
        });
      }

      return order;
    });

    return NextResponse.json(
      {
        ok: true,
        orderId: createdOrder.id,
        billCode: createdOrder.trackingId,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat order.";
    console.error("POST /api/orders/create error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
