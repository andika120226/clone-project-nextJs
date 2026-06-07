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
      id: product.id,
      name: product.name,
      description: product.description,
      image: product.image,
      stock: decimalToNumber(product.stock),
      price: decimalToNumber(product.price),
      farmer: product.farmer,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      isActive: product.isActive,
      status: product.status,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, ["ADMIN", "FARMER"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const description = body?.description ? String(body.description).trim() : null;
    const image = body?.image ? String(body.image).trim() : null;
    const stock = Number(body?.stock ?? 0);
    const price = Number(body?.price ?? 0);

    if (!name) {
      return NextResponse.json({ error: "Nama produk wajib diisi." }, { status: 400 });
    }

    if (stock < 0 || Number.isNaN(stock)) {
      return NextResponse.json({ error: "stock tidak valid." }, { status: 400 });
    }

    if (price <= 0 || Number.isNaN(price)) {
      return NextResponse.json({ error: "price harus lebih dari 0." }, { status: 400 });
    }

    const created = await prisma.product.create({
      data: {
        farmerId: auth.user.id,
        name,
        description,
        image,
        stock,
        price,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: created.id,
        name: created.name,
        description: created.description,
        image: created.image,
        stock: decimalToNumber(created.stock),
        price: decimalToNumber(created.price),
        farmerId: created.farmerId,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat produk.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
