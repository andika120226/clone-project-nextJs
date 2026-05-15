import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTransactionAndGetUrl } from "@/lib/midtrans";

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    // Get order with details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true },
            },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if payment already exists and is successful
    if (order.payment?.status === "SUCCESS") {
      return NextResponse.json(
        { error: "Order already paid" },
        { status: 400 }
      );
    }

    const totalAmount = Number(order.total);

    // Prepare items for Midtrans
    const items = order.items.map((item) => ({
      id: item.productId,
      price: Math.round(Number(item.unitPrice)),
      quantity: Math.round(item.quantityKg),
      name: item.product.name,
    }));

    // Create Midtrans transaction
    const { token, url } = await createTransactionAndGetUrl(
      orderId,
      totalAmount,
      order.customerId,
      order.customerId,
      order.customerId,
      items
    );

    // Save or update payment record
    if (order.payment) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          status: "PENDING",
          midtransTransactionId: token,
          midtransUrl: url,
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId,
          amount: totalAmount,
          method: "QRIS",
          status: "PENDING",
          midtransTransactionId: token,
          midtransUrl: url,
        },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          token,
          url,
          orderId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create payment";
    console.error("Payment initiation error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
