"use client";

import { Mail, Loader2, CheckCircle2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation"; // Import the router

export function EmailVerificationAlert() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 1. Add your specific Auth logout logic here:
      // await supabase.auth.signOut(); 
      // OR 
      // await signOut(auth);

      console.log("Logging out...");

      // 2. Redirect the user back to the sign-in page
      router.push("/signin"); 
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#050505] font-sans selection:bg-violet-500/30 text-white overflow-hidden">
      
      {/* Ambient Purple Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-lg px-6 w-full">
        
        {/* Friendly Icon Section */}
        <div className="relative flex items-center justify-center mb-10">
          <div className="absolute size-24 bg-violet-500/15 rounded-full blur-2xl" />
          
          <div className="relative size-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-transparent border border-white/10 flex items-center justify-center shadow-2xl rotate-3">
            <Mail className="size-9 text-violet-400 -rotate-3" />
          </div>
          
          <div className="absolute -bottom-2 -right-2 size-8 rounded-full bg-[#050505] border border-white/10 flex items-center justify-center">
            <CheckCircle2 className="size-4 text-violet-400" />
          </div>
        </div>

        {/* Typography & Content */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Check Your Inbox
          </h1>
          
          <p className="text-muted-foreground text-md max-w-sm mx-auto leading-relaxed">
            We&apos;ve sent a magic link to your email. Click the button in that email to jump right back in!
          </p>
        </div>

        {/* Status Display */}
        <div className="mt-12 w-full bg-white/[0.03] border border-border rounded-2xl p-6 flex items-center justify-around">
          <div className="flex flex-col items-center">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1 font-semibold">Ready to go</span>
            <span className="text-sm text-foreground font-medium">Your Profile</span>
          </div>
          
          <div className="h-10 w-px bg-border/50" />
          
          <div className="flex flex-col items-center">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1 font-semibold">Waiting for</span>
            <span className="text-sm text-violet-400 font-medium flex items-center gap-2">
              One Click
              <span className="size-1.5 bg-violet-400 rounded-full animate-ping" />
            </span>
          </div>
        </div>

        {/* Footer & Actions */}
        <div className="flex flex-col items-center gap-6 mt-12">
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">
                Can&apos;t find it? Check your <span className="text-foreground font-medium">Spam</span> folder.
              </p>
            </div>
            
            <div className="flex items-center gap-3 py-2 px-4 rounded-full bg-violet-500/5 border border-violet-500/10">
               <Loader2 className="size-3 animate-spin text-violet-400" />
               <span className="text-[10px] uppercase tracking-[0.15em] text-violet-300/80">Waiting to verify email</span>
            </div>

            {/* Logout/Return Button */}
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="mt-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs gap-2 transition-all cursor-pointer"
            >
              <LogOut className="size-3.5" />
              Sign out and return to sign in
            </Button>
        </div>
      </div>
    </div>
  );
}