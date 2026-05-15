import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAccessToken, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "email dan password wajib diisi." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
    }

    const token = signAccessToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    });

    return NextResponse.json({
      ok: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        birthDate: user.birthDate,
        image: user.image,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal login.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
