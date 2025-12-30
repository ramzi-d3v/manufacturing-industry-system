"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase"; 
import { onAuthStateChanged, reload } from "firebase/auth";

// Your Components
import { EmailVerificationAlert } from "@/components/VerificationEmailPending";
import { StepperFormDemo } from "@/container/stapper";
import { ApprovalGuard } from "@/components/post-complete";

export default function CompleteProfilePage() {
  const [user, setUser] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Added to prevent UI flash

  useEffect(() => {
    // 1. Check Local Storage on mount (Survives reloads and shared across tabs)
    const postState = localStorage.getItem('poststate');
    if (postState === '1') {
      setIsSubmitted(true);
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setEmailVerified(currentUser.emailVerified);
      }
      setIsLoading(false); // Stop loading once auth is checked
    });

    const interval = setInterval(async () => {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        await reload(auth.currentUser);
        if (auth.currentUser.emailVerified) {
          setEmailVerified(true);
        }
      }
    }, 3000);

    return () => { 
      unsubscribe(); 
      clearInterval(interval); 
    };
  }, []);

  // 2. Handle the completion from the Stepper
  const handleComplete = (val) => {
    localStorage.setItem('poststate', '1'); // Persist for other tabs/reloads
    setIsSubmitted(val); 
  };

  // 3. Show nothing (null) while checking auth and storage to prevent "flash"
  if (isLoading) return null;

  // 4. Ensure email is verified before showing anything else
  if (!emailVerified) {
    return <EmailVerificationAlert />;
  } 

  // 5. If submitted (from state or localStorage), lock into ApprovalGuard
  if (isSubmitted) {
    return <ApprovalGuard user={user} />;
  }

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 font-sans text-slate-200 overflow-hidden">
      <div className="w-full max-w-6xl flex flex-col h-auto"> 
        
        <header className="w-full mb-8">
          <div className="flex items-end justify-between pb-3">
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight text-white ">
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

          <div className="relative h-[3px] w-full">
             <div 
                className="absolute inset-0 bg-gradient-to-r from-violet-500 via-violet-500/40 to-transparent" 
                style={{ clipPath: 'polygon(0 0, 100% 45%, 100% 55%, 0 100%)' }} 
             />
          </div>
        </header>

        <main className="w-full">
          <div className="">
            <StepperFormDemo onComplete={handleComplete} />
          </div>
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