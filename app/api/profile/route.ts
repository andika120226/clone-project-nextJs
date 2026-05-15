import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

const GENDERS = ["Laki-laki", "Perempuan"] as const;

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      gender: true,
      birthDate: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ ok: true, data: user });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const nextName = body?.name ? String(body.name).trim() : undefined;
    const nextPhone = body?.phone ? String(body.phone).trim() : undefined;
    const nextGender = body?.gender ? String(body.gender).trim() : undefined;
    const nextImage = body?.image ? String(body.image).trim() : undefined;
    const nextBirthDate = body?.birthDate ? new Date(body.birthDate) : undefined;

    if (nextGender && !GENDERS.includes(nextGender as (typeof GENDERS)[number])) {
      return NextResponse.json({ error: "gender harus Laki-laki atau Perempuan." }, { status: 400 });
    }

    if (nextBirthDate && Number.isNaN(nextBirthDate.getTime())) {
      return NextResponse.json({ error: "birthDate tidak valid." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        name: nextName,
        phone: nextPhone,
        gender: nextGender,
        image: nextImage,
        birthDate: nextBirthDate,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        gender: true,
        birthDate: true,
        image: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal update profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
