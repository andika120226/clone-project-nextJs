"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { getCurrentSession } from "@/lib/customer-store";

type BuyNowButtonProps = {
  productId: string;
};

export default function BuyNowButton({ productId }: BuyNowButtonProps) {
  const router = useRouter();

  function handleBuy() {
    const session = getCurrentSession();
    const checkoutUrl = `/checkout?productId=${encodeURIComponent(productId)}`;

    if (!session) {
      router.push(`/auth/login?next=${encodeURIComponent(checkoutUrl)}`);
      return;
    }

    router.push(checkoutUrl);
  }

  return (
    <button
      type="button"
      onClick={handleBuy}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
    >
      <ShoppingCart className="h-4 w-4" />
      Beli
    </button>
  );
}
