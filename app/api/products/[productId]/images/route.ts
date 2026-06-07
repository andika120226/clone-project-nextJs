import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params;
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPEG, PNG, or WebP" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum 5MB allowed" },
        { status: 400 }
      );
    }

    // Convert file to base64 for storage
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Create product image record
    const productImage = await prisma.productImage.create({
      data: {
        productId,
        imageUrl: dataUrl,
        isPrimary: true,
      },
    });

    // Update product image field
    await prisma.product.update({
      where: { id: productId },
      data: { image: dataUrl },
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          imageId: productImage.id,
          imageUrl: dataUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

// GET existing images
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params;

    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { isPrimary: "desc" },
    });

    return NextResponse.json({
      ok: true,
      data: images,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch images";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
