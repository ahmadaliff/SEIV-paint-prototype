import { PaintRoller, Paintbrush, Droplets, SprayCan, Wrench } from "lucide-react";

export function CategoryGrid() {
  const categoriesWithStyle = [
    { id: 1, name: 'Cat Interior', icon: <PaintRoller className="h-6 w-6 text-orange-500" />, bg: "bg-orange-100" },
    { id: 2, name: 'Cat Eksterior', icon: <Droplets className="h-6 w-6 text-emerald-500" />, bg: "bg-emerald-100" },
    { id: 3, name: 'Cat Kayu & Besi', icon: <Wrench className="h-6 w-6 text-blue-500" />, bg: "bg-blue-100" },
    { id: 4, name: 'Cat Lantai', icon: <div className="h-6 w-6 bg-slate-300 rounded-sm" />, bg: "bg-slate-100" },
    { id: 5, name: 'Cat Dekoratif', icon: <SprayCan className="h-6 w-6 text-pink-500" />, bg: "bg-pink-100" },
    { id: 6, name: 'Produk Pelengkap', icon: <Paintbrush className="h-6 w-6 text-amber-600" />, bg: "bg-amber-100" },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6 font-serif">Kategori Produk</h2>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {categoriesWithStyle.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-50 cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 group"
            >
              <div className={`p-3 rounded-2xl mb-4 transition-transform group-hover:scale-110 ${cat.bg}`}>
                {cat.icon}
              </div>
              <span className="text-xs font-bold text-slate-700 text-center">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
