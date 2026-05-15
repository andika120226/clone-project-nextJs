import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthRole, verifyAccessToken } from "@/lib/auth";

export function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  return authHeader.slice(7).trim();
}

export async function getCurrentUser(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    if (!user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function requireAuth(request: NextRequest, allowedRoles?: AuthRole[]) {
  const user = await getCurrentUser(request);
  if (!user) {
    return { error: "Unauthorized", status: 401 as const, user: null };
  }

  if (allowedRoles && !allowedRoles.includes(user.role as AuthRole)) {
    return { error: "Forbidden", status: 403 as const, user: null };
  }

  return { error: null, status: 200 as const, user };
}
