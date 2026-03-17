"use client";

import { useState, useEffect } from "react";
import { Order } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { useOrderStore } from "@/store";
import {
  ChevronDown,
  Package,
  Truck,
  Mail,
  MessageCircle,
  Clock,
} from "lucide-react";
import Image from "next/image";

export default function OrderManagementPage() {
  const { orders, isLoadingOrders, fetchOrders, updateOrderStatus } = useOrderStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("Semua");
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchOrders();
  }, [fetchOrders]);

  if (!mounted) return null;

  const tabs = ["Semua", "Pending", "Processing", "Paid", "Shipped", "Completed"];

  const filteredOrders = activeTab === "Semua"
    ? orders
    : orders.filter(o => o.status === activeTab);

  const toggleOrder = (id: string) => {
    setExpandedOrders(prev =>
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const handleUpdateStatus = async (realId: string, newStatus: Order['status']) => {
    setUpdatingId(realId);
    await updateOrderStatus(realId, newStatus);
    setUpdatingId(null);
  };

  return (
    <div className="p-8 pb-24 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-800 font-serif">Manajemen Pesanan</h1>
        <p className="text-slate-500 mt-1">{isLoadingOrders ? 'Memuat...' : `${orders.length} total pesanan ditemukan`}</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
        {tabs.map(tab => {
          const count = tab === "Semua" ? orders.length : orders.filter(o => o.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2
                ${activeTab === tab
                  ? 'bg-[#1a2b43] text-white shadow-lg'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              {tab}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === tab ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Order List */}
      <div className="space-y-4">
        {filteredOrders.map(order => {
          const isExpanded = expandedOrders.includes(order.id);
          return (
            <div
              key={order.id}
              className={`bg-white rounded-3xl border border-slate-200 transition-all shadow-sm hover:shadow-md
                ${isExpanded ? 'ring-2 ring-blue-500 ring-offset-0 border-blue-100 shadow-xl' : ''}`}
            >
              {/* Summary Row */}
              <div
                onClick={() => toggleOrder(order.id)}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-sm font-black text-slate-900 tracking-tight">{order.id}</div>
                    <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{order.customer}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{order.date} • {order.items.length} produk</div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.statusColor}`}>
                      {order.status}
                    </span>
                    {order.role === 'DISTRIBUTOR_SILVER' && (
                      <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Dist. SILVER</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-8 pr-4">
                  <div className="text-right">
                    <div className="text-base font-black text-slate-900">{formatRupiah(order.total)}</div>
                    {order.shipping && (
                      <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter mt-0.5">{order.shipping.method} — {order.shipping.destination}</div>
                    )}
                  </div>
                  <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown className="h-5 w-5 text-slate-300" />
                  </div>
                </div>
              </div>

              {/* Detail Section */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-8 space-y-10 bg-slate-50/30">
                  {/* Items List */}
                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 bg-white rounded-2xl border border-slate-200 p-1 relative overflow-hidden flex items-center justify-center">
                            <Image src={item.image} alt={item.name} fill className="object-cover opacity-60" unoptimized />
                            <span className="absolute bottom-1 right-1 text-[7px] font-black text-slate-300 uppercase">SEIV</span>
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{item.name}</h4>
                            {item.discountInfo && (
                              <p className="text-[10px] text-emerald-600 font-bold mt-1">{item.discountInfo}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-black text-slate-700">{formatRupiah(item.price * item.quantity)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                    {order.shipping && (
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Truck className="h-3 w-3" /> Informasi Pengiriman
                        </h5>
                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium tracking-tight">Metode:</span>
                            <span className="text-slate-900 font-bold">{order.shipping.method}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium tracking-tight">Cabang:</span>
                            <span className="text-slate-900 font-bold">{order.shipping.branch}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium tracking-tight">Tujuan:</span>
                            <span className="text-slate-900 font-bold">{order.shipping.destination} (Zona {order.shipping.zone}, {order.shipping.distance} km)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-medium tracking-tight">Ongkir:</span>
                            <span className="text-emerald-600 font-black">{order.shipping.cost === 0 ? 'GRATIS' : formatRupiah(order.shipping.cost)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full blur-2xl -mr-10 -mt-10"></div>
                      <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Clock className="h-3 w-3" /> Ringkasan Biaya
                      </h5>
                      <div className="space-y-3 text-xs relative z-10">
                        {order.billing && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-medium tracking-tight">Subtotal:</span>
                              <span className="text-slate-900 font-bold">{formatRupiah(order.billing.subtotal)}</span>
                            </div>
                            {order.billing.discount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-slate-500 font-medium tracking-tight">Diskon Distributor ({order.billing.discountPercent}%):</span>
                                <span className="text-emerald-600 font-bold">-{formatRupiah(order.billing.discount)}</span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="flex justify-between pt-3 border-t border-slate-100 items-end">
                          <span className="text-[10px] font-black text-[#1a2b43] uppercase tracking-widest">Total:</span>
                          <span className="text-xl font-black text-blue-600 leading-none">{formatRupiah(order.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-4 pt-6">
                    <div className="flex items-center gap-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.realId, e.target.value as Order['status'])}
                        disabled={updatingId === order.realId}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-black text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[160px] disabled:opacity-50"
                      >
                        {tabs.filter(t => t !== 'Semua').map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <button className="flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-[#25D366]/20">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </button>

                    <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-xl text-xs font-bold transition-all border border-slate-200">
                      <Mail className="h-4 w-4" /> Email
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <Package className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">Tidak ada pesanan dengan status &quot;{activeTab}&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
}
