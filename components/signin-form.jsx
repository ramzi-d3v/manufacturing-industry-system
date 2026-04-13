"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "firebase/auth"; 
import { auth } from "@/lib/firebase"; 
import { toast } from "sonner"; 
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock } from "lucide-react";

export function LoginForm({ className, ...props }) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);

  // Wait for client-side mount before using Firebase Auth
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle Auth State Changes
  useEffect(() => {
    if (!isClient) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !loading && !guestLoading) {
        router.replace("/");
      }
    });
    return () => unsubscribe();
  }, [isClient, router, loading, guestLoading]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back!");
      router.push("/");
    } catch (err) {
      setError("Invalid credentials.");
      toast.error("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, "ramzi.d3v@gmail.com", "Twokn5ive");
      toast.success("Guest access granted!");
      router.push("/home");
    } catch (err) {
      console.error("Guest login error:", err);
      setError("Guest login unavailable.");
      toast.error("Guest access failed.");
    } finally {
      setGuestLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isClient) return;
    const provider = new GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        toast.success("Logged in with Google!");
        router.replace("/");
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      // Don't show error for user-closed popup - it's intentional
      if (err.code === "auth/popup-closed-by-user") {
        // Silently handle - user intentionally closed the popup
        console.log("User closed Google sign-in popup");
      } else if (err.code === "auth/popup-blocked") {
        toast.error("Popup was blocked. Please allow popups for this site.");
      } else if (err.code === "auth/operation-not-allowed") {
        toast.error("Google sign-in is not enabled. Please contact support.");
      } else {
        toast.error("Google sign-in failed. Please try again.");
      }
      setLoading(false);
    }
  };

  // Prevent rendering until client-side (avoids web-storage errors)
  if (!isClient) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      {/* Glass card – no background blobs, pure glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("relative w-full max-w-md rounded-2xl  p-5 transition-all duration-300", className)}
        {...props}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex flex-col items-center gap-1 text-center mb-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-xs text-white/60">
              New here?{" "}
              <button 
                type="button"
                onClick={() => router.replace("/signup")}
                className="font-medium text-purple-300 hover:text-purple-200 transition-colors underline-offset-2 hover:underline"
              >
                Create Account
              </button>
            </p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            {/* Input Fields – compact like signup */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-white/80 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                  <Input
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-8 py-1.5 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs text-white/80">Password</label>
                  <button 
                    type="button" 
                    onClick={() => router.push("/forgot-password")}
                    className="text-[10px] text-white/40 hover:text-white/70 transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(
                      "pl-8 py-1.5 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl",
                      error ? "border-red-400 focus:border-red-400" : ""
                    )}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-1.5">
                <p className="text-[11px] text-red-300 text-center">{error}</p>
              </div>
            )}

            {/* Primary Action */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg transition-all duration-200 text-sm py-1.5 rounded-xl"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10"></span>
              </div>
              <div className="relative flex justify-center text-[9px] uppercase tracking-[0.3em] text-white/40">
                <span className="bg-transparent px-2">or</span>
              </div>
            </div>

            {/* Google Action */}
            <Button
              variant="outline"
              type="button"
              className="w-full h-9 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 transition-all text-xs uppercase tracking-widest"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-3.5 w-3.5">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Guest Mode */}
            <Button
              type="button"
              variant="ghost"
              className="w-full h-9 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all text-xs uppercase tracking-widest mt-1"
              onClick={handleGuestLogin}
              disabled={guestLoading}
            >
              {guestLoading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Visit as Guest"
              )}
            </Button>
          </form>

          {/* Expanded Legal Footer – compact */}
          <div className="mt-6 flex flex-col items-center gap-1 text-center text-[9px] text-white/40 uppercase tracking-[0.1em] leading-relaxed">
            <p>Protected by End-to-End Encryption</p>
            <div className="flex items-center gap-2">
              <a href="#" className="hover:text-white/70 transition-colors">Terms</a>
              <span className="w-0.5 h-0.5 bg-white/20 rounded-full" />
              <a href="#" className="hover:text-white/70 transition-colors">Privacy</a>
              <span className="w-0.5 h-0.5 bg-white/20 rounded-full" />
              <a href="#" className="hover:text-white/70 transition-colors">Cookies</a>
            </div>
            <p className="mt-1 opacity-50 text-[8px]">© 2026 Pro Inc.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}