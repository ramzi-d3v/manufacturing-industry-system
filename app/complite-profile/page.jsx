"use client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { auth, getFirestoreDB } from "@/lib/firebase"; 
import { onAuthStateChanged, reload } from "firebase/auth"; // Added reload
import { doc, onSnapshot } from "firebase/firestore"; 

import { EmailVerificationAlert } from "@/components/VerificationEmailPending";
import { StepperFormDemo } from "@/container/stapper";
import { ApprovalGuard } from "@/components/post-complete";

export default function CompliteProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 1. Auth State & Verification Polling
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/signin");
      } else {
        setUser(currentUser);
        setEmailVerified(currentUser.emailVerified);
      }
      setLoading(false);
    });

    // POLLING LOGIC: Check every 3 seconds if the email is verified
    const interval = setInterval(async () => {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        await reload(auth.currentUser); // Force-refresh the user data from Firebase
        if (auth.currentUser.emailVerified) {
          setEmailVerified(true);
          toast.success("Email verified successfully!");
        }
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [router]);

  // 2. Approval Listener (Real-time)
  useEffect(() => {
    if (!user || !isSubmitted) return;

    const db = getFirestoreDB();
    const unsubApproval = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.isApproved === true) {
          toast.success("Account Approved! Redirecting...");
          router.push("/"); 
        }
      }
    });

    return () => unsubApproval();
  }, [user, isSubmitted, router]);

  if (loading) return null;

  // This will now switch to the form automatically when emailVerified becomes true
  if (!emailVerified) {
    return <EmailVerificationAlert />;
  }

  if (isSubmitted) {
    return <ApprovalGuard />; 
  }

  return (
    <div className="p-6">
      <h1 className="text-lg mb-4 font-mono border-b-2 border-dotted pb-2">
        Complete Profile Page
      </h1>
      <div className="mt-24">
        <StepperFormDemo onComplete={() => setIsSubmitted(true)} />
      </div>
    </div>
  );
}