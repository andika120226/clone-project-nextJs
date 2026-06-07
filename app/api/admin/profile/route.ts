import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildGoogleMapsFallbackUrl,
  normalizeGoogleMapsEmbedUrl,
} from "@/lib/google-maps";

function resolveTenantId(request: NextRequest) {
  return request.headers.get("x-farmer-id")?.trim() || "";
}

function defaultProfile(tenantId: string) {
  return {
    tenantId,
    farmerName: "",
    profilePhoto: null,
    catalogBanner: null,
    description: "",
    catalogMapUrl: null,
    latitude: 0,
    longitude: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bankName: "",
    accountNumber: "",
  };
}

async function resolveCatalogMapUrl(inputUrl: string | null, latitude: number, longitude: number) {
  const normalized = normalizeGoogleMapsEmbedUrl(inputUrl);
  if (normalized) {
    return normalized;
  }

  if (!inputUrl?.trim()) {
    return null;
  }

  try {
    const response = await fetch(inputUrl, { redirect: "follow" });
    const resolved = normalizeGoogleMapsEmbedUrl(response.url);
    return resolved ?? buildGoogleMapsFallbackUrl(latitude, longitude);
  } catch {
    return buildGoogleMapsFallbackUrl(latitude, longitude);
  }
}

export async function GET(request: NextRequest) {
  const tenantId = resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: "Header x-farmer-id wajib diisi." }, { status: 400 });
  }

  const profile = await prisma.farmerProfile.findUnique({
    where: { tenantId },
  });

  const bankAccount = await prisma.bankAccount.findFirst({
    where: { userId: tenantId },
  });

  const history = profile
    ? await prisma.farmerProfileHistory.findMany({
        where: { tenantId, profileId: profile.id },
        orderBy: { createdAt: "desc" },
        take: 8,
      })
    : [];

  if (!profile) {
    return NextResponse.json({
      ok: true,
      data: {
        ...defaultProfile(tenantId),
        bankName: bankAccount?.bankName || "",
        accountNumber: bankAccount?.accountNumber || "",
      },
      history
    });
  }

  const resolvedProfile = {
    ...profile,
    catalogMapUrl: await resolveCatalogMapUrl(profile.catalogMapUrl, profile.latitude, profile.longitude),
    bankName: bankAccount?.bankName || "",
    accountNumber: bankAccount?.accountNumber || "",
  };

  return NextResponse.json({ ok: true, data: resolvedProfile, history });
}

export async function PATCH(request: NextRequest) {
  const tenantId = resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: "Header x-farmer-id wajib diisi." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const farmerName = String(body?.farmerName || "").trim();
    const profilePhoto = body?.profilePhoto ? String(body.profilePhoto).trim() : null;
    const catalogBanner = body?.catalogBanner ? String(body.catalogBanner).trim() : null;
    const description = body?.description ? String(body.description).trim() : null;
    const catalogMapUrl = body?.catalogMapUrl ? String(body.catalogMapUrl).trim() : null;
    const latitude = Number(body?.latitude ?? 0);
    const longitude = Number(body?.longitude ?? 0);
    const bankName = body?.bankName ? String(body.bankName).trim() : "";
    const accountNumber = body?.accountNumber ? String(body.accountNumber).trim() : "";

    if (!farmerName) {
      return NextResponse.json({ error: "farmerName wajib diisi." }, { status: 400 });
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ error: "Koordinat lokasi tidak valid." }, { status: 400 });
    }

    const previous = await prisma.farmerProfile.findUnique({ where: { tenantId } });
    const resolvedCatalogMapUrl = await resolveCatalogMapUrl(catalogMapUrl, latitude, longitude);

    const profile = await prisma.farmerProfile.upsert({
      where: { tenantId },
      update: {
        farmerName,
        profilePhoto,
        catalogBanner,
        description,
        catalogMapUrl: resolvedCatalogMapUrl,
        latitude,
        longitude,
      },
      create: {
        tenantId,
        farmerName,
        profilePhoto,
        catalogBanner,
        description,
        catalogMapUrl: resolvedCatalogMapUrl,
        latitude,
        longitude,
      },
    });

    // Save/update bank settings inside BankAccount table
    let savedBank = null;
    if (bankName || accountNumber) {
      const existingBank = await prisma.bankAccount.findFirst({ where: { userId: tenantId } });
      if (existingBank) {
        savedBank = await prisma.bankAccount.update({
          where: { id: existingBank.id },
          data: {
            bankName: bankName || existingBank.bankName,
            accountNumber: accountNumber || existingBank.accountNumber,
            accountHolder: farmerName || existingBank.accountHolder || "Petani",
          }
        });
      } else {
        savedBank = await prisma.bankAccount.create({
          data: {
            userId: tenantId,
            bankName: bankName || "BCA",
            accountNumber: accountNumber || "",
            accountHolder: farmerName || "Petani",
          }
        });
      }
    } else {
      savedBank = await prisma.bankAccount.findFirst({ where: { userId: tenantId } });
    }

    const resolvedProfile = {
      ...profile,
      bankName: savedBank?.bankName || "",
      accountNumber: savedBank?.accountNumber || "",
    };

    const changedFields: string[] = [];
    if (!previous || previous.farmerName !== farmerName) changedFields.push("Nama Petani");
    if (!previous || previous.profilePhoto !== profilePhoto) changedFields.push("Foto Profil");
    if (!previous || previous.catalogBanner !== catalogBanner) changedFields.push("Banner Katalog");
    if (!previous || previous.description !== description) changedFields.push("Deskripsi");
    if (!previous || previous.catalogMapUrl !== resolvedCatalogMapUrl) changedFields.push("Google Maps");
    if (!previous || previous.latitude !== latitude || previous.longitude !== longitude) changedFields.push("Lokasi");

    await prisma.farmerProfileHistory.create({
      data: {
        tenantId,
        profileId: profile.id,
        changedBy: tenantId,
        summary: changedFields.length > 0 ? `Perubahan: ${changedFields.join(", ")}` : "Simpan ulang profil tanpa perubahan field.",
        snapshot: {
          farmerName,
          profilePhoto,
          catalogBanner,
          description,
          catalogMapUrl: resolvedCatalogMapUrl,
          latitude,
          longitude,
          bankName: resolvedProfile.bankName,
          accountNumber: resolvedProfile.accountNumber,
        },
      },
    });

    const history = await prisma.farmerProfileHistory.findMany({
      where: { tenantId, profileId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    return NextResponse.json({ ok: true, data: resolvedProfile, history });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan profil petani.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}