"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { auth, sendVerificationEmail } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";

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
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export function SignupForm({ className, ...props }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSignUp, setEmailSignUp] = useState("");
  const [passwordSignUp, setPasswordSignUp] = useState("");
  const [nameInput, setNameInput] = useState("");

  // Password Validation Logic
  const validatePassword = (pass) => {
    if (pass.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter.";
    if (!/[0-9]/.test(pass)) return "Password must contain at least one number.";
    return null;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    // Basic Field Check
    if (!emailSignUp || !passwordSignUp || !nameInput) {
      setError("Please fill all fields.");
      return;
    }

    // Password Validation Check
    const passError = validatePassword(passwordSignUp);
    if (passError) {
      setError(passError);
      return;
    }

    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        emailSignUp,
        passwordSignUp
      );

      const user = userCredential.user;
      await updateProfile(user, { displayName: nameInput });
      await sendVerificationEmail(user);

      toast.success("Account created! Please verify your email.");
      router.replace("/complite-profile");
    } catch (err) {
      const message = err.code === 'auth/email-already-in-use' 
        ? "This email is already registered." 
        : (err.message || "Signup failed");
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setIsLoading(true);
      await signInWithPopup(auth, provider);
      toast.success("Signed in with Google successfully!");
      router.push("/complite-profile");
    } catch (err) {
      toast.error("Google sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-sm mx-auto p-4", className)} {...props}>
      <form onSubmit={handleSignUp}>
        <FieldGroup className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Welcome to Pro Inc.</h1>
            <FieldDescription>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/signin")}
                className="underline cursor-pointer font-medium hover:text-primary transition-colors"
              >
                Sign in
              </button>
            </FieldDescription>
          </div>

          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              type="text"
              placeholder="Your Name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              required
              className="w-full"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={emailSignUp}
              onChange={(e) => setEmailSignUp(e.target.value)}
              required
              className="w-full"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={passwordSignUp}
              onChange={(e) => setPasswordSignUp(e.target.value)}
              required
              className={cn("w-full", error && passwordSignUp && "border-red-500")}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Min. 8 chars, 1 uppercase, 1 number.
            </p>
          </Field>

          {error && (
            <div className="bg-destructive/10 p-2 rounded border border-destructive/20">
               <p className="text-xs text-destructive text-center">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full cursor-pointer">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Spinner className="h-4 w-4" /> Creating...
              </div>
            ) : (
              "Create Account"
            )}
          </Button>

          <FieldSeparator>Or</FieldSeparator>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button variant="outline" disabled type="button" className="opacity-50 cursor-not-allowed h-10 order-2 sm:order-1">
              <AppleIcon className="mr-2 h-4 w-4" />
              Apple
            </Button>

            <Button 
              variant="outline" 
              type="button" 
              className="h-10 order-1 sm:order-2 cursor-pointer"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <GoogleIcon className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>
        </FieldGroup>
      </form>

      <FieldDescription className="text-center text-xs leading-relaxed opacity-70 px-2">
        By clicking continue, you agree to our{" "}
        <a href="#" className="underline underline-offset-2 hover:text-primary">Terms of Service</a> and{" "}
        <a href="#" className="underline underline-offset-2 hover:text-primary">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}

// Simple Icon Components to keep the JSX clean
const AppleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
);

const GoogleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
  </svg>
);