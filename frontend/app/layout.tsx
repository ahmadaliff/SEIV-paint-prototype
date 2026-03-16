import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", // Tambahkan variabel ini
});

export const metadata: Metadata = {
  title: "SEIV Paint E-Commerce",
  description: "Prototype platform B2C and B2B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head /> 
      <body className={`${inter.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
