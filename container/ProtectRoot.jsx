"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase"; // Ensure db (getFirestore) is exported from your config

export default function ProtectedPage({ children }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        // 1. Check if the user is authenticated
        if (!currentUser) {
          router.replace("/signup");
          return;
        }

        // 2. Optional: Check if email is verified
        if (!currentUser.emailVerified) {
          router.replace("/complite-profile"); // Or wherever your verification logic lives
          return;
        }

        // 3. Fetch user approval status from Firestore
        const userDocRef = doc(db, "user_details", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();

          if (userData.isApproved === true) {
            setAllowed(true);
            router.replace("/");
          } else {
            // User exists but is not yet approved
            router.replace("/complite-profile"); 
          }
        } else {
          // No user document found in Firestore
          router.replace("/complite-profile");
        }
      } catch (error) {
        console.error("Auth protection error:", error);
        router.replace("/signup");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Show a clean loading state while verifying credentials
  
  return allowed ? <>{children}</> : null;
}