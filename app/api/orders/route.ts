import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { decimalToNumber } from "@/lib/api-serializers";

type CreateOrderItem = {
  productId: string;
  quantityKg: number;
};

function createTrackingCode() {
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `TRK-${Date.now()}-${rand}`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["ADMIN", "CUSTOMER", "FARMER"]);
    if (!auth.user) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const user = auth.user;
    const isAdmin = user.role === "ADMIN";

    const orders = await prisma.order.findMany({
      where: isAdmin
        ? {}
        : user.role === "CUSTOMER"
          ? { customerId: user.id }
          : { farmerId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
                stock: true,
              },
            },
          },
        },
        logisticsVehicle: true,
        address: true,
        payment: true,
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        farmer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      data: orders.map((order) => ({
        ...order,
        subtotal: decimalToNumber(order.subtotal),
        logisticsCost: decimalToNumber(order.logisticsCost),
        total: decimalToNumber(order.total),
        payment: order.payment
          ? {
              ...order.payment,
              amount: decimalToNumber(order.payment.amount),
            }
          : null,
        items: order.items.map((item) => ({
          ...item,
          unitPrice: decimalToNumber(item.unitPrice),
          subtotal: decimalToNumber(item.subtotal),
          product: item.product
            ? { id: item.product.id, name: item.product.name, image: item.product.image, price: decimalToNumber(item.product.price) }
            : null,
        })),
        logisticsVehicle: order.logisticsVehicle
          ? {
              ...order.logisticsVehicle,
              capacityTon: decimalToNumber(order.logisticsVehicle.capacityTon),
              price: decimalToNumber(order.logisticsVehicle.price),
            }
          : null,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil daftar pesanan";
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ["CUSTOMER"]);
    if (!auth.user) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    const user = auth.user;

    const body = await request.json();
    const items = Array.isArray(body?.items) ? (body.items as CreateOrderItem[]) : [];
    const addressId = body?.addressId ? String(body.addressId) : null;
    const customerBankAccountId = body?.customerBankAccountId ? String(body.customerBankAccountId) : null;
    const logisticsVehicleId = body?.logisticsVehicleId ? String(body.logisticsVehicleId) : null;
    const logisticsCost = Number(body?.logisticsCost ?? 0);
    const notes = body?.notes ? String(body.notes).trim() : null;
    const estimatedArrival = body?.estimatedArrival ? new Date(body.estimatedArrival) : null;

    if (items.length === 0) {
      return NextResponse.json({ ok: false, error: "items wajib diisi minimal 1 produk." }, { status: 400 });
    }

    if (estimatedArrival && Number.isNaN(estimatedArrival.getTime())) {
      return NextResponse.json({ ok: false, error: "estimatedArrival tidak valid." }, { status: 400 });
    }

    if (!Number.isFinite(logisticsCost) || logisticsCost < 0) {
      return NextResponse.json({ ok: false, error: "logisticsCost tidak valid." }, { status: 400 });
    }

    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ ok: false, error: "Ada produk yang tidak ditemukan atau nonaktif." }, { status: 404 });
    }

    const farmerId = products[0].farmerId;
    const mixedFarmer = products.some((product) => product.farmerId !== farmerId);
    if (mixedFarmer) {
      return NextResponse.json({ ok: false, error: "Satu order hanya boleh dari satu petani." }, { status: 400 });
    }

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json({ ok: false, error: "Produk tidak ditemukan." }, { status: 404 });
      }
      if (!Number.isFinite(item.quantityKg) || item.quantityKg <= 0) {
        return NextResponse.json({ ok: false, error: "quantityKg harus angka lebih dari 0." }, { status: 400 });
      }
      const normalizedQuantityKg = Math.max(1, Math.ceil(item.quantityKg));
      if (Number(product.stock) < normalizedQuantityKg) {
        return NextResponse.json({ ok: false, error: `Stok ${product.name} tidak mencukupi.` }, { status: 400 });
      }
    }

    const logisticsCostDecimal = new Prisma.Decimal(logisticsCost);

    const subtotal = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const normalizedQuantityKg = Math.max(1, Math.ceil(item.quantityKg));
      return sum.add(new Prisma.Decimal(product.price.toString()).mul(normalizedQuantityKg));
    }, new Prisma.Decimal(0));

    const total = body?.total !== undefined ? new Prisma.Decimal(Number(body.total)) : subtotal.add(logisticsCostDecimal);

    const orderNotes = [
      notes,
      body?.paymentMethod ? `Payment method: ${String(body.paymentMethod)}` : null,
      body?.logisticsLabel ? `Logistics: ${String(body.logisticsLabel)}` : null,
    ].filter(Boolean).join("\n") || null;

    const created = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          trackingId: createTrackingCode(),
          customerId: user.id,
          farmerId,
          logisticsVehicleId: logisticsVehicleId || null,
          customerBankAccountId,
          farmerBankAccountId: null,
          addressId,
          status: "CONFIRMED",
          deliveryMethod: 'LOGISTICS',
          discountPercentage: 0,
          subtotal,
          logisticsCost: logisticsCostDecimal,
          total,
          estimatedArrival,
          notes: orderNotes,
        },
      });

      await tx.orderMessage.create({
        data: {
          orderId: order.id,
          sender: "SYSTEM",
          message: "Pesanan diterima dari katalog customer.",
          status: "UNREAD",
        },
      });

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)!;
        const normalizedQuantityKg = Math.max(1, Math.ceil(item.quantityKg));
        const unitPrice = new Prisma.Decimal(product.price.toString());
        const lineSubtotal = unitPrice.mul(normalizedQuantityKg);

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantityKg: normalizedQuantityKg,
            unitPrice,
            subtotal: lineSubtotal,
          },
        });

        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: normalizedQuantityKg } },
        });
      }

      return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } });
    });

    return NextResponse.json({
      ok: true,
      data: {
        ...created,
        subtotal: decimalToNumber(created.subtotal),
        logisticsCost: decimalToNumber(created.logisticsCost),
        total: decimalToNumber(created.total),
        items: created.items.map((item) => ({
          ...item,
          unitPrice: decimalToNumber(item.unitPrice),
          subtotal: decimalToNumber(item.subtotal),
        })),
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat order.";
    console.error("POST /api/orders error:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
