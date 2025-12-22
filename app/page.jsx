"use client";

import ProtectedPage from "@/container/firewall";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

// Shadcn UI Imports (Verify your paths)
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      router.replace("/signin");
    } catch (error) {
      toast.error("Error logging out");
      console.error(error);
    }
  };

  // Get initials for Avatar Fallback (e.g., "John Doe" -> "JD")
  const userInitials = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-background px-10">
        {/* TOP NAVIGATION BAR */}
        <header className="flex items-center justify-between p-4 border-b border-dotted bg-card">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={user?.photoURL || ""} alt="User profile" />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">Account</span>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4 cursor-pointer" />
            
          </Button>
        </header>

        {/* MAIN CONTENT */}
        <main className="p-8">
          <h1 className="text-3xl font-bold tracking-tight">Home Page</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back to your dashboard.
          </p>
        </main>
      </div>
    </ProtectedPage>
  );
}