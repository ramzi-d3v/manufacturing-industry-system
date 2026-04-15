"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconArrowRight, IconBuildingWarehouse, IconChartBar, IconTruck } from "@tabler/icons-react";

export default function DarkHeroPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      {/* Hero Content */}
      <div className="max-w-4xl mx-auto text-center">
        {/* Optional small badge */}
        <Badge variant="outline" className="mb-6 border-gray-700 text-gray-300 bg-gray-900/50">
          Next‑Gen Manufacturing Platform
        </Badge>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
          Complete Manufacturing{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            Intelligence System
          </span>
        </h1>

        <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
          Streamline your entire operation — from raw materials to finished goods.
          Real‑time insights, automated quality control, and seamless supply chain management.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-600/20">
              Get Started <IconArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="outline" className="border-gray-700 text-gray-200 hover:bg-gray-800">
              Sign Up
            </Button>
          </Link>
          <Link href="/signin">
            <Button size="lg" variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Optional subtle feature icons (just to fill space, can remove) */}
        <div className="flex flex-wrap justify-center gap-6 mt-12 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <IconBuildingWarehouse className="h-4 w-4 text-indigo-400" />
            <span>Warehouse Mgmt</span>
          </div>
          <div className="flex items-center gap-2">
            <IconTruck className="h-4 w-4 text-indigo-400" />
            <span>Supply Chain</span>
          </div>
          <div className="flex items-center gap-2">
            <IconChartBar className="h-4 w-4 text-indigo-400" />
            <span>Analytics</span>
          </div>
        </div>
      </div>
    </div>
  );
}