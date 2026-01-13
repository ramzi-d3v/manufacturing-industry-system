"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ComplitePageGuard from "@/container/complitePageGuard";
import { usePathname } from "next/navigation";
import Dutton from "@/components/button";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



 


export default function RootLayout({ children }) {
 
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
        >
  
        {children}
       
         
       
      </body>
    </html>
  );
}
