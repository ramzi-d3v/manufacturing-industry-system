"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { getFirestoreDB, auth } from "@/lib/firebase"; 
import { signOut } from "firebase/auth";
import { motion } from "framer-motion";
import { Loader, ShieldAlert, LogOut, RotateCcw } from "lucide-react"; 
import { toast } from "sonner";

export function ApprovalGuard({ user, children }) {
  const [status, setStatus] = useState({ approved: false, declined: false });
 
  const db = getFirestoreDB();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(doc(db, "user_details", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const isApproved = !!data?.isApproved;
        const isDeclined = !!data?.isDeclined;

        setStatus({
          approved: isApproved,
          declined: isDeclined,
        });

        if (isApproved) {
          router.replace("/");
        }
      }
    });

    return () => unsub();
  }, [user, db, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/signin");
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
      console.error(error);
    }
  };

  const handleResetProfile = async () => {
    try {
      const userRef = doc(db, "user_details", user.uid);
      await updateDoc(userRef, {
        isDeclined: false,
        isSubmitted: false, 
        status: "re-submitting"
      });
      toast.success("Profile reset. You can now edit your details.");
    } catch (error) {
      toast.error("Failed to reset profile.");
      console.error(error);
    }
  };

  if (status.approved) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#050505] font-sans selection:bg-violet-500/30 text-white">
      
      {/* Ambient Purple Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center max-w-lg px-6"
      >
        {/* Loader Section - Restored to original */}
        <div className="relative flex items-center justify-center mb-12">
          <div className="absolute size-24 bg-violet-500/20 rounded-full blur-2xl animate-pulse" />
          
          {status.declined ? (
            <div className="size-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ShieldAlert className="size-10 text-red-500" />
            </div>
          ) : (
            <div className="relative">
              <Loader 
                className="size-16 text-violet-500 animate-spin animate-pulse" 
                style={{ animationDuration: '1.5s, 2s' }} 
              />
            </div>
          )}
        </div>

        {/* Typography */}
        <div className="text-center space-y-5">
          <h1 className="text-3xl uppercase tracking-tight font-bold">
            {status.declined ? "Review Complete" : "Profile Under Review"}
          </h1>
          
          <p className="text-slate-400 text-lg max-w-sm mx-auto leading-tight tracking-tight">
            {status.declined 
              ? "Your application could not be verified. You can update your information and try again."
              : "Our team is currently reviewing your details. You'll have full access as soon as we verify your profile."}
          </p>
        </div>

        {/* Status Metrics */}
        <div className="mt-14 flex items-center gap-8">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2 font-bold">Account Type</span>
            <span className="text-sm tracking-wide text-white font-medium">Standard User</span>
          </div>
          
          <div className="h-8 w-px bg-white/10" />
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold mb-2">Current Step</span>
            <span className={`text-sm tracking-wide font-medium ${status.declined ? 'text-red-500' : 'text-violet-400 animate-pulse'}`}>
              {status.declined ? 'Declined' : 'Final Verification'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4 mt-14 w-full">
          {status.declined ? (
            <>
              <button 
                onClick={handleResetProfile}
                className="group flex items-center justify-center gap-2 w-full px-8 py-3 rounded-full bg-white text-black hover:bg-slate-200 transition-all duration-300 text-xs font-bold uppercase tracking-widest cursor-pointer shadow-lg"
              >
                <RotateCcw className="size-3 group-hover:rotate-[-45deg] transition-transform" />
                Edit Profile
              </button>
              
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-[10px] text-slate-500 hover:text-red-400 uppercase tracking-widest transition-colors cursor-pointer font-bold"
              >
                <LogOut className="size-3" />
                Logout & Sign In
              </button>
            </>
          ) : (
            <button 
              onClick={handleLogout}
              className="group flex items-center gap-2 px-8 py-2.5 rounded-full border border-white/10  uppercase tracking-widest cursor-pointer"
            >
              <LogOut className="size-3 group-hover:-translate-x-1 transition-transform" />
              SIGN OUT
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}