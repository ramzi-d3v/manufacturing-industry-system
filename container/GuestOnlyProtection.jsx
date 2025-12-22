"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function GuestOnlyPage({ children, redirectTo = "/complite-profile" }) {
  const router = useRouter();
  const [checkedAuth, setCheckedAuth] = useState(false); // Track if Firebase checked

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Redirect immediately if logged in
        router.replace(redirectTo);
      } else {
        setCheckedAuth(true); // Allow page render for guests
      }
    });

    return () => unsubscribe();
  }, [router, redirectTo]);

  // Until we know the auth state, render nothing
  if (!checkedAuth) return null;

  return <>{children}</>;
}
