"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/organisms/Header";
import { useAuthStore, useCartStore, useShippingStore } from "@/store";
import { branches } from "@/lib/constants";
import { calculateDistance } from "@/lib/haversine";
import { formatRupiah } from "@/lib/utils";
import { AlertTriangle, ArrowRight, CheckCircle, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const DISTRICTS = [
  { name: "Jakarta Selatan", lat: -6.2615, lng: 106.8106 },
  { name: "Serpong, Tangerang", lat: -6.3039, lng: 106.6660 },
  { name: "Cikarang, Bekasi", lat: -6.2891, lng: 107.1425 },
  { name: "Pasteur, Bandung", lat: -6.8906, lng: 107.5960 },
  { name: "Gubeng, Surabaya", lat: -7.2756, lng: 112.7567 },
];

export default function CheckoutPage() {
  const { user } = useAuthStore();
  const { fullCart, fetchCart, updateCartDetails, setShippingMethod, placeOrder, isLoadingCart } = useCartStore();
  const { shippingZones, fetchShippingOptions, config } = useShippingStore();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [district, setDistrict] = useState(DISTRICTS[0]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    fetchCart();
    fetchShippingOptions();
  }, [fetchCart, fetchShippingOptions]);

  if (!mounted) return null;

  // Haversine Calculation
  let nearestBranch = branches[0];
  let minDistance = Infinity;

  branches.forEach(branch => {
    const dist = calculateDistance(district.lat, district.lng, branch.lat, branch.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestBranch = branch;
    }
  });

  // Map distance to Zone
  let targetZoneName = "Zona 1";
  if (minDistance > 25 && minDistance <= 75) targetZoneName = "Zona 2";
  if (minDistance > 75) targetZoneName = "Zona 3";

  const matchedZone = shippingZones.find(z => z.name.includes(targetZoneName));

  const proceedToReview = async () => {
    setIsProcessing(true);
    try {
      // Update Address & Email in Medusa Cart
      await updateCartDetails({
        email: user?.email || "guest@seiv.com",
          shipping_address: {
            first_name: user?.name?.split(' ')[0] || "Customer",
            last_name: user?.name?.split(' ')[1] || "SEIV",
            address_1: "Jl. Sudirman No. 45",
            city: district.name,
            country_code: "id",
            postal_code: "12345"
          }
      });
      setStep(2);
    } catch (err) {
      alert("Gagal memperbarui data pengiriman.");
    } finally {
      setIsProcessing(false);
    }
  };

  const proceedToPayment = async () => {
    if (!matchedZone?.medusaId) {
      alert("Zona pengiriman tidak tersedia untuk wilayah ini.");
      return;
    }
    setIsProcessing(true);
    try {
      await setShippingMethod(matchedZone.medusaId);
      setStep(3);
    } catch (err) {
      alert("Gagal mengatur kurir.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      const order = await placeOrder();
      setOrderSuccess(order);
    } catch (err) {
      alert("Gagal memproses pesanan.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-emerald-50 h-24 w-24 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-12 w-12 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2 font-serif">Pesanan Berhasil!</h1>
        <p className="text-slate-500 mb-8 max-w-md">Terima kasih sudah berbelanja di SEIV Paint. Pesanan Anda <strong>#{orderSuccess.display_id}</strong> sedang kami proses.</p>

        <div className="bg-slate-50 p-6 rounded-2xl w-full max-w-sm border border-slate-100 mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Total Pembayaran</span>
            <span className="font-bold text-slate-900">{formatRupiah(orderSuccess.total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Metode</span>
            <span className="font-bold text-slate-900 uppercase">{paymentMethod}</span>
          </div>
        </div>

        <Link href="/admin" className="bg-[#1a2b43] text-white px-8 py-3 rounded-xl font-bold transition-all hover:bg-slate-800 shadow-xl">
          Cek di Dashboard Admin
        </Link>
      </div>
    );
  }

  // Totals from Medusa Cart
  const subtotal = fullCart?.subtotal || 0;
  const shippingTotal = fullCart?.shipping_total || 0;
  const discountTotal = fullCart?.discount_total || 0;
  const total = fullCart?.total || 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-[#1a2b43] font-serif">Checkout</h1>
          {isLoadingCart && <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>}
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-4 mb-10 text-[10px] uppercase tracking-widest font-black w-full max-w-2xl mx-auto">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#1a2b43]' : 'text-slate-300'}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full ${step >= 1 ? 'bg-[#1a2b43] text-white' : 'bg-slate-200 text-slate-400'}`}>1</span>
            Alamat
          </div>
          <div className={`h-1 w-12 rounded-full ${step >= 2 ? 'bg-[#1a2b43]' : 'bg-slate-200'}`}></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#1a2b43]' : 'text-slate-300'}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full ${step >= 2 ? 'bg-[#1a2b43] text-white' : 'bg-slate-200 text-slate-400'}`}>2</span>
            Review
          </div>
          <div className={`h-1 w-12 rounded-full ${step >= 3 ? 'bg-[#1a2b43]' : 'bg-slate-200'}`}></div>
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#1a2b43]' : 'text-slate-300'}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full ${step >= 3 ? 'bg-[#1a2b43] text-white' : 'bg-slate-200 text-slate-400'}`}>3</span>
            Pembayaran
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-tight">Data Penerima</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nama Penerima</label>
                      <input type="text" defaultValue={user?.name || ''} className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 bg-slate-50 font-bold" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">No. Telepon</label>
                      <input type="text" defaultValue="081234567890" className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 bg-slate-50 font-bold" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kota Tujuan</label>
                      <select
                        value={district.name}
                        onChange={(e) => setDistrict(DISTRICTS.find(d => d.name === e.target.value)!)}
                        className="w-full border border-slate-200 rounded-lg p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                      >
                        {DISTRICTS.map(d => (
                          <option key={d.name} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Alamat Lengkap</label>
                      <textarea defaultValue="Jl. Sudirman No. 45, RT 02/RW 05" rows={2} className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 bg-slate-50" />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest">Haversine Engine (Medusa V2)</h4>
                      <p className="text-xs text-blue-700 mt-1">
                        Dihitung dari {district.name} &rarr; <strong>{nearestBranch.name}</strong>: <span className="font-bold underline text-blue-900">{minDistance} km</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a2b43] text-white rounded-2xl p-6 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-yellow-500">
                    Kurir Berdasarkan Jarak
                  </h3>
                  <div className="space-y-3 relative z-10">
                    <label className="flex items-start gap-3 p-4 border-2 border-blue-500 bg-blue-600/20 rounded-xl cursor-pointer transition-all">
                      <input type="radio" name="shipping" className="mt-1" defaultChecked />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm">SEIV Express - {targetZoneName}</span>
                          <span className="font-black text-lg text-yellow-500">
                            {matchedZone?.price === 0 ? 'GRATIS' : formatRupiah(matchedZone?.price || 0)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Estimasi: {minDistance < 50 ? 'Same-Day' : 'Reguler'}</p>
                      </div>
                    </label>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-4">Konfirmasi Pesanan</h2>
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tujuan Pengiriman</h4>
                      <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">Jl. Sudirman No. 45, {district.name}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pilihan Kurir</h4>
                      <p className="text-sm font-bold text-slate-800">SEIV Express - {targetZoneName}</p>
                      <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase">Estimasi: {minDistance < 50 ? 'Tiba Hari Ini' : 'Besok'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Rincian Barang</h4>
                    <div className="bg-slate-50 rounded-2xl p-4 divide-y divide-slate-200 border border-slate-100">
                      {fullCart?.items.map((item: any) => (
                        <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                          <div className="h-14 w-14 bg-white rounded-xl border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative text-slate-300">
                            <Package className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-tight line-clamp-1">{item.title}</h5>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-[10px] font-bold text-slate-500">{item.quantity} x {formatRupiah(item.unit_price)}</span>
                              <span className="text-xs font-black text-slate-900">{formatRupiah(item.unit_price * item.quantity)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-4">Metode Pembayaran</h2>
                <div className="space-y-4">
                  {[
                    { id: 'va', name: 'Virtual Account (BCA/Mandiri)', icon: '💳' },
                    { id: 'qris', name: 'QRIS (Gopay/OVO/ShopeePay)', icon: '📱' }
                  ].map(method => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${paymentMethod === method.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <input type="radio" checked={paymentMethod === method.id} readOnly className="h-4 w-4 text-blue-600" />
                      <span className="text-2xl">{method.icon}</span>
                      <span className="text-sm font-bold text-slate-800">{method.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Summary */}
          <div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 sticky top-24 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-2xl -mr-8 -mt-8"></div>

              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 relative z-10">Ringkasan Pesanan</h2>

              <div className="space-y-4 text-xs font-bold mb-8 relative z-10">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="text-slate-900">{formatRupiah(subtotal)}</span>
                </div>

                {discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Diskon Medusa V2</span>
                    <span>-{formatRupiah(discountTotal)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500 items-center">
                  <span>Ongkos Kirim</span>
                  {shippingTotal === 0 && subtotal > 0 ? (
                    <span className="text-emerald-600 font-black flex items-center gap-1">FREE</span>
                  ) : (
                    <span className="text-slate-900">{formatRupiah(shippingTotal)}</span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 mb-8 relative z-10">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bayar</span>
                  <span className="text-2xl font-black text-blue-600 leading-none">{formatRupiah(total)}</span>
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                {step === 1 ? (
                  <button
                    onClick={proceedToReview}
                    className="w-full bg-[#1a2b43] hover:bg-slate-800 text-white font-black py-4 rounded-xl transition-all shadow-lg text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 group disabled:opacity-50"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Memproses...' : 'Lanjut Ke Review'}
                    {!isProcessing && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                  </button>
                ) : step === 2 ? (
                  <button
                    onClick={proceedToPayment}
                    className="w-full bg-[#1a2b43] hover:bg-slate-800 text-white font-black py-4 rounded-xl transition-all shadow-lg text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 group disabled:opacity-50"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Memproses...' : 'Lanjut Ke Pembayaran'}
                    {!isProcessing && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                  </button>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-blue-200 text-[10px] uppercase tracking-widest disabled:opacity-50"
                    disabled={!paymentMethod || isProcessing}
                  >
                    {isProcessing ? 'Sedang Membayar...' : 'Konfirmasi & Bayar'}
                  </button>
                )}

                {step > 1 && !isProcessing && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="w-full bg-slate-50 text-slate-500 font-bold py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200"
                  >
                    Kembali
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

