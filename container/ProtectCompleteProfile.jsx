"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { auth, getFirestoreDB } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

export default function ClientRedirectGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Initialize from localStorage so it survives a refresh
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check if we were already locked from a previous session
    const savedLock = localStorage.getItem("profile_lock") === "true";
    if (savedLock) setIsLocked(true);

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const db = getFirestoreDB();
        // 2. Real-time listener for the 'isApproved' trigger
        const unsubscribeSnapshot = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            
            if (userData.isApproved === true) {
              // UNLOCK: User is approved, remove the lock from state and memory
              setIsLocked(false);
              localStorage.removeItem("profile_lock");
            } else if (pathname === "/complite-profile") {
              // LOCK: User entered the page, set the lock in state and memory
              setIsLocked(true);
              localStorage.setItem("profile_lock", "true");
            }
          }
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [pathname]);

  // 3. The Enforcer: If locked and trying to go anywhere else, snap back
  useEffect(() => {
    if (isLocked && pathname !== "/complite-profile") {
      router.replace("/complite-profile");
    }
  }, [pathname, isLocked, router]);

  // Prevent seeing other pages while the redirect is happening
  if (loading || (isLocked && pathname !== "/complite-profile")) {
    return null;
  }

  return children;
}