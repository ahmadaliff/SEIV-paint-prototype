"use client";

import { useState, useEffect } from "react";
import { useAuthStore, useCartStore, useProductStore } from "@/store";
import { ShoppingCart, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { formatRupiah } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { user, role, login, logout, loginAsRole } = useAuthStore();
  const { cart, fetchCart } = useCartStore();
  const { products } = useProductStore();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSwitchingProfile, setIsSwitchingProfile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    setMounted(true);
    fetchCart();
  }, [fetchCart]);

  const navLinks = [
    { name: "Beranda", href: "/" },
    { name: "Produk", href: "/products" },
    { name: "Pesanan Saya", href: "#" },
    { name: "FAQ", href: "#" },
    { name: "Bantuan", href: "#" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      <div className="bg-[#1a2b43]">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row justify-between items-center bg-[#1a2b43] p-2 px-6 text-xs text-slate-300 gap-2">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <span className="font-medium text-slate-400 text-center sm:text-left">
              Demo Mode — Ganti Profil:
            </span>
            {mounted && (
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  disabled={isSwitchingProfile}
                  onClick={async () => {
                    setIsSwitchingProfile(true);
                    await loginAsRole('INDIVIDUAL');
                    setIsSwitchingProfile(false);
                  }}
                  className={`px-3 py-1 rounded-full transition-colors whitespace-nowrap disabled:opacity-50 ${role === 'INDIVIDUAL' ? 'bg-blue-600 text-white font-medium' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                >
                  👤 Individual
                </button>
                <button
                  disabled={isSwitchingProfile}
                  onClick={async () => {
                    setIsSwitchingProfile(true);
                    await loginAsRole('DISTRIBUTOR_SILVER');
                    setIsSwitchingProfile(false);
                  }}
                  className={`px-3 py-1 rounded-full transition-colors whitespace-nowrap disabled:opacity-50 ${role === 'DISTRIBUTOR_SILVER' ? 'bg-blue-600 text-white font-medium' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                >
                  🏢 Distributor
                </button>
                <button
                  disabled={isSwitchingProfile}
                  onClick={async () => {
                    setIsSwitchingProfile(true);
                    await loginAsRole('ADMIN');
                    setIsSwitchingProfile(false);
                  }}
                  className={`px-3 py-1 rounded-full transition-colors whitespace-nowrap disabled:opacity-50 ${role === 'ADMIN' ? 'bg-blue-600 text-white font-medium' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                >
                  ⚙️ Admin
                </button>
              </div>
            )}
          </div>
          <div className="hidden sm:block">
            Login sebagai: <strong className="text-white">{mounted ? (isSwitchingProfile ? 'Memproses...' : (user?.name || 'Guest / Non-Login')) : '...'}</strong>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Logo block */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a2b43] text-white font-bold text-xl">
            S
          </div>
          <div className="leading-tight">
            <Link href="/" className="font-serif font-bold text-slate-800 text-lg">SEIV Paint</Link>
            {mounted && role === 'DISTRIBUTOR_SILVER' ? (
              <div className="text-[10px] text-purple-600 font-bold flex items-center gap-1">
                <span>✓</span> Harga Distributor SILVER
              </div>
            ) : (
              <div className="text-[10px] text-yellow-600 uppercase tracking-widest font-medium">Quality & Color</div>
            )}
          </div>
        </div>

        <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`transition-colors ${isActive ? 'text-blue-600' : 'hover:text-blue-600'}`}
              >
                {link.name}
              </Link>
            );
          })}
          {mounted && role === 'ADMIN' && (
            <Link href="/admin" className="text-yellow-600 hover:text-yellow-700 font-bold transition-colors ml-4 flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-full shadow-sm">
              <span className="text-lg">⚙️</span> Dashboard
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-5 text-slate-400">
          <button className="hover:text-blue-600 transition-colors">
            <Search className="h-5 w-5" />
          </button>

          {!user?.email ? (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-xs font-bold text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          ) : (
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                {user.name}
              </div>
              <button
                onClick={() => logout()}
                className="text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest text-[10px]"
              >
                Logout
              </button>
            </div>
          )}

          {mounted && role !== 'ADMIN' && (
            <div className="relative group p-2 -m-2">
              <Link href="/cart" className={`relative cursor-pointer transition-colors ${pathname === '/cart' ? 'text-blue-600' : 'hover:text-blue-600'}`}>
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {cartItemsCount}
                  </span>
                )}
              </Link>

              {/* Cart Dropdown */}
              {cart.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-[100] overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <span className="text-sm font-bold text-slate-800">Keranjang Belanja ({cartItemsCount})</span>
                    <Link href="/cart" className="text-xs font-bold text-blue-600 hover:underline">Lihat Semua</Link>
                  </div>

                  <div className="max-h-60 overflow-y-auto px-4 py-2">
                    {cart.map((item) => {
                      const product = products.find(p => p.variantId === item.productId);
                      if (!product) return null;
                      return (
                        <div key={item.id} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-none">
                          <div className="h-12 w-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                            <Image src={product.image} alt="" fill className="object-cover opacity-60" unoptimized />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[11px] font-bold text-slate-800 truncate uppercase">{product.name}</h4>
                            <div className="text-[10px] text-slate-500 mt-0.5">{item.quantity} x {formatRupiah(product.price)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Subtotal</span>
                      <span className="text-sm font-black text-[#1a2b43]">
                        {formatRupiah(cart.reduce((acc, item) => {
                          const product = products.find(p => p.variantId === item.productId);
                          return acc + (product ? product.price * item.quantity : 0);
                        }, 0))}
                      </span>
                    </div>
                    <Link href="/checkout" className={`block w-full text-white text-center py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${pathname === '/checkout' ? 'bg-blue-600' : 'bg-[#1a2b43] hover:bg-slate-800'}`}>
                      Checkout Sekarang
                    </Link>
                  </div>
                </div>
              )}

              {cart.length === 0 && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-[100] p-8 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-slate-300" />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-500">Keranjang Anda kosong</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-[#1a2b43]">Sign In</h3>
                <button onClick={() => setIsLoginModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <p className="text-slate-500 text-sm mb-8">Masuk ke akun SEIV Paint Anda untuk melihat harga distributor dan riwayat pesanan.</p>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoginError("");
                setIsLoggingIn(true);
                try {
                  await login(loginData.email, loginData.password);
                  setIsLoginModalOpen(false);
                } catch (err) {
                  setLoginError("Email atau password salah.");
                } finally {
                  setIsLoggingIn(false);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Email</label>
                  <input
                    type="email"
                    required
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="example@mail.com"
                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Password</label>
                  <input
                    type="password"
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm"
                  />
                </div>
                {loginError && <p className="text-xs font-bold text-red-500 ml-1">{loginError}</p>}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-[#1a2b43] text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoggingIn ? "Memproses..." : "Masuk Sekarang"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
