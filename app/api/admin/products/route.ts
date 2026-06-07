import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function resolveFarmerUserId(tenantId: string) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ id: tenantId }, { email: `${tenantId}@infotani.local` }],
      role: "FARMER",
    },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.user.create({
    data: {
      id: tenantId,
      name: `Petani ${tenantId.slice(-6)}`,
      email: `${tenantId}@infotani.local`,
      passwordHash: tenantId,
      role: "FARMER",
    },
    select: { id: true },
  });

  return created.id;
}

/**
 * GET /api/admin/products
 * Fetch all products for a specific farmer (tenant)
 * 
 * Query params:
 * - tenantId: string (farmer ID from session header)
 * 
 * Returns:
 * {
 *   data: Product[],
 *   summary: {
 *     totalProducts: number,
 *     lowStockCount: number
 *   }
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    // prioritize header, fallback to query param, then fallback testing id
    const tenantId = req.headers.get("x-farmer-id") || url.searchParams.get("tenantId") || "farmer-budi";
    const farmerId = await resolveFarmerUserId(tenantId);

    try {
      const { prisma } = await import("@/lib/prisma");
      // Fetch all products for this farmer
      const products = await prisma.product.findMany({
        where: { farmerId },
        orderBy: { createdAt: "desc" },
      });

      // Calculate statistics
      const lowStockCount = products.filter((p) => parseFloat(p.stock.toString()) < 50).length;

      return NextResponse.json({
        ok: true,
        data: products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          stock: parseFloat(p.stock.toString()),
          stockKg: parseFloat(p.stock.toString()),
          price: parseFloat(p.price.toString()),
          pricePerKg: parseFloat(p.price.toString()),
          image: p.image || null,
          imageUrl: p.image || null,
          stockStatus: p.status || (parseFloat(p.stock.toString()) < 50 ? "Menipis" : "Ready"),
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
        summary: {
          totalProducts: products.length,
          lowStockCount,
        },
      });
    } catch (err) {
      console.warn("Prisma unavailable in /api/admin/products; returning empty list", err);
      return NextResponse.json({ ok: true, data: [], summary: { totalProducts: 0, lowStockCount: 0 } });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil data produk";
    console.error("GET /api/admin/products error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/products
 * Create a new product for the farmer
 * 
 * Body:
 * {
 *   name: string,
 *   stockKg: number,
 *   pricePerKg: number,
 *   imageUrl?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Accept header farmer id; fallback to testing id to avoid crashes during local testing
    const tenantId = req.headers.get("x-farmer-id") || "farmer-budi";
    const farmerId = await resolveFarmerUserId(tenantId);

    const body = await req.json();
    const { name, stock, stockKg, price, pricePerKg, description, image, imageUrl } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length < 3) {
      return NextResponse.json(
        { error: "Nama produk minimal 3 karakter" },
        { status: 400 },
      );
    }
    const resolvedStock = Number(stockKg ?? stock ?? 0);
    const resolvedPrice = Number(pricePerKg ?? price ?? 0);

    if (typeof resolvedStock !== "number" || resolvedStock < 0 || Number.isNaN(resolvedStock)) {
      return NextResponse.json({ error: "Stok tidak boleh negatif" }, { status: 400 });
    }

    if (typeof resolvedPrice !== "number" || resolvedPrice < 0 || Number.isNaN(resolvedPrice)) {
      return NextResponse.json({ error: "Harga tidak boleh negatif" }, { status: 400 });
    }

    // enforce .webp extension for images
    let imageWebp: string | null = null;
    const resolvedImage = typeof imageUrl === "string" ? imageUrl : image;
    if (resolvedImage && typeof resolvedImage === "string") {
      if (!resolvedImage.endsWith(".webp")) {
        // try to replace extension if present
        imageWebp = resolvedImage.replace(/\.(jpg|jpeg|png)$/i, ".webp");
      } else {
        imageWebp = resolvedImage;
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        farmerId,
        name: name.trim(),
        description: typeof description === "string" ? description.trim() : null,
        stock: parseFloat(resolvedStock.toFixed(3)),
        price: parseFloat(resolvedPrice.toFixed(2)),
        image: imageWebp || null,
        status: parseFloat(resolvedStock.toFixed(3)) < 50 ? "Menipis" : "Ready",
      },
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          id: product.id,
          name: product.name,
          description: product.description,
          stock: parseFloat(product.stock.toString()),
          stockKg: parseFloat(product.stock.toString()),
          price: parseFloat(product.price.toString()),
          pricePerKg: parseFloat(product.price.toString()),
          image: product.image || null,
          imageUrl: product.image || null,
          stockStatus: product.status,
          createdAt: product.createdAt,
        },
        message: `Produk '${product.name}' berhasil ditambahkan`,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menambahkan produk";
    console.error("POST /api/admin/products error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
