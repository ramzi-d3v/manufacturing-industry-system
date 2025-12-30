"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ProtectedPage({ children }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      //  Not logged in
      if (!currentUser) {
        setAllowed(false);
        router.replace("/signup");
        return;
      }

      //  Email not verified
      if (!currentUser.emailVerified) {
        setAllowed(false);
        router.replace("/complite-profile"); 
        return;
      }

  
      setAllowed(true);
    });

    return () => unsubscribe();
  }, [router]);

  //Block render until allowed
  if (!allowed) return null;

  return <>{children}</>;
}
