import { NextResponse, NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body.token as string;

    if (!token) {
      return NextResponse.json(
        { error: "Token wajib diisi." },
        { status: 400 }
      );
    }

    try {
      const payload = verifyAccessToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "User tidak ditemukan di database." },
          { status: 401 }
        );
      }

      return NextResponse.json({
        ok: true,
        userId: user.id,
        email: user.email,
        role: user.role,
      });
    } catch {
      return NextResponse.json(
        { error: "Token tidak valid atau sudah expired." },
        { status: 401 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal verifikasi token.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
