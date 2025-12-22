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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({ className, ...props }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1. Email/Password Login Logic
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Logged in successfully!");
      router.push("/"); // Redirect to home/dashboard
    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Google Login Logic
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Logged in with Google!");
      router.replace("/");
    } catch (err) {
      console.error(err);
      toast.error("Google sign-in failed.");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleEmailLogin}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            
            <h1 className="text-xl font-bold">Welcome to Pro Inc.</h1>
            <FieldDescription>
              Don&apos;t have an account?{" "}
              <button 
                type="button"
                onClick={() => router.replace("/signup")} // Navigate to Signup
                className="underline cursor-pointer  text-primary "
              >
                Sign up
              </button>
            </FieldDescription>
          </div>

          {/* Email Field */}
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          {/* Password Field */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <button 
                type="button" 
                onClick={() => router.push("/forgot-password")}
                className="text-xs text-gray-100/60 underline  cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(error ? "border-red-500" : "")}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </Field>

          <Field>
            <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </Field>

          <FieldSeparator>Or</FieldSeparator>

          <Field>
            <Button
              variant="outline"
              type="button"
              className="w-full cursor-pointer"
              onClick={handleGoogleLogin} // Trigger Google login
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 size-4">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Continue with Google
            </Button>
          </Field>
        </FieldGroup>
      </form>

      <FieldDescription className="px-6 text-center text-xs">
        By clicking continue, you agree to our{" "}
        <a href="#" className="underline cursor-pointer">Terms of Service</a>{" "}
        and{" "}
        <a href="#" className="underline cursor-pointer">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}