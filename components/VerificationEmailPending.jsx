"use client";

import { Spinner } from "@/components/ui/spinner";

export function EmailVerificationAlert() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-4/5 flex flex-col items-center justify-center h-2/3 border-white rounded-3xl p-8 text-white">
        <Spinner className="h-16 w-16 text-white mb-6" />
        <h2 className="text-2xl font-bold mb-4 text-center">
          Verification Email Sent
        </h2>
        <p className="text-center mb-2">
          We've sent a verification link to your email address. 
          Please check your inbox and follow the instructions to verify your account.
        </p>
        <p className="text-center text-sm text-gray-300">
          Once verified, you'll be able to complete your profile and access all features.
        </p>
        <p className="text-center mt-4 text-sm text-gray-400">
          Didn't receive an email? Check your spam folder or request a new verification link.
        </p>
      </div>
    </div>
  );
}
