import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySignature } from "@/lib/midtrans";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_id: orderId,
      status_code: statusCode, 
      gross_amount: grossAmount,
      signature_key: signatureKey,
      transaction_status: transactionStatus,
    } = body;

    // Verify signature from Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const isValid = verifySignature(
      orderId,
      statusCode,
      grossAmount,
      serverKey,
      signatureKey
    );

    if (!isValid) {
      console.error("Invalid Midtrans signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Update payment status based on transaction status
    let paymentStatus: "SUCCESS" | "FAILED" | "PENDING" | "CANCELLED" =
      "PENDING";

    if (transactionStatus === "settlement" || transactionStatus === "capture") {
      paymentStatus = "SUCCESS";
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      paymentStatus = "FAILED";
    } else if (transactionStatus === "pending") {
      paymentStatus = "PENDING";
    }

    // Update payment record
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus,
      },
    });

    // Update order status if payment successful
    if (paymentStatus === "SUCCESS") {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "CONFIRMED",
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      // Create notification message for farmer
      await prisma.orderMessage.create({
        data: {
          orderId,
          sender: "SYSTEM",
          message: `Pesanan baru dari ${order.customerId}. Total: Rp ${order.total}. Status pembayaran: CONFIRMED`,
        },
      });

      console.log(`Payment confirmed for order ${orderId}`);
    }

    return NextResponse.json(
      {
        ok: true,
        data: updatedPayment,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Webhook processing failed";
    console.error("Payment webhook error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
