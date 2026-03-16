"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Settings,
} from "lucide-react";
import { useAuthStore } from "@/store";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, setRole } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && role !== 'ADMIN') {
      router.push('/');
    }
  }, [mounted, role, router]);

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: <BarChart3 className="h-5 w-5" /> },
    { name: "Produk", href: "#", icon: <Package className="h-5 w-5" /> },
    { name: "Pesanan", href: "/admin/orders", icon: <ShoppingCart className="h-5 w-5" /> },
    { name: "Pengguna", href: "#", icon: <Users className="h-5 w-5" /> },
    { name: "Laporan", href: "#", icon: <FileText className="h-5 w-5" /> },
    { name: "Konfigurasi Ongkir", href: "/admin/shipping", icon: <Settings className="h-5 w-5" /> },
  ];

  if (!mounted || role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a2b43] text-white flex flex-col hidden md:flex min-h-screen sticky top-0 border-r border-slate-700 shadow-xl z-20">

        {/* Logo Area */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-700/50">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-yellow-500 text-[#1a2b43] font-bold text-lg shadow-sm">
            S
          </div>
          <div className="leading-tight">
            <div className="font-serif font-bold text-white text-base">SEIV Paint</div>
            <div className="text-[10px] text-slate-400 capitalize">Admin Panel</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                    ? 'bg-slate-700/50 text-white shadow-sm border border-slate-600/50 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
              >
                <div className={`${isActive ? 'text-yellow-500' : 'text-slate-500'}`}>
                  {item.icon}
                </div>
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin User Bottom Section */}
        <div className="p-4 border-t border-slate-700/50 bg-[#152336]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm text-yellow-500 shrink-0">
              AS
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-bold text-white truncate">Admin SEIV</div>
              <div className="text-[10px] text-slate-400 truncate">admin@seiv.co.id</div>
            </div>
          </div>
        </div>

      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* Top Role Switcher (Demo Only) matching mockup top bar */}
        <header className="h-14 bg-[#152336] flex items-center justify-between px-6 border-b border-slate-700 shrink-0 shadow-sm z-10 sticky top-0">
          <div className="flex items-center gap-3 text-xs text-slate-400 w-full md:w-auto">
            <span className="hidden sm:inline">Demo Mode — Ganti Profil:</span>
            <div className="flex gap-2">
              <button onClick={() => setRole('INDIVIDUAL')} className={`px-3 py-1.5 rounded-full transition-colors ${(role as string) === 'INDIVIDUAL' ? 'bg-blue-600 text-white font-medium' : 'bg-slate-800 hover:bg-slate-700'}`}>👤 Individual</button>
              <button onClick={() => setRole('DISTRIBUTOR_SILVER')} className={`px-3 py-1.5 rounded-full transition-colors ${(role as string) === 'DISTRIBUTOR_SILVER' ? 'bg-blue-600 text-white font-medium' : 'bg-slate-800 hover:bg-slate-700'}`}>🏢 Distributor</button>
              <button onClick={() => setRole('ADMIN')} className={`px-3 py-1.5 rounded-full transition-colors ${role === 'ADMIN' ? 'bg-red-500 text-white font-medium shadow-sm' : 'bg-slate-800 hover:bg-slate-700'}`}>⚙️ Admin</button>
            </div>
          </div>
          <div className="hidden md:block text-xs text-slate-400">
            Login sebagai: <strong className="text-white">Admin SEIV</strong>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}
