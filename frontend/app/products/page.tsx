import { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/organisms/ProductGrid";
import { ProductFilter } from "@/components/organisms/ProductFilter";
import { Header } from "@/components/organisms/Header";

export const metadata: Metadata = {
  title: "Katalog Produk SEIV Paint - Kualitas & Warna Terbaik",
  description:
    "Jelajahi koleksi lengkap cat SEIV Paint. Dari cat tembok interior, eksterior, hingga pelapis anti bocor dan cat otomotif berkualitas tinggi.",
  openGraph: {
    title: "Katalog Produk SEIV Paint",
    description: "Kualitas & Warna Terbaik untuk Proyek Anda",
    images: ["/og-products.png"],
  },
};

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      {/* Search/Breadcrumb Header */}
      <div className="bg-[#1a2b43] text-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <nav className="flex items-center gap-2 text-xs text-slate-400 mb-4 font-bold uppercase tracking-widest">
                <Link href="/" className="hover:text-yellow-500 transition-colors">Beranda</Link>
                <span className="h-1 w-1 rounded-full bg-slate-600" />
                <span className="text-white">Produk</span>
              </nav>
              <h1 className="text-4xl font-black font-serif mb-2">Katalog Produk</h1>
              <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
                Temukan solusi pengecatan terbaik untuk setiap kebutuhan Anda dengan teknologi perlindungan terkini dari SEIV Paint.
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
                <div className="text-right">
                    <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-tighter">Total Produk</div>
                    <div className="text-2xl font-black">240+</div>
                </div>
                <div className="h-8 w-px bg-white/10 mx-2" />
                <div className="text-right">
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Kategori</div>
                    <div className="text-2xl font-black">6</div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filter */}
          <aside className="lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-28">
              <ProductFilter />
            </div>
          </aside>

          {/* Product Listing */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800">Menampilkan Semua Produk</h2>
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-tight text-slate-500">
                    <span>Urutkan:</span>
                    <select className="bg-transparent border-none focus:ring-0 text-slate-800 cursor-pointer">
                        <option>Terbaru</option>
                        <option>Harga Terendah</option>
                        <option>Harga Tertinggi</option>
                        <option>Terpopuler</option>
                    </select>
                </div>
            </div>
            
            <ProductGrid />
            
            {/* Pagination Mock */}
            <div className="mt-16 flex items-center justify-center gap-2">
                <button className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-blue-600 transition-all">
                    <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-lg shadow-blue-200">1</button>
                <button className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-white hover:text-blue-600 transition-all">2</button>
                <button className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-white hover:text-blue-600 transition-all">3</button>
                <span className="px-2 text-slate-400">...</span>
                <button className="h-10 w-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-blue-600 transition-all">
                    <ChevronRightIcon className="h-5 w-5" />
                </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    )
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    )
}
