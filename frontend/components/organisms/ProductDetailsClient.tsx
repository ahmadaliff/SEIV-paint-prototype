"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Star, Minus, Plus, ShoppingCart } from "lucide-react";
import { useAuthStore, useCartStore, useProductStore } from "@/store";
import { formatRupiah } from "@/lib/utils";
import { Product } from "@/lib/types";
import { medusaApi } from "@/lib/api";

export function ProductDetailsClient({ product: initialProduct }: { product: Product }) {
  const { role } = useAuthStore();
  const { addToCart } = useCartStore();
  const { selectedRegionId, fetchRegions } = useProductStore();
  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState(initialProduct);

  // Dynamic Options State
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  // Hydration fix & Initial options & Client-side Refetch for Auth Prices
  useEffect(() => {
    setMounted(true);

    // Set default options from initial product
    const initialOptions: Record<string, string> = {};
    initialProduct.options.forEach(opt => {
      if (opt.values && opt.values.length > 0) {
        initialOptions[opt.title] = opt.values[0];
      }
    });
    setSelectedOptions(initialOptions);

    // Re-fetch product on client to get authenticated pricing (Distributor discounts)
    const fetchAuthenticatedProduct = async () => {
      try {
        const { data } = await medusaApi.get(`/store/products/${initialProduct.id}`, {
          params: {
            fields: "id,title,thumbnail,handle,description,categories.name,options.title,options.values.value,*variants.calculated_price,variants.options.*,variants.options.option.title,variants.title,variants.sku,variants.manage_inventory,variants.allow_backorder,variants.inventory_quantity,metadata",
            region_id: selectedRegionId || "reg_01KKRJBPZVQT45TGS0HCEVWFB8"
          }
        });

        const p = data.product;
        if (!p) return;

        // Map product options (e.g., Warna, Ukuran)
        const mappedOptions = (p.options || []).map((o: any) => {
          const vals = Array.isArray(o.values)
            ? o.values.map((v: any) => typeof v === 'string' ? v : (v.value || v.label))
            : [];
          return { id: o.id, title: o.title, values: vals.filter(Boolean) as string[] };
        });

        const optionIdToTitle: Record<string, string> = {};
        mappedOptions.forEach((o: any) => { optionIdToTitle[o.id] = o.title; });

        const variants = (p.variants || []).map((v: any) => {
          const cp = v.calculated_price;
          const unitPrice = cp?.calculated_amount ?? cp?.amount ?? 0;
          const originalPrice = cp?.original_amount ?? cp?.base_amount ?? unitPrice;

          const optionsRecord: Record<string, string> = {};

          // Debug raw options for the first variant
          if (p.variants.indexOf(v) === 0) {
            console.log("[Client] Raw V0 Options from API:", v.options);
          }

          if (Array.isArray(v.options)) {
            v.options.forEach((opt: any) => {
              // Extract title: from mapping, from nested option object, or fallback
              const title = optionIdToTitle[opt.option_id] || opt.option?.title || opt.title || "";
              const value = opt.value || opt.label || "";
              if (title && value) optionsRecord[title] = value;
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

        const mappedProduct: Product = {
          ...initialProduct,
          price: variants[0]?.price || 0,
          options: mappedOptions.length > 0 ? mappedOptions : initialProduct.options,
          variants: variants,
          metadata: p.metadata
        };

        setProduct(mappedProduct);
      } catch (error) {
        console.error("Client fetch error:", error);
      }
    };

    fetchAuthenticatedProduct();
  }, [initialProduct.id, initialProduct.options, fetchRegions, selectedRegionId, role]);

  // Find current variant based on selected options (using the state 'product')
  const currentVariant = product.variants.find((v) => {
    const selEntries = Object.entries(selectedOptions);
    if (selEntries.length === 0) return false;

    return selEntries.every(([selKey, selVal]) => {
      const targetKey = selKey.toLowerCase();
      const targetVal = String(selVal).toLowerCase().trim();

      // Find value in variant options where key matches (case-insensitive)
      const vKeyMatched = Object.keys(v.options).find(k => k.toLowerCase() === targetKey);
      if (!vKeyMatched) return false;

      const vVal = String(v.options[vKeyMatched]).toLowerCase().trim();
      return vVal === targetVal;
    });
  }) || product.variants[0];

  useEffect(() => {
    if (mounted) {
      console.log("[PriceUpdate] currentVariant:", currentVariant?.title, "| price:", currentVariant?.price);
      console.log("[PriceUpdate] Matched Variant Options:", currentVariant?.options);

      if (currentVariant?.id === product.variants[0]?.id && Object.keys(selectedOptions).length > 0) {
        console.log("[PriceUpdate] Selection vs First Variant Option Comparison:");
        Object.entries(selectedOptions).forEach(([sk, sv]) => {
          const vk = Object.keys(currentVariant.options).find(k => k.toLowerCase() === sk.toLowerCase());
          console.log(`  - Option [${sk}]: Selected='${sv}', Variant[${vk || 'MISSING'}]='${vk ? currentVariant.options[vk] : 'N/A'}'`);
        });
      }
    }
  }, [currentVariant?.id, selectedOptions, mounted]);

  // Pricing Logic from Backend
  const finalPrice = currentVariant?.price || 0;
  const basePrice = currentVariant?.original_price || finalPrice;

  const discountAmount = basePrice - finalPrice;
  const discountPercent = basePrice > 0 ? (discountAmount / basePrice) : 0;

  // Dynamic Color Map from Backend Metadata
  const COLOR_MAP = product.metadata?.color_map || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Left: Images & Options */}
      <div className="space-y-6">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center p-8">
          <div className="relative w-full h-full drop-shadow-2xl">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain p-4"
              unoptimized
            />
          </div>

          {/* Dynamic Option floating preview (e.g., Color) */}
          {selectedOptions["Warna"] && (
            <div className="absolute bottom-6 left-6 bg-white p-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3">
              <div className="text-[10px] text-slate-400 font-medium uppercase absolute -top-5 left-2 bg-white px-2 rounded-t-lg">Preview Warna</div>
              <div className="h-8 w-8 rounded-md border border-slate-200 shadow-inner" style={{ backgroundColor: COLOR_MAP[selectedOptions["Warna"]] || "#ccc" }} />
              <span className="text-sm font-bold text-slate-800 pr-2">{selectedOptions["Warna"]}</span>
            </div>
          )}
        </div>

        {/* Render Multiple Options (Warna, etc) */}
        {product.options.map((option) => {
          const title = option.title.toLowerCase();
          if (title === "ukuran") return null; // Render size separately as buttons

          return (
            <div key={option.id} className="mb-4">
              <div className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1">
                {option.title}: <span className="text-blue-600">{selectedOptions[option.title]}</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {option.values.map((val) => (
                  title === "warna" ? (
                    <button
                      key={val}
                      onClick={() => {
                        // Normalize key by looking it up or using the exact title from the option object
                        const key = option.title;
                        setSelectedOptions(prev => {
                          const next = { ...prev };
                          // Remove any existing variations of this key to avoid duplication (e.g. lowercase vs uppercase)
                          Object.keys(next).forEach(k => {
                            if (k.toLowerCase() === key.toLowerCase()) delete next[k];
                          });
                          next[key] = val;
                          return next;
                        });
                      }}
                      className={`h-12 w-12 rounded-xl border-2 transition-all ${Object.entries(selectedOptions).some(([k, v]) => k.toLowerCase() === "warna" && v === val) ? 'border-blue-600 scale-110 shadow-md' : 'border-transparent shadow-sm hover:scale-105'}`}
                      style={{ backgroundColor: COLOR_MAP[val] || "#ccc" }}
                      aria-label={`Pilih ${val}`}
                    />
                  ) : (
                    <button
                      key={val}
                      onClick={() => {
                        const key = option.title;
                        setSelectedOptions(prev => {
                          const next = { ...prev };
                          Object.keys(next).forEach(k => {
                            if (k.toLowerCase() === key.toLowerCase()) delete next[k];
                          });
                          next[key] = val;
                          return next;
                        });
                      }}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${Object.entries(selectedOptions).some(([k, v]) => k.toLowerCase() === title && v === val) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}
                    >
                      {val}
                    </button>
                  )
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Right: Product Info */}
      <div>
        <div className="flex gap-2 mb-4">
          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">{product.category}</span>
          {currentVariant?.sku && <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">{currentVariant.sku}</span>}
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">{product.name}</h1>

        <div className="flex items-center gap-4 text-sm mb-6">
          <div className="flex items-center gap-1 text-slate-700 font-medium">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            {product.rating}
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">({product.sold} terjual)</span>
          <span className="text-slate-300">|</span>
          {currentVariant?.manage_inventory ? (
            <span className={`${(currentVariant.inventory_quantity || 0) > 0 ? 'text-emerald-500' : 'text-rose-500'} font-bold flex items-center gap-1`}>
              <span className={`h-1.5 w-1.5 rounded-full ${(currentVariant.inventory_quantity || 0) > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              Stok: {currentVariant.inventory_quantity} unit
            </span>
          ) : (
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Stok: Tersedia
            </span>
          )}
        </div>

        <p className="text-slate-600 leading-relaxed mb-8">
          {product.description}
        </p>

        <div className="grid grid-cols-2 gap-y-4 gap-x-8 pb-8 border-b border-slate-100 mb-8 text-sm">
          <div>
            <div className="text-slate-400 text-xs mb-1">Coverage</div>
            <div className="font-semibold text-slate-800">{product.metadata?.specs?.coverage || "10-12 m²/L"}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs mb-1">Dry Time</div>
            <div className="font-semibold text-slate-800">{product.metadata?.specs?.dry_time || "1-2 jam"}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs mb-1">Coats</div>
            <div className="font-semibold text-slate-800">{product.metadata?.specs?.coats || "2 lapis"}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs mb-1">Finish</div>
            <div className="font-semibold text-slate-800">{product.metadata?.specs?.finish || "Satin"}</div>
          </div>
        </div>

        {/* Sizes (Rendered as big tiles) */}
        {product.options?.find(o => o.title.toLowerCase() === "ukuran") && (
          <div className="mb-8">
            <div className="text-sm font-semibold text-slate-800 mb-3">Pilih Ukuran:</div>
            <div className="flex flex-wrap gap-4">
              {product.options.find(o => o.title.toLowerCase() === "ukuran")?.values.map((val) => {
                // Find matching variant that matches THIS size AND other currently selected options (like Warna)
                const variantForSize = product.variants.find(v => {
                  // Must match this size
                  const hasSize = Object.entries(v.options).some(([vKey, vVal]) =>
                    vKey.toLowerCase() === "ukuran" && String(vVal).toLowerCase() === String(val).toLowerCase()
                  );
                  if (!hasSize) return false;

                  // Must match other selected options (e.g., Warna)
                  return Object.entries(selectedOptions).every(([selKey, selVal]) => {
                    if (selKey.toLowerCase() === "ukuran") return true; // Skip size as we are iterating over it
                    const vKeyMatched = Object.keys(v.options).find(k => k.toLowerCase() === selKey.toLowerCase());
                    return vKeyMatched && String(v.options[vKeyMatched]).toLowerCase() === String(selVal).toLowerCase();
                  });
                });

                const displayPrice = variantForSize?.price || 0;

                return (
                  <button
                    key={val}
                    onClick={() => {
                      const key = product.options.find(o => o.title.toLowerCase() === "ukuran")?.title || "Ukuran";
                      setSelectedOptions(prev => {
                        const next = { ...prev };
                        Object.keys(next).forEach(k => {
                          if (k.toLowerCase() === key.toLowerCase()) delete next[k];
                        });
                        next[key] = val;
                        return next;
                      });
                    }}
                    className={`flex flex-col items-center justify-center border-2 rounded-xl py-3 px-6 min-w-[120px] transition-all
                      ${Object.entries(selectedOptions).some(([k, v]) => k.toLowerCase() === "ukuran" && v === val)
                        ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-50/50 outline-none'
                        : 'border-slate-200 bg-white hover:border-blue-300'}`}
                  >
                    <span className={`font-bold ${Object.entries(selectedOptions).some(([k, v]) => k.toLowerCase() === "ukuran" && v === val) ? 'text-blue-700' : 'text-slate-700'}`}>{val}</span>
                    <span className="text-xs text-slate-500 mt-1">{formatRupiah(displayPrice)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}


        {/* Distributor Pricing Callout */}
        {mounted && role.includes('DISTRIBUTOR') && (
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 mb-6">
            <div className="text-purple-700 font-bold text-sm mb-3 flex items-center gap-2">
              <span className="text-lg">💎</span> Info Diskon Distributor
            </div>
            <div className="flex gap-2 text-xs font-semibold">
              <div className="bg-white text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">Bronze: 10%</div>
              <div className="bg-purple-600 text-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">Silver: 15% ✓</div>
              <div className="bg-white text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm opacity-60">Gold: 20% (min. Rp 10jt)</div>
            </div>
          </div>
        )}

        {/* Final Price Block */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 relative overflow-hidden">
          {/* Subtle Debug Info */}
          <div className="absolute top-2 right-4 text-[10px] text-slate-300 font-mono">
            V: {currentVariant?.title || 'None'} | {currentVariant?.id?.slice(-6)}
          </div>

          {mounted && discountPercent > 0 && (
            <div className="text-slate-400 line-through text-sm font-medium mb-1">
              {formatRupiah(basePrice)}
            </div>
          )}
          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl font-black text-slate-800 tracking-tight">{formatRupiah(finalPrice)}</span>
            <span className="text-slate-400 font-medium mb-1">/{selectedOptions["Ukuran"] || selectedOptions["ukuran"] || "unit"}</span>
          </div>

          {mounted && discountAmount > 0 && (
            <div className="text-emerald-600 font-bold text-sm">
              Hemat {formatRupiah(discountAmount)} per unit (Diskon khusus {role.replace('_', ' ').toLowerCase()})
            </div>
          )}
        </div>

        {/* Add to Cart Actions */}
        {mounted && role !== 'ADMIN' ? (
          <div className="flex gap-4">
            <div className="flex items-center border border-slate-200 rounded-xl bg-white">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-4 text-slate-500 hover:text-blue-600 transition-colors"
              >
                <Minus className="h-5 w-5" />
              </button>
              <div className="w-8 text-center font-bold text-slate-800">{quantity}</div>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-4 text-slate-500 hover:text-blue-600 transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => {
                if (currentVariant) {
                  addToCart(currentVariant.id, quantity);
                }
              }}
              disabled={currentVariant?.manage_inventory && (currentVariant.inventory_quantity || 0) <= 0}
              className="flex-1 bg-[#1a2b43] hover:bg-[#111c2f] disabled:bg-slate-400 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg"
            >
              <ShoppingCart className="h-5 w-5" />
              {(currentVariant?.manage_inventory && (currentVariant.inventory_quantity || 0) <= 0) ? 'Stok Habis' : 'Tambah ke Keranjang'}
            </button>
          </div>
        ) : mounted && (
          <div className="bg-slate-100 p-4 rounded-xl text-center text-sm font-bold text-slate-500 border border-slate-200">
            Mode Admin: Pembelian dinonaktifkan
          </div>
        )}

      </div>
    </div>
  );
}
