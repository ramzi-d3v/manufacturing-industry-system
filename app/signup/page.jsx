"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { SignupForm } from "@/components/signup-form";
import { EmailVerificationAlert } from "@/components/VerificationEmailPending";

const PENDING_VERIFICATION_KEY = "email_verification_pending";

export default function SignupPage() {
  const router = useRouter();
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: read localStorage to see if a verification is pending
  useEffect(() => {
    const pendingFlag = localStorage.getItem(PENDING_VERIFICATION_KEY);
    if (pendingFlag === "true") {
      setShowVerificationAlert(true);
      // We'll let the auth listener populate the actual user object
    }
    setIsLoading(false);
  }, []);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        // Email verified – clear pending and redirect to profile completion
        localStorage.removeItem(PENDING_VERIFICATION_KEY);
        localStorage.removeItem(`${PENDING_VERIFICATION_KEY}_email`);
        setShowVerificationAlert(false);
        router.push("/complite-profile");
      } else if (user && !user.emailVerified && showVerificationAlert) {
        // User is logged in but not verified – update pending user for alert component
        setPendingUser(user);
        // Ensure flag is set
        localStorage.setItem(PENDING_VERIFICATION_KEY, "true");
        localStorage.setItem(`${PENDING_VERIFICATION_KEY}_email`, user.email || "");
      } else if (!user && showVerificationAlert) {
        // No user but alert is shown – clean up and redirect to sign in
        localStorage.removeItem(PENDING_VERIFICATION_KEY);
        localStorage.removeItem(`${PENDING_VERIFICATION_KEY}_email`);
        setShowVerificationAlert(false);
        router.push("/signin");
      }
    });
    return () => unsubscribe();
  }, [router, showVerificationAlert]);

  const handleSignupSuccess = (user) => {
    // Called by SignupForm after successful account creation
    setShowVerificationAlert(true);
    setPendingUser(user);
  };

  if (isLoading) {
    return (
      <div className="relative h-screen w-full flex items-center justify-center bg-[#050505]">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full flex items-center justify-center bg-[#050505] p-4 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/10 blur-[100px]" />
      </div>

      <div>
        {showVerificationAlert ? (
          <EmailVerificationAlert user={pendingUser} />
        ) : (
          <SignupForm onSignupSuccess={handleSignupSuccess} />
        )}
      </div>
    </div>
  );
}