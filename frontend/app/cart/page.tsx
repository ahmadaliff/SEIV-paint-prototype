"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/organisms/Header";
import { useAuthStore, useCartStore, useProductStore } from "@/store";
import { formatRupiah } from "@/lib/utils";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CartPage() {
  const { role } = useAuthStore();
  const { cart, fetchCart, removeFromCart, updateCartItemQuantity } = useCartStore();
  const { products } = useProductStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchCart();
  }, [fetchCart]);

  if (!mounted) return null;

  if ((role as string) === 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm border border-slate-200">
          <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
             <ShoppingBag className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-black text-slate-800 mb-2">Akses Dibatasi</h1>
          <p className="text-sm text-slate-500 mb-6">Admin tidak diperbolehkan melakukan pembelian atau mengakses keranjang.</p>
          <Link href="/admin" className="block w-full bg-[#1a2b43] text-white py-3 rounded-xl font-bold">Kembali ke Dashboard</Link>
        </div>
      </div>
    );
  }

  const cartItems = cart.map((item) => {
    const p = products.find((p) => p.variantId === item.productId);
    if (!p) return null;
    return { ...p, quantity: item.quantity, cartId: item.id };
  }).filter(Boolean) as any[];

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  // Distributor Discount logic
  let discountPercent = 0;
  if (role === 'DISTRIBUTOR_SILVER') discountPercent = 0.15;
  if (role === 'ADMIN') discountPercent = 0.20;
  
  const discountAmount = subtotal * discountPercent;
  const total = subtotal - discountAmount;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 font-serif">Keranjang Belanja</h1>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-sm">
                <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-widest text-[10px]">
                  <div className="col-span-6">Produk</div>
                  <div className="col-span-2 text-center">Harga</div>
                  <div className="col-span-2 text-center">Jumlah</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {cartItems.map((item) => (
                    <div key={item.cartId} className="grid grid-cols-12 gap-4 p-6 items-center">
                      <div className="col-span-6 flex items-center gap-4">
                        <div className="h-20 w-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                          <Image src={item.image} alt={item.name} fill className="object-cover opacity-60" unoptimized />
                          <span className="absolute bottom-1 right-1 text-[8px] font-bold text-slate-400">SEIV</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-800 line-clamp-1 uppercase tracking-tight">{item.name}</h3>
                          <p className="text-xs text-slate-500 mt-1">Variasi: Default</p>
                          <button 
                            onClick={() => removeFromCart(item.cartId)}
                            className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-xs font-bold mt-3 transition-colors uppercase tracking-tighter"
                          >
                            <Trash2 className="h-3 w-3" />
                            Hapus
                          </button>
                        </div>
                      </div>
                      <div className="col-span-2 text-center font-bold text-slate-700">
                        {formatRupiah(item.price)}
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                          <button 
                            onClick={() => updateCartItemQuantity(item.cartId, item.quantity - 1)}
                            className="p-2 hover:bg-white transition-colors text-slate-500"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-10 text-center font-bold text-slate-800 text-xs">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartItemQuantity(item.cartId, item.quantity + 1)}
                            className="p-2 hover:bg-white transition-colors text-slate-500"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="col-span-2 text-right font-black text-blue-600">
                        {formatRupiah(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <Link href="/products" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold text-sm transition-all group uppercase tracking-widest">
                <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Lanjut Belanja
              </Link>
            </div>

            {/* Right: Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8 sticky top-28">
                <h2 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">Ringkasan Pesanan</h2>
                
                <div className="space-y-4 text-sm font-medium mb-8">
                  <div className="flex justify-between text-slate-500 uppercase tracking-widest text-[11px]">
                    <span>Subtotal</span>
                    <span className="text-slate-900 font-bold">{formatRupiah(subtotal)}</span>
                  </div>
                  
                  {discountPercent > 0 && (
                    <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                      <div className="flex flex-col">
                        <span className="text-emerald-700 font-bold text-[10px] uppercase tracking-wider">Diskon Distributor</span>
                        <span className="text-[9px] text-emerald-600 opacity-75">Hemat {discountPercent * 100}%</span>
                      </div>
                      <span className="text-emerald-700 font-black">-{formatRupiah(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-500 uppercase tracking-widest text-[11px] pt-2">
                    <span>Ongkos Kirim</span>
                    <span className="text-slate-400 italic">Dihitung di Checkout</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6 mb-8">
                  <div className="flex justify-between items-end">
                    <span className="text-slate-800 font-bold uppercase tracking-widest text-[11px]">Total Estimasi</span>
                    <span className="text-2xl font-black text-blue-600 leading-none">{formatRupiah(total)}</span>
                  </div>
                </div>

                <Link 
                  href="/checkout"
                  className="block w-full bg-[#1a2b43] hover:bg-slate-800 text-white text-center py-4 rounded-xl font-black transition-all shadow-xl shadow-slate-200 uppercase tracking-widest text-xs"
                >
                  Checkout Sekarang
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-24 text-center max-w-2xl mx-auto shadow-sm">
            <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100">
              <ShoppingBag className="h-10 w-10 text-slate-200" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2 font-serif">Wah, keranjangmu masih kosong!</h2>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
              Mungkin ini saat yang tepat untuk mengecat rumah atau memperbarui warna interior Anda dengan koleksi terbaik kami.
            </p>
            <Link 
              href="/products"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200"
            >
              Mulai Belanja
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
