"use client";

import { useEffect, useLayoutEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function GlobalAuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Pages that should remain public
  const publicPaths = ["/", "/signin", "/signup", "/forgot-password", "/verification-pending"];

  useLayoutEffect(() => {
    if (loading) return;
    if (isAuthenticated) return;

    // Allow if current path is a public path
    if (publicPaths.some((p) => pathname.startsWith(p))) return;

    // Otherwise redirect to signin
    router.replace("/signin");
  }, [isAuthenticated, loading, pathname, router]);

  if (loading) return null;

  if (!isAuthenticated && !publicPaths.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return children;
}
