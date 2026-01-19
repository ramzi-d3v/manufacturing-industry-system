"use client";

import Link from "next/link";
import { Factory, Package, ClipboardList, BadgeCheck, Truck, Settings } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black px-6 py-12">
      <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-3">
        404
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        The page you are looking for could not be found.
      </p>

      <div className="w-full max-w-md grid gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
        >
          <Factory className="h-5 w-5 text-blue-500" />
          <span>Go to Dashboard</span>
        </Link>

        <Link
          href="/inventory"
          className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
        >
          <Package className="h-5 w-5 text-emerald-500" />
          <span>Inventory Management</span>
        </Link>

        <Link
          href="/production"
          className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
        >
          <ClipboardList className="h-5 w-5 text-orange-500" />
          <span>Production & Work Orders</span>
        </Link>

        <Link
          href="/quality"
          className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
        >
          <BadgeCheck className="h-5 w-5 text-purple-500" />
          <span>Quality Control</span>
        </Link>

        <Link
          href="/dispatch"
          className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
        >
          <Truck className="h-5 w-5 text-red-500" />
          <span>Warehouse & Dispatch</span>
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
        >
          <Settings className="h-5 w-5 text-gray-500" />
          <span>System Settings</span>
        </Link>
      </div>

      <Link
        href="/"
        className="mt-10 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        Back to Homepage
      </Link>
    </main>
  );
}
