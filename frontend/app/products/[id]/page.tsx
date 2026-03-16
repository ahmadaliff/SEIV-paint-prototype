import { Metadata } from 'next';
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Header } from "@/components/organisms/Header";
import { ProductDetailsClient } from "@/components/organisms/ProductDetailsClient";
import { Product } from '@/lib/types';
import { medusaApi } from '@/lib/api';

async function getProduct(id: string): Promise<Product | null> {
  try {
    // 1. Get default region first for pricing context
    const { data: regionData } = await medusaApi.get('/store/regions');
    const regionId = regionData.regions?.[0]?.id;

    // 2. Fetch product with region_id
    const { data } = await medusaApi.get(`/store/products/${id}`, {
      params: {
        fields: "id,title,thumbnail,handle,description,categories.name,options.title,options.values.value,*variants.calculated_price,variants.options,variants.title,variants.sku,variants.manage_inventory,variants.allow_backorder,variants.inventory_quantity,metadata",
        region_id: regionId
      }
    });
    const p = data.product;
    if (!p) return null;

    // Map options first to use in variants mapping
    const options = (p.options || []).map((o: any) => ({
      id: o.id,
      title: o.title,
      values: (o.values || []).map((v: any) => v.value).filter(Boolean) as string[]
    }));

    const optionIdToTitle: Record<string, string> = {};
    options.forEach((o: any) => {
      optionIdToTitle[o.id] = o.title;
    });

    const variants = (p.variants || []).map((v: any) => {
      const cp = v.calculated_price;

      const unitPrice = cp?.calculated_amount ?? cp?.amount ?? 0;
      const originalPrice = cp?.original_amount ?? cp?.base_amount ?? unitPrice;

      // Transform options array to record
      const optionsRecord: Record<string, string> = {};
      if (Array.isArray(v.options)) {
        v.options.forEach((opt: any) => {
          const title = optionIdToTitle[opt.option_id] || opt.option?.title || "";
          if (title) {
            optionsRecord[title] = opt.value;
          }
        });
      }

      return {
        id: v.id,
        title: v.title,
        sku: v.sku,
        price: unitPrice,
        original_price: originalPrice,
        options: optionsRecord,
        inventory_quantity: v.inventory_quantity ?? 0,
        manage_inventory: !!v.manage_inventory,
      };
    });

    return {
      id: p.id,
      variantId: variants[0]?.id || '',
      name: p.title,
      price: variants[0]?.price || 0,
      category: p.categories?.[0]?.name || 'Cat Tembok',
      description: p.description || 'Produk SEIV Paint berkualitas tinggi.',
      image: p.thumbnail || 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=500&auto=format&fit=crop',
      rating: 4.8,
      sold: 1200,
      options: options,
      variants: variants,
      metadata: p.metadata
    };
  } catch (error) {
    console.error("Scale fetch error:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.id);

  if (!product) {
    return { title: 'Product Not Found | SEIV Paint' };
  }

  return {
    title: `${product.name} | SEIV Paint`,
    description: `Beli ${product.name} kualitas premium bergaransi.`,
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.id);

  if (!product) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
      <Link href="/products" className="text-blue-600 hover:underline">Return to Catalog</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Link href="/products" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-8 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Kembali ke Katalog
        </Link>

        <ProductDetailsClient product={product} />
      </main>
    </div>
  );
}
