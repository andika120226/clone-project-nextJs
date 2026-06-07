import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { decimalToNumber } from "@/lib/api-serializers";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireAuth(request, ["ADMIN", "FARMER"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const stock = Number(body?.stock);

    if (Number.isNaN(stock) || stock < 0) {
      return NextResponse.json({ error: "stock tidak valid." }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: {
        id,
        farmerId: auth.user.id,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { stock },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        image: updated.image,
        stock: decimalToNumber(updated.stock),
        price: decimalToNumber(updated.price),
        farmerId: updated.farmerId,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal update stok.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
