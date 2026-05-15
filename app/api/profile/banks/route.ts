import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ["CUSTOMER", "FARMER"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const data = await prisma.bankAccount.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["CUSTOMER", "FARMER"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const bankName = String(body?.bankName || "").trim();
    const accountNumber = String(body?.accountNumber || "").trim();
    const accountHolder = String(body?.accountHolder || "").trim();

    if (!bankName || !accountNumber || !accountHolder) {
      return NextResponse.json({ error: "Semua field bank wajib diisi." }, { status: 400 });
    }

    const created = await prisma.bankAccount.create({
      data: {
        userId: auth.user.id,
        bankName,
        accountNumber,
        accountHolder,
      },
    });

    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menambah rekening.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
