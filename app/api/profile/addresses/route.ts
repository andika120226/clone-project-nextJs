import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ["CUSTOMER"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const data = await prisma.address.findMany({
    where: { userId: auth.user.id },
    orderBy: [{ isMain: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ ok: true, data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["CUSTOMER"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const label = String(body?.label || "").trim();
    const recipientName = String(body?.recipientName || "").trim();
    const phoneNumber = String(body?.phoneNumber || "").trim();
    const fullAddress = String(body?.fullAddress || "").trim();
    const city = String(body?.city || "").trim();
    const province = String(body?.province || "").trim();
    const isMain = Boolean(body?.isMain);

    if (!label || !recipientName || !phoneNumber || !fullAddress || !city || !province) {
      return NextResponse.json({ error: "Semua field alamat wajib diisi." }, { status: 400 });
    }

    const created = await prisma.$transaction(async (tx) => {
      if (isMain) {
        await tx.address.updateMany({
          where: { userId: auth.user!.id },
          data: { isMain: false },
        });
      }

      return tx.address.create({
        data: {
          userId: auth.user!.id,
          label,
          recipientName,
          phoneNumber,
          fullAddress,
          city,
          province,
          isMain,
        },
      });
    });

    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menambah alamat.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
