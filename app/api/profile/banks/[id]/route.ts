import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireAuth(request, ["CUSTOMER", "FARMER"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.bankAccount.findFirst({
      where: { id, userId: auth.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Rekening tidak ditemukan." }, { status: 404 });
    }

    const body = await request.json();
    const updated = await prisma.bankAccount.update({
      where: { id },
      data: {
        bankName: body?.bankName ? String(body.bankName).trim() : undefined,
        accountNumber: body?.accountNumber ? String(body.accountNumber).trim() : undefined,
        accountHolder: body?.accountHolder ? String(body.accountHolder).trim() : undefined,
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal update rekening.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireAuth(request, ["CUSTOMER", "FARMER"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  const deleted = await prisma.bankAccount.deleteMany({
    where: { id, userId: auth.user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Rekening tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
