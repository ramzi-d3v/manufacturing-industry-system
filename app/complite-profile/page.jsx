"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { EmailVerificationAlert } from "@/components/VerificationEmailPending";
import { StepperFormDemo } from "@/container/stapper";

export default function CompliteProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true); // <-- new loading state

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/signin");
      } else {
        setUser(currentUser);
        setEmailVerified(currentUser.emailVerified);
      }
      setLoading(false); // <-- finished loading
    });

    return () => unsubscribe();
  }, [router]);

  // Poll email verification
  useEffect(() => {
    if (!user || emailVerified) return;

    const interval = setInterval(async () => {
      await user.reload();
      if (user.emailVerified) {
        setEmailVerified(true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, emailVerified]);

  if (loading) {
    return null; // <-- don’t render anything until Firebase is ready
  }

  // Show pending component if not verified
  if (!emailVerified) {
    return <EmailVerificationAlert />;
  }

  // Email verified → show main content
  return (
    <div className="p-6 ">
      <h1 className="text-lg  mb-4 font-mono border-b-2 border-dotted pb-2">Complete Profile Page</h1>
      
      <div className="mt-24">
        <StepperFormDemo/>
      </div>
    </div>
  );
}
