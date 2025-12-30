"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDB } from "@/lib/firebase";

export default function RouteGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false); // Track if current page is valid
  const router = useRouter();
  const pathname = usePathname();
  const db = getFirestoreDB();
  const auth = getFirebaseAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // 1. Handle Unauthenticated users
      if (!user) {
        if (pathname !== "/signin" && pathname !== "/signup") {
          setIsAuthorized(false);
          router.replace("/signin");
        } else {
          setIsAuthorized(true);
        }
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        const isSubmitted = userData?.isSubmitted === true;
        const isApproved = userData?.isApproved === true;
        const isSetupPage = pathname === "/complite-profile";

        // CASE 1: Fully Approved
        if (isApproved) {
          if (isSetupPage) {
            setIsAuthorized(false);
            router.replace("/");
          } else {
            setIsAuthorized(true);
          }
        } 
        
        // CASE 2 & 3: Not submitted OR Pending Approval
        else {
          if (!isSetupPage) {
            setIsAuthorized(false);
            router.replace("/complite-profile");
          } else {
            setIsAuthorized(true);
          }
        }

      } catch (error) {
        console.error("Guard Error:", error);
        setIsAuthorized(true); // Fallback to avoid complete lock
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [pathname, router, db, auth]);

  // Show loading screen if Firebase is working OR if we are waiting for a redirect to finish
  if (loading || !isAuthorized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-violet-500 "></div>
          
        </div>
      </div>
    );
  }

  return children;
}