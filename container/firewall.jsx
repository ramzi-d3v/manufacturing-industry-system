"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ProtectedPage({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/signup"); 
      } else {
        setUser(currentUser);
      }
    });

    return () => unsubscribe(); // Cleanup listener
  }, [router]);

  if (!user) return null; // Render nothing until user is set

  return <>{children}</>;
}
