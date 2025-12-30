"use client";

import { Mail, Loader, CheckCircle2, ArrowRight } from "lucide-react";

export function EmailVerificationAlert() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#050505] font-sans selection:bg-violet-500/30 text-white overflow-hidden">
      
      {/* Ambient Purple Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-lg px-6">
        
        {/* Friendly Icon Section */}
        <div className="relative flex items-center justify-center mb-10">
          <div className="absolute size-24 bg-violet-500/15 rounded-full blur-2xl" />
          
          <div className="relative size-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-transparent border border-white/10 flex items-center justify-center shadow-2xl rotate-3">
            <Mail className="size-9 text-violet-400 -rotate-3" />
          </div>
          
          {/* Small decorative "Check" floating nearby */}
          <div className="absolute -bottom-2 -right-2 size-8 rounded-full bg-[#050505] border border-white/10 flex items-center justify-center">
            <CheckCircle2 className="size-4 text-violet-400" />
          </div>
        </div>

        {/* Typography & Content */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Check Your Inbox
          </h1>
          
          <p className="text-slate-400 text-md max-w-sm mx-auto leading-relaxed">
            We&apos;ve sent a magic link to your email. Click the button in that email to jump right back in!
          </p>
        </div>

        {/* Customer-Friendly Status Display */}
        <div className="mt-12 w-full bg-white/[0.03] border border-white/5 rounded-2xl p-6 flex items-center justify-around">
          <div className="flex flex-col items-center">
            <span className="text-[11px] uppercase tracking-widest text-slate-500 mb-1 font-semibold">Ready to go</span>
            <span className="text-sm text-slate-200 font-medium">Your Profile</span>
          </div>
          
          <div className="h-10 w-px bg-white/10" />
          
          <div className="flex flex-col items-center">
            <span className="text-[11px] uppercase tracking-widest text-slate-500 mb-1 font-semibold">Waiting for</span>
            <span className="text-sm text-violet-400 font-medium flex items-center gap-2">
              One Click
              <span className="size-1.5 bg-violet-400 rounded-full animate-ping" />
            </span>
          </div>
        </div>

        {/* Helpful Footer Section */}
        <div className="flex flex-col items-center gap-6 mt-12">
            <div className="space-y-2 text-center">
              <p className="text-sm text-slate-500">
                Can&apos;t find it? Check your <span className="text-slate-300 font-medium">Spam</span> or <span className="text-slate-300 font-medium">Promotions</span> folder.
              </p>
            </div>
            
            <div className="flex items-center gap-3 py-2 px-4 rounded-full bg-violet-500/5 border border-violet-500/10">
               <Loader className="size-3 animate-spin text-violet-400" />
               <span className="text-[10px] uppercase tracking-[0.15em]  text-violet-300/80">Waiting to verify email</span>
            </div>
        </div>
      </div>
    </div>
  );
}