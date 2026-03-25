"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ComplitePageGuard from "@/container/complitePageGuard";
import { usePathname } from "next/navigation";
import Dutton from "@/components/button";
import { Roboto } from 'next/font/google'
import { Toaster } from "@/components/ui/sonner"
const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={roboto.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased dark">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {/* Top Left Glow - Brighter Purple */}
          <div className="absolute -top-[0%] -left-[10%] h-50 w-50 rounded-full bg-purple-500/30 blur-[100px] animate-pulse-bright-1" />
         
        </div>
        {children}
        <Toaster />
      </body>
    </html>
  );
}