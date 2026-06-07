import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { Prisma } from '@prisma/client';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const auth = await requireAuth(req, ['ADMIN', 'FARMER']);
    if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const user = auth.user;

    const { productId } = await context.params;
    const body = await req.json();
    const { price } = body;

    if (!price || price < 0) {
      return NextResponse.json(
        { error: 'Invalid price. Price must be greater than 0' },
        { status: 400 }
      );
    }

    // Verify product belongs to user
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.farmerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update price
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        price: new Prisma.Decimal(price),
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: updated.id,
        name: updated.name,
        price: parseFloat(updated.price.toString()),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update price';
    console.error('Price update error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
