import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PaymentStatus } from "@prisma/client";

/**
 * POST /api/payments
 * Called after customer completes payment in Midtrans or manual transfer.
 * Updates order status and creates farmer notification.
 *
 * Body:
 * {
 *   orderId: string;
 *   paymentMethod: "CREDIT_CARD" | "BANK_TRANSFER" | "QRIS" | "E_WALLET";
 *   transactionId?: string;  // Midtrans transaction ID or custom ref
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, paymentMethod, transactionId } = body;

    // Validate required fields
    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "orderId wajib diisi" }, { status: 400 });
    }

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { name: true, email: true } },
        items: {
          include: { product: { select: { name: true } } },
        },
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    // Block only if payment has been finalized before.
    if (order.payment?.status === "SUCCESS") {
      return NextResponse.json(
        { error: "Order sudah diproses sebelumnya" },
        { status: 400 },
      );
    }

    // Update/Create payment record
    const paymentStatus: PaymentStatus = "SUCCESS";
    const validPaymentMethods = ["CREDIT_CARD", "BANK_TRANSFER", "QRIS", "E_WALLET"];
    const method = validPaymentMethods.includes(paymentMethod) ? paymentMethod : "BANK_TRANSFER";

    if (order.payment) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          status: paymentStatus,
          method,
          ...(transactionId ? { midtransTransactionId: transactionId } : {}),
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId,
          amount: order.total,
          status: paymentStatus,
          method,
          ...(transactionId ? { midtransTransactionId: transactionId } : {}),
        },
      });
    }

    // Update order status to CONFIRMED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
      },
      include: {
        customer: { select: { name: true, email: true } },
        items: {
          include: { product: { select: { name: true } } },
        },
      },
    });

    // Create notification message for farmer
    const itemList = updatedOrder.items
      .map(
        (item) =>
          `${item.product.name} (${item.quantityKg} kg @ Rp ${Number(item.unitPrice).toLocaleString("id-ID")})`,
      )
      .join(", ");

    const notificationMessage = `
Pesanan baru dari ${updatedOrder.customer.name} telah dikonfirmasi.
Email: ${updatedOrder.customer.email}
Produk: ${itemList}
Total: Rp ${Number(updatedOrder.total).toLocaleString("id-ID")}
Metode: ${method}
Status: DIKONFIRMASI
    `.trim();

    await prisma.orderMessage.create({
      data: {
        orderId,
        sender: "SYSTEM",
        message: notificationMessage,
        status: "UNREAD",
      },
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          orderId: updatedOrder.id,
          status: updatedOrder.status,
          paymentStatus,
          message: "Pembayaran berhasil dikonfirmasi. Notifikasi dikirim ke petani.",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memproses pembayaran";
    console.error("Payment processing error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/payments?orderId=...
 * Get payment status for order
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "orderId query param wajib" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      return NextResponse.json(
        { ok: true, data: null, message: "Belum ada record pembayaran" },
        { status: 200 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount.toNumber(),
        method: payment.method,
        status: payment.status,
        midtransTransactionId: payment.midtransTransactionId,
        paidAt: payment.paidAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal fetch payment";
    console.error("Fetch payment error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
