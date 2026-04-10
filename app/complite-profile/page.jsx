"use client";

import { useEffect, useState } from "react";
import { EmailVerificationAlert } from "@/components/VerificationEmailPending";
import { StepperFormDemo } from "@/container/stapper";
import { ApprovalGuard } from "@/components/post-complete";
import { ProfileCompletionGuard } from "@/container/RouteGuards";
import { useAuth } from "@/context/AuthContext";

export default function CompleteProfilePage() {
  const { user, loading, isEmailVerified, isDeclined, rejectionReason } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Read local submission flag once user is available
  useEffect(() => {
    if (!user) {
      setIsSubmitted(false);
      return;
    }
    const savedState = localStorage.getItem(`poststate_${user.uid}`);
    setIsSubmitted(savedState === "1");
  }, [user]);

  if (loading) return null;

  // If email not verified, show verification prompt inside the guarded page
  if (user && !isEmailVerified) {
    return <EmailVerificationAlert />;
  }

  return (
    <ProfileCompletionGuard>
      {isSubmitted ? (
        <ApprovalGuard user={user} />
      ) : (
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
                  <span className="relative flex h-1.5 w-1.5 ">
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

              <StepperFormDemo
                onComplete={(val) => {
                  if (val && user) {
                    localStorage.setItem(`poststate_${user.uid}`, "1");
                  }
                  setIsSubmitted(val);
                }}
              />
            </main>

            <footer className="mt-6">
              <p className="text-[9px] text-slate-700 text-center uppercase tracking-[0.3em]">
                Identity Management Protocol v2.0
              </p>
            </footer>
          </div>
        </div>
      )}
    </ProfileCompletionGuard>
  );
}