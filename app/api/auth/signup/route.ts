import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signAccessToken } from "@/lib/auth";

const ROLES = ["CUSTOMER", "FARMER"] as const;
const GENDERS = ["Laki-laki", "Perempuan"] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const role = String(body?.role || "").toUpperCase();
    const phone = body?.phone ? String(body.phone).trim() : null;
    const gender = body?.gender ? String(body.gender).trim() : null;
    const image = body?.image ? String(body.image).trim() : null;
    const birthDate = body?.birthDate ? new Date(body.birthDate) : null;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "name, email, password, role wajib diisi." }, { status: 400 });
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });
    }

    if (!ROLES.includes(role as (typeof ROLES)[number])) {
      return NextResponse.json({ error: "Role harus CUSTOMER atau FARMER." }, { status: 400 });
    }

    if (gender && !GENDERS.includes(gender as (typeof GENDERS)[number])) {
      return NextResponse.json({ error: "gender harus Laki-laki atau Perempuan." }, { status: 400 });
    }

    if (birthDate && Number.isNaN(birthDate.getTime())) {
      return NextResponse.json({ error: "birthDate tidak valid." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role as "CUSTOMER" | "FARMER",
        phone,
        gender,
        image,
        birthDate,
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
        createdAt: true,
      },
    });

    const token = signAccessToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    });

    return NextResponse.json({
      ok: true,
      token,
      user,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal sign-up.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
