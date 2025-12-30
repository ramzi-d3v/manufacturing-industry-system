"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth"; 
import { auth } from "@/lib/firebase"; 
import { toast } from "sonner"; 
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export function LoginForm({ className, ...props }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Logged in with Google!");
      router.replace("/");
    } catch (err) {
      toast.error("Google sign-in failed.");
    }
  };

  return (
    <div className="relative h-screen w-full flex items-center justify-center bg-[#050505] p-4 overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/10 blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("relative z-10 w-full max-w-[340px]", className)}
        {...props}
      >
        <div className="flex flex-col">
          
          {/* Header - No Logo */}
          <div className="flex flex-col items-center gap-1 text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tighter text-white uppercase italic">
              Welcome Back
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">
              New here?{" "}
              <button 
                type="button"
                onClick={() => router.replace("/signup")}
                className="text-violet-400 font-bold hover:text-violet-300 transition-colors cursor-pointer ml-1"
              >
                Create Account
              </button>
            </p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            {/* Input Fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/[0.03] border-white/10 focus:border-violet-500/50 focus:ring-0 h-11 rounded-xl transition-all placeholder:text-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Password
                  </label>
                  <button 
                    type="button" 
                    onClick={() => router.push("/forgot-password")}
                    className="text-[9px] text-slate-600 hover:text-white transition-colors uppercase font-bold cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "bg-white/[0.03] border-white/10 focus:border-violet-500/50 focus:ring-0 h-11 rounded-xl transition-all",
                    error ? "border-red-500/50" : ""
                  )}
                />
              </div>
            </div>

            {/* Primary Action */}
            <Button 
              type="submit" 
              className="w-full h-11 rounded-xl bg-white text-black font-bold uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all active:scale-[0.98] cursor-pointer"
              disabled={loading}
            >
              {loading ? "Authorizing..." : "Sign In"}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/5"></span>
              </div>
              <div className="relative flex justify-center text-[9px] uppercase tracking-[0.3em] text-slate-600">
                <span className="bg-[#050505] px-2 font-bold italic">Identity Sync</span>
              </div>
            </div>

            {/* Google Action */}
            <Button
              variant="outline"
              type="button"
              className="w-full h-11 rounded-xl border-white/10 bg-transparent text-white hover:bg-white/5 transition-all text-[11px] font-bold uppercase tracking-widest cursor-pointer"
              onClick={handleGoogleLogin}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 size-3.5">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Google Auth
            </Button>
          </form>

          {/* Expanded Legal Footer */}
          <div className="mt-10 flex flex-col items-center gap-2 text-center text-[8px] text-slate-600 uppercase tracking-[0.15em] leading-relaxed font-medium">
            <p>Protected by End-to-End Encryption</p>
            <div className="flex items-center gap-3">
              <a href="#" className="hover:text-white transition-colors cursor-pointer border-b border-transparent hover:border-white/20">Terms of Use</a>
              <span className="size-1 bg-white/10 rounded-full" />
              <a href="#" className="hover:text-white transition-colors cursor-pointer border-b border-transparent hover:border-white/20">Privacy Policy</a>
              <span className="size-1 bg-white/10 rounded-full" />
              <a href="#" className="hover:text-white transition-colors cursor-pointer border-b border-transparent hover:border-white/20">Cookie Policy</a>
            </div>
            <p className="mt-1 opacity-40">© 2024 Pro Inc. All Rights Reserved.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}