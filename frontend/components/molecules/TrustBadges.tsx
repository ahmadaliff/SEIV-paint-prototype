import { ShieldCheck, Truck, HeadphonesIcon, Clock } from "lucide-react";

export function TrustBadges() {
  const badges = [
    { icon: <ShieldCheck className="h-6 w-6 text-slate-500" />, title: "Garansi Warna", desc: "Hingga 15 tahun", bg: "bg-teal-50" },
    { icon: <Truck className="h-6 w-6 text-orange-500" />, title: "Gratis Ongkir", desc: "Pembelian >Rp 500rb", bg: "bg-slate-100" },
    { icon: <Clock className="h-6 w-6 text-yellow-500" />, title: "Same-Day Delivery", desc: "Order sebelum 12:00 WIB", bg: "bg-slate-100" },
    { icon: <HeadphonesIcon className="h-6 w-6 text-slate-600" />, title: "CS 24/7", desc: "Via WhatsApp & Email", bg: "bg-slate-100" },
  ];

  return (
    <section className="bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((badge, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${badge.bg}`}>
                {badge.icon}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">{badge.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
