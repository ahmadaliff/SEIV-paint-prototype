"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
const slides = [
  {
    id: 1,
    image: "https://placehold.co/1200x600/1e293b/1e293b?text=+",
    title: "Warna Impian Anda,\nKualitas Terjamin",
    subtitle: "50+ pilihan warna premium untuk setiap ruangan",
    buttonText: "Lihat Koleksi →",
    buttonLink: "/products"
  },
  {
    id: 2,
    image: "https://placehold.co/1200x600/1e293b/1e293b?text=+",
    title: "Pelapis Anti Bocor\nNomor Satu",
    subtitle: "Garansi perlindungan cuaca ekstrem untuk rumah Anda.",
    buttonText: "Beli Sekarang →",
    buttonLink: "/products?category=pelapis-anti-bocor"
  },
  {
    id: 3,
    image: "https://placehold.co/1200x600/1e293b/1e293b?text=+",
    title: "Promo Distributor\nEksklusif",
    subtitle: "Daftar sekarang dan nikmati potongan harga langsung 15% (Silver).",
    buttonText: "Daftar Distributor →",
    buttonLink: "/register-distributor"
  },
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden bg-[#1a2b43] group">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === current ? "opacity-100" : "opacity-0"
            }`}
        >
          <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute right-10 top-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-white opacity-20">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
          </div>

          <Image
            src={slide.image}
            alt="Hero Background"
            fill
            className="object-cover opacity-0"
            priority={index === 0}
            unoptimized
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 sm:px-8 md:px-20 max-w-4xl">
            <p className="text-yellow-500 font-bold mb-3 sm:mb-4 tracking-wider text-xs sm:text-sm">SEIV PAINT PREMIUM</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight whitespace-pre-line drop-shadow-md">
              {slide.title}
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-300 mb-6 sm:mb-8 max-w-xl">
              {slide.subtitle}
            </p>
            <div>
              <a
                href={slide.buttonLink}
                className="inline-block bg-[#d99821] hover:bg-[#c4881d] text-white font-medium text-sm sm:text-base px-6 sm:px-8 py-2.5 sm:py-3 rounded-md transition-colors shadow-lg"
              >
                {slide.buttonText}
              </a>
            </div>
          </div>
        </div>
      ))}
      <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2 rounded-full transition-all ${index === current ? "w-6 bg-[#d99821]" : "w-2 bg-slate-400 hover:bg-slate-300"
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
