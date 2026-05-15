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
  const auth = await requireAuth(request, ["CUSTOMER", "FARMER"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const orders = await prisma.order.findMany({
    where:
      auth.user.role === "CUSTOMER"
        ? { customerId: auth.user.id }
        : { farmerId: auth.user.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      },
      logisticsVehicle: true,
      customer: {
        select: { id: true, name: true, email: true },
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
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["CUSTOMER"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const items = Array.isArray(body?.items) ? (body.items as CreateOrderItem[]) : [];
    const addressId = body?.addressId ? String(body.addressId) : null;
    const customerBankAccountId = body?.customerBankAccountId ? String(body.customerBankAccountId) : null;
    const logisticsVehicleId = body?.logisticsVehicleId ? String(body.logisticsVehicleId) : null;
    const notes = body?.notes ? String(body.notes).trim() : null;
    const estimatedArrival = body?.estimatedArrival ? new Date(body.estimatedArrival) : null;

    if (items.length === 0) {
      return NextResponse.json({ error: "items wajib diisi minimal 1 produk." }, { status: 400 });
    }

    if (estimatedArrival && Number.isNaN(estimatedArrival.getTime())) {
      return NextResponse.json({ error: "estimatedArrival tidak valid." }, { status: 400 });
    }

    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Ada produk yang tidak ditemukan atau nonaktif." }, { status: 404 });
    }

    const farmerId = products[0].farmerId;
    const mixedFarmer = products.some((product) => product.farmerId !== farmerId);
    if (mixedFarmer) {
      return NextResponse.json({ error: "Satu order hanya boleh dari satu petani." }, { status: 400 });
    }

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
      }
      if (!Number.isInteger(item.quantityKg) || item.quantityKg <= 0) {
        return NextResponse.json({ error: "quantityKg harus bilangan bulat lebih dari 0." }, { status: 400 });
      }
      if (product.stockKg < item.quantityKg) {
        return NextResponse.json({ error: `Stok ${product.name} tidak mencukupi.` }, { status: 400 });
      }
    }

    if (addressId) {
      const address = await prisma.address.findFirst({
        where: { id: addressId, userId: auth.user.id },
      });
      if (!address) {
        return NextResponse.json({ error: "Alamat tidak ditemukan." }, { status: 404 });
      }
    }

    if (customerBankAccountId) {
      const customerBank = await prisma.bankAccount.findFirst({
        where: { id: customerBankAccountId, userId: auth.user.id },
      });
      if (!customerBank) {
        return NextResponse.json({ error: "Rekening customer tidak ditemukan." }, { status: 404 });
      }
    }

    let logisticsCost = new Prisma.Decimal(0);
    if (logisticsVehicleId) {
      const logistics = await prisma.logisticsVehicle.findUnique({ where: { id: logisticsVehicleId } });
      if (!logistics) {
        return NextResponse.json({ error: "Data kendaraan logistik tidak ditemukan." }, { status: 404 });
      }
      logisticsCost = logistics.price;
    }

    const farmerPrimaryBank = await prisma.bankAccount.findFirst({
      where: { userId: farmerId },
      orderBy: { createdAt: "asc" },
    });

    const subtotal = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return sum.add(product.pricePerKg.mul(item.quantityKg));
    }, new Prisma.Decimal(0));

    const total = subtotal.add(logisticsCost);

    const created = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          trackingId: createTrackingCode(),
          customerId: auth.user!.id,
          farmerId,
          logisticsVehicleId,
          customerBankAccountId,
          farmerBankAccountId: farmerPrimaryBank?.id || null,
          addressId,
          subtotal,
          logisticsCost,
          total,
          estimatedArrival,
          notes,
        },
      });

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)!;
        const unitPrice = product.pricePerKg;
        const lineSubtotal = unitPrice.mul(item.quantityKg);

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantityKg: item.quantityKg,
            unitPrice,
            subtotal: lineSubtotal,
          },
        });

        await tx.product.update({
          where: { id: product.id },
          data: { stockKg: { decrement: item.quantityKg } },
        });
      }

      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: {
          items: true,
        },
      });
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
