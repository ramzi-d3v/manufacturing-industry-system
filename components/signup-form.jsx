"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, sendVerificationEmail } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithRedirect,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
} from "firebase/auth";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, Lock, User } from "lucide-react";

export function SignupForm({ className, ...props }) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle Google Redirect Result
  useEffect(() => {
    if (!isClient) return;

    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          toast.success("Signed in with Google successfully!");
          router.push("/complite-profile");
        }
      } catch (err) {
        console.error(err);
        toast.error("Google sign-in failed.");
      } finally {
        setIsLoading(false);
      }
    };
    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !isLoading) {
        router.push("/complite-profile");
      }
    });
    return () => unsubscribe();
  }, [isClient, router, isLoading]);

  const validatePassword = (pass) => {
    if (pass.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pass))
      return "Password must contain at least one uppercase letter.";
    if (!/[0-9]/.test(pass)) return "Password must contain at least one number.";
    return null;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !name) {
      setError("Please fill all fields.");
      return;
    }

    const passError = validatePassword(password);
    if (passError) {
      setError(passError);
      return;
    }

    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      await sendVerificationEmail(user);

      toast.success("Account created! Please verify your email.");
      router.replace("/complite-profile");
    } catch (err) {
      const message =
        err.code === "auth/email-already-in-use"
          ? "This email is already registered."
          : err.message || "Signup failed";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isClient) return;
    const provider = new GoogleAuthProvider();
    try {
      setIsLoading(true);
      await signInWithRedirect(auth, provider);
    } catch (err) {
      toast.error("Google sign-in failed.");
      setIsLoading(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-sm mx-auto p-4", className)} {...props}>
      <form onSubmit={handleSignUp}>
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Create an Account</h1>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/signin")}
                className="underline font-medium hover:text-primary transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>

          {/* Name Field */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="pl-9"
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={cn("pl-9", error && "border-red-500")}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Min. 8 chars, 1 uppercase, 1 number.
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 p-2 rounded border border-destructive/20">
              <p className="text-xs text-destructive text-center">{error}</p>
            </div>
          )}

          {/* Sign Up Button */}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Spinner className="h-4 w-4" /> Creating...
              </div>
            ) : (
              "Create Account"
            )}
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Only Google – Apple removed */}
          <Button
            variant="outline"
            type="button"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <GoogleIcon className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
        </div>
      </form>

      <p className="text-center text-xs text-muted-foreground px-2">
        By clicking continue, you agree to our{" "}
        <a href="#" className="underline underline-offset-2 hover:text-primary">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-2 hover:text-primary">
          Privacy Policy
        </a>.
      </p>
    </div>
  );
}

// Google Icon
const GoogleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
  </svg>
);