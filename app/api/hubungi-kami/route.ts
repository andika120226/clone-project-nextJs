import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PartnershipPayload = {
  name?: string;
  phone?: string;
  role?: string;
  landArea?: string;
  location?: string;
  monthlyNeeds?: string;
  commodity?: string;
  notes?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PartnershipPayload;
    const name = body.name?.trim();
    const phone = body.phone?.trim();
    const role = body.role?.trim();

    if (!name || !phone || !role) {
      return NextResponse.json(
        { error: "Nama, nomor telepon, dan role wajib diisi." },
        { status: 400 },
      );
    }

    const isFarmer = role === "Petani";
    const isDistributor = role === "Distributor";

    if (isFarmer && (!body.landArea?.trim() || !body.location?.trim())) {
      return NextResponse.json(
        { error: "Petani wajib mengisi luas lahan dan lokasi." },
        { status: 400 },
      );
    }

    if (isDistributor && !body.monthlyNeeds?.trim()) {
      return NextResponse.json(
        { error: "Distributor wajib mengisi kebutuhan komoditas bulanan." },
        { status: 400 },
      );
    }

    const submission = await prisma.partnershipInquiry.create({
      data: {
        name,
        phone,
        role,
        landArea: body.landArea?.trim() || null,
        location: body.location?.trim() || null,
        monthlyNeeds: body.monthlyNeeds?.trim() || null,
        commodity: body.commodity?.trim() || null,
        notes: body.notes?.trim() || null,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          id: submission.id,
          createdAt: submission.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal menyimpan data partnership.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
