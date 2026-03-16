"use client";

import { useState } from "react";
import { categories } from "@/lib/constants";
import { Filter, X } from "lucide-react";

export function ProductFilter() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 shadow-sm"
        >
          <Filter className="h-4 w-4" />
          Filter & Urutkan
        </button>
      </div>

      {/* Filter Sidebar (Desktop) / Drawer (Mobile) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:shadow-none lg:w-full lg:z-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col p-6 lg:p-0">
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <h2 className="text-xl font-bold text-slate-800">Filter</h2>
            <button onClick={() => setIsMobileOpen(false)}>
              <X className="h-6 w-6 text-slate-500" />
            </button>
          </div>

          <div className="space-y-8">
            {/* Categories */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Kategori</h3>
              <div className="space-y-3">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center group cursor-pointer">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.name)}
                        onChange={() => toggleCategory(cat.name)}
                        className="peer h-5 w-5 appearance-none rounded border-2 border-slate-200 checked:border-blue-600 checked:bg-blue-600 transition-all cursor-pointer"
                      />
                      <CheckIcon className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none" />
                    </div>
                    <span className="ml-3 text-sm text-slate-600 group-hover:text-blue-600 font-medium transition-colors">
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Rentang Harga</h3>
              <div className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="2000000"
                  step="50000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded">Rp 0</span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Rp {priceRange[1].toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Rating</h3>
              <div className="space-y-2">
                {[4, 3, 2].map((rating) => (
                  <label key={rating} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <div className="flex items-center text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className={`h-3.5 w-3.5 ${i < rating ? "fill-current" : "text-slate-200"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 group-hover:text-slate-800 transition-colors uppercase font-bold tracking-tight">
                      & Keatas
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 lg:hidden">
            <button
              onClick={() => setIsMobileOpen(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg"
            >
              Terapkan Filter
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}
