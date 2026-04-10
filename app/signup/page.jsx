import { SignupForm } from "@/components/signup-form";
import { GuestGuard } from "@/container/RouteGuards";

export default function SignupPage() {
  return (
    <GuestGuard redirectTo="/home">
      <div className="relative h-screen w-full flex items-center justify-center bg-[#050505] p-4 overflow-hidden">

        {/* Background Ambient Glows (SAME AS LOGIN) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[100px]" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/10 blur-[100px]" />
        </div>

        {/* Form Container */}
        <div className="relative z-10 w-full max-w-[440px] p-6">
          <SignupForm />
        </div>
      </div>
    </GuestGuard>
  );
}
