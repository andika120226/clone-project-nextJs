import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { decimalToNumber } from "@/lib/api-serializers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const farmerId = searchParams.get("farmerId") || undefined;
  const search = searchParams.get("search") || undefined;

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      farmerId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      farmer: {
        select: {
          id: true,
          name: true,
          image: true,
          gender: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ok: true,
    data: products.map((product) => ({
      ...product,
      pricePerKg: decimalToNumber(product.pricePerKg),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["FARMER"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const description = body?.description ? String(body.description).trim() : null;
    const imageUrl = body?.imageUrl ? String(body.imageUrl).trim() : null;
    const stockKg = Number(body?.stockKg ?? 0);
    const pricePerKg = Number(body?.pricePerKg ?? 0);

    if (!name) {
      return NextResponse.json({ error: "Nama produk wajib diisi." }, { status: 400 });
    }

    if (stockKg < 0 || Number.isNaN(stockKg)) {
      return NextResponse.json({ error: "stockKg tidak valid." }, { status: 400 });
    }

    if (pricePerKg <= 0 || Number.isNaN(pricePerKg)) {
      return NextResponse.json({ error: "pricePerKg harus lebih dari 0." }, { status: 400 });
    }

    const created = await prisma.product.create({
      data: {
        farmerId: auth.user.id,
        name,
        description,
        imageUrl,
        stockKg,
        pricePerKg,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        ...created,
        pricePerKg: decimalToNumber(created.pricePerKg),
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat produk.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
