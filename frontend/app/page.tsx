import { HeroCarousel } from "@/components/organisms/HeroCarousel";
import { CategoryGrid } from "@/components/organisms/CategoryGrid";
import { TrustBadges } from "@/components/molecules/TrustBadges";
import { ProductGrid } from "@/components/organisms/ProductGrid";
import { Header } from "@/components/organisms/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />
      <main>
        <HeroCarousel />
        <TrustBadges />
        <CategoryGrid />
        <ProductGrid />
      </main>
      <footer className="bg-slate-900 py-12 text-center text-slate-400 text-sm mt-12">
        <p>&copy; {new Date().getFullYear()} SEIV Paint Indonesia. All rights reserved.</p>
        <p className="mt-2 text-xs opacity-50">Prototype Demo for Phincon Technical Test</p>
      </footer>
    </div>
  );
}
