"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { StepperFormDemo } from "@/container/stapper";
import { ApprovalGuard } from "@/components/post-complete";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDeclined, setIsDeclined] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/signup");
        return;
      }
      setUser(currentUser);
      setLoading(false);

      // Read submission flag from localStorage
      const savedState = localStorage.getItem(`poststate_${currentUser.uid}`);
      setIsSubmitted(savedState === "1");
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user is not authenticated (should have been redirected, but guard)
  if (!user) return null;

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 font-sans text-slate-200 overflow-hidden">
      <div className="w-full max-w-6xl flex flex-col h-auto">
        <header className="w-full mb-8">
          <div className="flex items-end justify-between pb-3">
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight text-white">
                Complete Profile
              </h1>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Finalize your identity details for system access.
              </p>
            </div>

            <div className="flex items-center gap-2 px-4 py-1 bg-white/[0.03] border border-white/10 rounded-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500"></span>
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">REGISTERING</span>
            </div>
          </div>

          <div className="relative h-[1px] w-full bg-white/5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-violet-500/40 to-transparent w-full shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
          </div>
        </header>

        <main className="w-full">
          {isDeclined && rejectionReason && (
            <div className="mb-6 p-4 rounded-md bg-red-900/60 border border-red-700 text-sm text-red-100">
              <strong className="uppercase text-xs tracking-wider">Declined:</strong>
              <div className="mt-1">{rejectionReason}</div>
            </div>
          )}

          {isSubmitted ? (
            <ApprovalGuard user={user} />
          ) : (
            <StepperFormDemo
              onComplete={(val) => {
                if (val && user) {
                  localStorage.setItem(`poststate_${user.uid}`, "1");
                }
                setIsSubmitted(val);
              }}
            />
          )}
        </main>

        <footer className="mt-6">
          <p className="text-[9px] text-slate-700 text-center uppercase tracking-[0.3em]">
            Identity Management Protocol v2.0
          </p>
        </footer>
      </div>
    </div>
  );
}