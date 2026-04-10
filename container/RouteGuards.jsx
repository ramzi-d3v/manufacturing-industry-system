"use client";

import { useEffect, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * AuthGuard: Protect routes that require authentication
 * Redirects unauthenticated users to /signin
 * Prevents access to unapproved users
 */
export function AuthGuard({ children }) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useLayoutEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/signin");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}

/**
 * GuestGuard: Protect pages to be viewed only by unauthenticated users
 * Redirects authenticated users to /home
 */
export function GuestGuard({ children, redirectTo = "/home" }) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useLayoutEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, loading, router, redirectTo]);

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return null;
  }

  return children;
}

/**
 * ApprovedGuard: Protect routes requiring admin approval
 * Redirects unapproved users to /complite-profile
 * Only allows approved users
 */
export function ApprovedGuard({ children, redirectTo = "/complite-profile" }) {
  const router = useRouter();
  const { isAuthenticated, isEmailVerified, isApproved, loading } = useAuth();

  useLayoutEffect(() => {
    if (loading) return;

    // Not authenticated
    if (!isAuthenticated) {
      router.replace("/signin");
      return;
    }

    // Email not verified
    if (!isEmailVerified) {
      router.replace("/complite-profile");
      return;
    }

    // Not approved
    if (!isApproved) {
      router.replace(redirectTo);
      return;
    }
  }, [isAuthenticated, isEmailVerified, isApproved, loading, router, redirectTo]);

  if (loading) {
    return null;
  }

  // Show nothing while redirecting
  if (!isAuthenticated || !isEmailVerified || !isApproved) {
    return null;
  }

  return children;
}

/**
 * ProfileCompletionGuard: Protect profile completion page
 * Allows users who are email verified but not yet approved
 * Prevents approved users from accessing
 */
export function ProfileCompletionGuard({ children }) {
  const router = useRouter();
  const { isAuthenticated, isEmailVerified, isApproved, loading } = useAuth();

  useLayoutEffect(() => {
    if (loading) return;

    // Not authenticated
    if (!isAuthenticated) {
      router.replace("/signin");
      return;
    }

    // Already approved - redirect to home
    if (isApproved) {
      router.replace("/home");
      return;
    }
  }, [isAuthenticated, isApproved, loading, router]);

  if (loading) {
    return null;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Already approved
  if (isApproved) {
    return null;
  }

  return children;
}
