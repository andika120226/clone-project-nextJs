import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireAuth(request, ["CUSTOMER"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const isMain = body?.isMain === undefined ? undefined : Boolean(body.isMain);

    const current = await prisma.address.findFirst({
      where: { id, userId: auth.user.id },
    });

    if (!current) {
      return NextResponse.json({ error: "Alamat tidak ditemukan." }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isMain) {
        await tx.address.updateMany({
          where: { userId: auth.user!.id },
          data: { isMain: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          label: body?.label ? String(body.label).trim() : undefined,
          recipientName: body?.recipientName ? String(body.recipientName).trim() : undefined,
          phoneNumber: body?.phoneNumber ? String(body.phoneNumber).trim() : undefined,
          fullAddress: body?.fullAddress ? String(body.fullAddress).trim() : undefined,
          city: body?.city ? String(body.city).trim() : undefined,
          province: body?.province ? String(body.province).trim() : undefined,
          isMain,
        },
      });
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal update alamat.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireAuth(request, ["CUSTOMER"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const deleted = await prisma.address.deleteMany({
    where: { id, userId: auth.user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Alamat tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
