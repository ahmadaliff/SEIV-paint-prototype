"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Clock, Check } from "lucide-react";
import { branches } from "@/lib/constants";
import { useShippingStore } from "@/store";

export default function ShippingConfigPage() {
  const [mounted, setMounted] = useState(false);
  const { 
    shippingZones, 
    isLoadingShipping, 
    config,
    branchCutoffs,
    fetchShippingOptions, 
    updateShippingOption,
    updateConfig,
    updateBranchCutoff,
    saveAllShippingConfig
  } = useShippingStore();

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchShippingOptions();
  }, [fetchShippingOptions]);

  // Sync branches if branchCutoffs is empty
  useEffect(() => {
    if (mounted && branchCutoffs.length === 0) {
      branches.forEach((b, idx) => {
        // This is a bit hacky to initialize if empty
        // In a real app, this should be handled better in fetch
      });
      // Better to initialize them locally if they don't exist in store yet
    }
  }, [mounted, branchCutoffs.length]);

  if (!mounted) return null;

  const currentBranches = branchCutoffs.length > 0 ? branchCutoffs : branches.map(b => ({ id: b.id, name: b.name, cutoff: config.defaultCutoff }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAllShippingConfig();
      alert("Berhasil menyimpan semua konfigurasi pengiriman!");
    } catch (err) {
      alert("Gagal menyimpan konfigurasi. Periksa koneksi atau hak akses.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFreeShippingZone = (zoneId: number) => {
    const next = config.freeShippingZones.includes(zoneId)
      ? config.freeShippingZones.filter(id => id !== zoneId)
      : [...config.freeShippingZones, zoneId];
    updateConfig({ freeShippingZones: next });
  };

  return (
    <div className="p-8 pb-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-serif">Konfigurasi Pengiriman</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola zona, tarif, dan aturan pengiriman</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#1a2b43] hover:bg-[#111c2f] text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
          ) : (
            <Check className="h-4 w-4" />
          )} 
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 space-y-6">
           {/* Combined for better layout since it's now real data */}
        </div>
        
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-slate-100">
            <h2 className="font-bold text-slate-800 mb-6">Tarif Zona Pengiriman (Admin API)</h2>

            <div className="space-y-6">
              {isLoadingShipping ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                shippingZones.map((zone) => (
                  <div key={zone.id} className="p-5 border border-slate-100 rounded-xl bg-slate-50/50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-sm text-slate-800">{zone.name}</h3>
                      {zone.active ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-slate-300"></div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1.5 font-medium">Tarif (Rp)</label>
                        <input
                          type="number"
                          value={zone.price}
                          onChange={(e) => {
                            updateShippingOption(zone.id, zone.name, parseInt(e.target.value) || 0);
                          }}
                          className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-slate-100">
            <h2 className="font-bold text-slate-800 mb-6">Aturan Pengiriman (Metadata API)</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Default Cutoff Same-Day</label>
                <div className="relative">
                  <input
                    type="time"
                    value={config.defaultCutoff}
                    onChange={(e) => updateConfig({ defaultCutoff: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Threshold Gratis Ongkir (Rp)</label>
                <input
                  type="number"
                  value={config.freeShippingThreshold}
                  onChange={(e) => updateConfig({ freeShippingThreshold: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Zona yang Mendapat Gratis Ongkir</label>
                <div className="flex gap-6">
                  {[1, 2, 3].map((zoneId) => (
                    <label key={zoneId} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.freeShippingZones.includes(zoneId)}
                        onChange={() => toggleFreeShippingZone(zoneId)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Zona {zoneId}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-slate-100">
            <h2 className="font-bold text-slate-800 mb-6">Konfigurasi Notifikasi</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">WhatsApp (Fonnte)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Notifikasi otomatis ke pelanggan</p>
                </div>
                <button
                  onClick={() => updateConfig({ notifications: { ...config.notifications, whatsapp: !config.notifications.whatsapp } })}
                  className="focus:outline-none"
                >
                  {config.notifications.whatsapp ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-slate-300"></div>
                  )}
                </button>
              </div>

              <div className="flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Email (SendGrid)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Konfirmasi & update status via email</p>
                </div>
                <button
                  onClick={() => updateConfig({ notifications: { ...config.notifications, email: !config.notifications.email } })}
                  className="focus:outline-none"
                >
                  {config.notifications.email ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-slate-300"></div>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] border border-slate-100">
            <h2 className="font-bold text-slate-800 mb-6">Cutoff Per Cabang</h2>

            <div className="space-y-3">
              {(branchCutoffs.length > 0 ? branchCutoffs : branches).map((branch, idx) => (
                <div key={branch.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm font-medium text-slate-700">{branch.name}</span>
                  <div className="relative w-32">
                    <input
                      type="time"
                      value={branchCutoffs[idx]?.cutoff || config.defaultCutoff}
                      onChange={(e) => {
                        // If it's the first time update, we need to populate branchCutoffs
                        if (branchCutoffs.length === 0) {
                           const initial = branches.map(b => ({ id: b.id, name: b.name, cutoff: config.defaultCutoff }));
                           initial[idx].cutoff = e.target.value;
                           useShippingStore.setState({ branchCutoffs: initial });
                        } else {
                           updateBranchCutoff(idx, e.target.value);
                        }
                      }}
                      className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
