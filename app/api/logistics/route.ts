import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { decimalToNumber } from "@/lib/api-serializers";

export async function GET() {
  const data = await prisma.logisticsVehicle.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ok: true,
    data: data.map((item) => ({
      ...item,
      capacityTon: decimalToNumber(item.capacityTon),
      price: decimalToNumber(item.price),
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
    const vehicleType = String(body?.vehicleType || "").trim();
    const capacityTon = Number(body?.capacityTon ?? 0);
    const price = Number(body?.price ?? 0);

    if (!name || !vehicleType) {
      return NextResponse.json({ error: "name dan vehicleType wajib diisi." }, { status: 400 });
    }

    if (capacityTon <= 0 || Number.isNaN(capacityTon)) {
      return NextResponse.json({ error: "capacityTon tidak valid." }, { status: 400 });
    }

    if (price < 0 || Number.isNaN(price)) {
      return NextResponse.json({ error: "price tidak valid." }, { status: 400 });
    }

    const created = await prisma.logisticsVehicle.create({
      data: {
        name,
        vehicleType,
        capacityTon,
        price,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        ...created,
        capacityTon: decimalToNumber(created.capacityTon),
        price: decimalToNumber(created.price),
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menambah data logistik.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
