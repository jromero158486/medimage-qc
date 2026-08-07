import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedImage QC — Browser Image Quality Control",
  description: "Privacy-first technical quality assessment for medical and scientific images.",
  keywords: ["medical imaging", "image quality", "computer vision", "quality control", "browser"],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="background-grid" aria-hidden="true" />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
