"use client";

import { LoginForm } from "@/components/signin-form";
import { GuestGuard } from "@/container/RouteGuards";

export default function SignInPage() {
  return (
    <GuestGuard redirectTo="/home">
      <div className="">
        <div className="">
          <LoginForm />
        </div>
      </div>
    </GuestGuard>
  );
}