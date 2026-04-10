"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { motion } from "framer-motion";
import { Loader, ShieldAlert, LogOut, RotateCcw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

/**
 * ApprovalStatusComponent: Handles all approval states (pending, approved, declined)
 * - Shows loading during pending approval
 * - Shows rejection message with recovery option
 * - Auto-redirects on approval
 */
export function ApprovalStatusComponent({ children }) {
  const router = useRouter();
  const { user, userDetails, isApproved, isDeclined, rejectionReason, loading } = useAuth();
  const [isRecovering, setIsRecovering] = useState(false);

  useLayoutEffect(() => {
    if (loading) return;
    // If there are no children and the user is approved, redirect to home
    if (isApproved && !children) {
      router.replace("/home");
    }
  }, [isApproved, loading, children, router]);

  if (loading || !user) {
    return null;
  }

  // Already approved - show children
  if (isApproved && children) {
    return children;
  }

  // Handle declined status
  if (isDeclined) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center bg-[#050505] font-sans selection:bg-red-500/30 text-white">
        {/* Ambient Red Background Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center max-w-lg px-6"
        >
          {/* Icon Section */}
          <div className="relative flex items-center justify-center mb-12">
            <div className="absolute size-24 bg-red-500/20 rounded-full blur-2xl animate-pulse" />
            <div className="size-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ShieldAlert className="size-10 text-red-500" />
            </div>
          </div>

          {/* Content Section */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-white">Application Declined</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your application could not be approved at this time.
            </p>

            {/* Rejection Reason - if provided by admin */}
            {rejectionReason && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="size-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                      Reason for Rejection
                    </p>
                    <p className="text-sm text-slate-300 mt-2">{rejectionReason}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-white/10">
              <Button
                onClick={async () => {
                  setIsRecovering(true);
                  try {
                    const userRef = doc(db, "user_details", user.uid);
                    await updateDoc(userRef, {
                      isDeclined: false,
                      rejectionReason: null,
                      status: "re-submitting",
                    });
                    toast.success("Profile reset. Redirecting you back...");
                    // Redirect to profile completion page
                    router.replace("/complite-profile");
                  } catch (error) {
                    toast.error("Failed to reset profile. Please try again.");
                    console.error("Reset error:", error);
                  } finally {
                    setIsRecovering(false);
                  }
                }}
                disabled={isRecovering}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-2"
              >
                <RotateCcw className="size-4" />
                {isRecovering ? "Resetting..." : "Try Again"}
              </Button>

              <Button
                onClick={async () => {
                  try {
                    await signOut(auth);
                    toast.success("Signed out successfully");
                    router.replace("/signin");
                  } catch (error) {
                    toast.error("Failed to sign out");
                    console.error("Logout error:", error);
                  }
                }}
                variant="outline"
                className="w-full border-white/10 text-white hover:bg-white/5 flex items-center justify-center gap-2"
              >
                <LogOut className="size-4" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-12 text-center text-[11px] text-slate-600 uppercase tracking-wider">
            <p>Contact support if you believe this is an error</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Default: Show pending approval screen
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
        {/* Loader Section */}
        <div className="relative flex items-center justify-center mb-12">
          <div className="absolute size-24 bg-violet-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative">
            <Loader
              className="size-16 text-violet-500 animate-spin"
              style={{ animationDuration: "1.5s" }}
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-white">Awaiting Approval</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Your application has been submitted and is being reviewed by our admin team.
            <br />
            We'll notify you as soon as a decision is made.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="mt-12 space-y-2">
          <div className="flex items-center gap-2 justify-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">
              Status: PENDING REVIEW
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-[11px] text-slate-600 uppercase tracking-wider">
          <p>This page will update automatically when a decision is made</p>
        </div>
      </motion.div>
    </div>
  );
}
