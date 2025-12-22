"use client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { auth, getFirestoreDB } from "@/lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
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

  // 1. Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/signin");
      } else {
        setUser(currentUser);
        setEmailVerified(currentUser.emailVerified);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // 2. Approval Listener (Real-time)
  useEffect(() => {
    if (!user || !isSubmitted) return;

    const db = getFirestoreDB();
    // Listen to the specific user document for changes
    const unsubApproval = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // If an admin manually changes "isApproved" to true in Firebase
        if (data.isApproved === true) {
          toast.success("Account Approved! Redirecting...");
          router.push("/"); 
        }
      }
    });

    return () => unsubApproval();
  }, [user, isSubmitted, router]);

  if (loading) return null;

  if (!emailVerified) {
    return <EmailVerificationAlert />;
  }

  // If they finished the form but aren't approved yet, show this
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