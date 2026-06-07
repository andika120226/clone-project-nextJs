import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTransactionAndGetUrl } from "@/lib/midtrans";

function resolvePaymentMethod(value: unknown) {
  const input = String(value || "").trim().toUpperCase();
  if (input === "BCA" || input === "TRANSFER BANK" || input === "BANK_TRANSFER") return "BANK_TRANSFER";
  if (input === "PAYPAL" || input === "CASH ON DELIVERY" || input === "COD") return "E_WALLET";
  if (input === "VIRTUAL ACCOUNT") return "BANK_TRANSFER";
  if (input === "QRIS") return "QRIS";
  return "BANK_TRANSFER";
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const requestedMethod = resolvePaymentMethod(body?.paymentMethod);

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
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
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
      order.customer.name,
      order.customer.email,
      order.customer.phone || order.customer.email,
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
          method: requestedMethod as "CREDIT_CARD" | "BANK_TRANSFER" | "QRIS" | "E_WALLET",
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId,
          amount: totalAmount,
          method: requestedMethod as "CREDIT_CARD" | "BANK_TRANSFER" | "QRIS" | "E_WALLET",
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
