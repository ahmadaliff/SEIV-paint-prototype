"use client";

import { useEffect } from "react";
import { ProductCard } from "@/components/molecules/ProductCard";
import { useProductStore } from "@/store";

export function ProductGrid() {
  const { products, isLoadingProducts, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 font-serif">Produk Unggulan</h2>
          <button className="text-orange-500 font-medium text-sm hover:text-orange-600 transition-colors hidden md:block">
            Lihat Semua &rarr;
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {isLoadingProducts ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-80 w-full animate-pulse bg-slate-200 rounded-xl"></div>
            ))
          ) : (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
        
        <button className="mt-8 w-full md:hidden text-blue-600 font-semibold text-sm hover:underline text-center">
          Lihat Semua Produk &rarr;
        </button>
      </div>
    </section>
  );
}
