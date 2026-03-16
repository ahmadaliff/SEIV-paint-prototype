"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { useAuthStore, useCartStore } from "@/store";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { formatRupiah } from "@/lib/utils";
import { ShoppingCart, Star } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const { role } = useAuthStore();
  const { addToCart, isAddingToCart } = useCartStore();
  
  // The price provided in product.price already includes the role-based discount from the store
  const finalPrice = product.price;
  const originalPrice = product.variants[0]?.original_price || finalPrice;
  const hasDiscount = originalPrice > finalPrice;
  const isDistributor = role.startsWith('DISTRIBUTOR');
  
  // Mapping role to badge text
  const tierMap: Record<string, { label: string; discount: string }> = {
    DISTRIBUTOR_BRONZE: { label: 'Bronze', discount: '10%' },
    DISTRIBUTOR_SILVER: { label: 'Silver', discount: '15%' },
    DISTRIBUTOR_GOLD: { label: 'Gold', discount: '20%' },
  };
  const tierInfo = tierMap[role];

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      <Link href={`/products/${product.id}`} className="relative aspect-square overflow-hidden bg-slate-100 p-4 block">
        <div className="absolute top-2 left-2 z-10">
          {hasDiscount && <Badge variant="destructive">-{Math.round(((originalPrice - finalPrice) / originalPrice) * 100)}%</Badge>}
          {!hasDiscount && tierInfo && <Badge variant="secondary">{tierInfo.label}</Badge>}
        </div>
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 text-xs text-slate-500">{product.category}</div>
        <Link href={`/products/${product.id}`}>
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors">{product.name}</h3>
        </Link>
        
        <div className="my-2 flex items-center gap-1 text-xs text-slate-600">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span>{product.rating}</span>
          <span className="text-slate-300">|</span>
          <span>{product.sold.toLocaleString()} terjual</span>
        </div>

        <div className="mt-auto pt-2">
          {hasDiscount && (
            <div className="text-xs text-slate-400 line-through">{formatRupiah(originalPrice)}</div>
          )}
          <div className="text-lg font-bold text-blue-600 tracking-tight">{formatRupiah(finalPrice)}</div>
          
          <Button 
            onClick={async () => {
              await addToCart(product.variants[0]?.id, 1);
            }}
            disabled={isAddingToCart}
            className="mt-3 w-full gap-2"
          >
            {isAddingToCart ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Processing...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Tambah ke Keranjang
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
