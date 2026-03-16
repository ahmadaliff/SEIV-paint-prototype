"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Clock,
  Users,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { mockRevenue, mockTopProducts } from "@/lib/constants";
import { useOrderStore, useProductStore } from "@/store";

export default function AdminDashboard() {
  const { orders, fetchOrders, totalUsers, fetchCustomers } = useOrderStore();
  const { products, fetchProducts } = useProductStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
    fetchOrders();
    fetchCustomers();
  }, [fetchProducts, fetchOrders, fetchCustomers]);

  if (!mounted) return null;

  // Real Derivations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  
  // Dynamic Revenue Chart (Last 7 months)
  const getMonthlyRevenue = () => {
    const now = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('id-ID', { month: 'short' });
      const monthYear = d.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
      
      // Filter orders for this month
      const monthAmount = orders.reduce((sum, o) => {
          const orderDate = new Date(o.date);
          if (orderDate.getMonth() === d.getMonth() && orderDate.getFullYear() === d.getFullYear()) {
              return sum + o.total;
          }
          return sum;
      }, 0);

      result.push({
        month: monthLabel,
        amount: monthAmount,
        isCurrent: i === 0
      });
    }
    return result;
  };
  const dynamicRevenue = getMonthlyRevenue();

  // Top Products Derivation
  const getTopProducts = () => {
    const productStats: Record<string, { name: string, unit: number }> = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        if (!productStats[item.name]) {
          productStats[item.name] = { name: item.name, unit: 0 };
        }
        productStats[item.name].unit += item.quantity;
      });
    });

    const sorted = Object.values(productStats)
      .sort((a, b) => b.unit - a.unit)
      .slice(0, 5);

    const maxUnit = Math.max(...sorted.map(s => s.unit), 1);
    return sorted.map(s => ({
      ...s,
      percentage: (s.unit / maxUnit) * 100
    }));
  };
  const dynamicTopProducts = getTopProducts();

  return (
    <div className="p-8">

      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 font-serif">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Selamat datang kembali. Berikut ringkasan aktivitas hari ini.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600">
              <span className="text-xl font-bold">💰</span>
            </div>
            <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12.3%</div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">{formatRupiah(totalRevenue)}</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Total Revenue</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
              <Package className="h-5 w-5" />
            </div>
            <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+8 minggu ini</div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">{totalOrders}</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Total Pesanan</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
              <Clock className="h-5 w-5" />
            </div>
            <div className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">{pendingOrders} pending</div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">{pendingOrders}</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Pesanan Pending</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
              <Users className="h-5 w-5" />
            </div>
            <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Aktif</div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">{totalUsers}</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Total Pengguna</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-bold text-slate-800">Revenue 7 Bulan Terakhir</h2>
            <button className="text-xs text-blue-600 hover:underline">Lihat Detail</button>
          </div>

          <div className="h-48 flex items-end gap-2 sm:gap-4 pt-4">
            {dynamicRevenue.map((data, idx) => {
              const maxVal = Math.max(...dynamicRevenue.map(d => d.amount), 1);
              const heightPct = (data.amount / maxVal) * 100;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 hover:opacity-80
                      ${data.isCurrent ? 'bg-yellow-500' : 'bg-slate-500'}
                    `}
                    style={{ height: `${Math.max(heightPct, 5)}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none shadow-md">
                      {formatRupiah(data.amount)}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold ${data.isCurrent ? 'text-yellow-600' : 'text-slate-400'}`}>
                    {data.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-slate-800">Pesanan Terbaru</h2>
            <button className="text-xs text-blue-600 hover:underline">Lihat Semua</button>
          </div>

          <div className="space-y-4">
            {orders.length > 0 ? (
              orders.slice(0, 5).map((order, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                  <div>
                    <div className="font-bold text-sm text-slate-800">{order.id}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{order.customer}</div>
                  </div>

                  <div className="flex items-center gap-6">
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${order.statusColor}`}>
                      {order.status}
                    </span>
                    <div className="font-bold text-sm text-slate-800 w-24 text-right">
                      {formatRupiah(order.total)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-slate-400 text-sm">Belum ada pesanan masuk.</div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-slate-100">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800">Produk Terlaris</h2>
        </div>

        <div className="space-y-5">
          {dynamicTopProducts.length > 0 ? (
            dynamicTopProducts.map((prod, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-6 text-center font-bold text-slate-300 text-lg">{idx + 1}</span>

                <div className="flex-1">
                  <div className="flex justify-between items-end mb-1">
                    <h4 className="text-sm font-bold text-slate-700">{prod.name}</h4>
                    <span className="text-xs text-slate-400 font-medium">{prod.unit.toLocaleString()} unit</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1a2b43] rounded-full"
                      style={{ width: `${prod.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-slate-400 text-sm">Data produk terlaris belum tersedia.</div>
          )}
        </div>
      </div>

    </div>
  );
}
