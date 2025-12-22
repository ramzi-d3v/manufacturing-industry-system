"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getFirestoreDB, getFirebaseAuth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { 
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  IconLoader, 
  IconSearch, 
  IconDotsVertical, 
  IconUserCheck, 
  IconUserX,
  IconMailExclamation,
  IconClockHour4,
  IconUsers,
  IconCalendarEvent,
  IconCircleCheckFilled,
  IconShieldCheck,
  IconUser,
  IconLock
} from "@tabler/icons-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  
  const auth = getFirebaseAuth();
  const db = getFirestoreDB();

  // Role-Based Access Control (RBAC) check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Force a fresh fetch from Firestore (bypassing local cache)
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            console.error("User document does not exist for UID:", user.uid);
            toast.error("Security Error: User profile not found");
            router.push("/");
            return;
          }

          const userData = userDoc.data();
          console.log("Current User Role:", userData?.role); // CHECK THIS IN CONSOLE

          // Checking for both 'role' string and 'isAdmin' boolean to be safe
          if (userData?.role === "admin" || userData?.isAdmin === true) {
            setIsAdmin(true);
            fetchUsers();
          } else {
            console.warn("Access Denied: User is not an admin");
            toast.error("Unauthorized: Admin access required");
            router.push("/"); 
          }
        } catch (error) {
          console.error("Security check failed:", error);
          router.push("/");
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [auth, db, router]);

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const userData = snapshot.docs.map((docSnap) => ({
        uid: docSnap.id,
        ...docSnap.data(),
      }));
      setUsers(userData);
    } catch (err) {
      console.error("Database fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (uid, data) => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { ...data, updatedAt: new Date() });
      toast.success("User permissions updated");
      fetchUsers(); 
    } catch (err) {
      toast.error("Failed to update Firestore");
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const name = (user.name || user.displayName || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      const search = searchQuery.toLowerCase();
      return name.includes(search) || email.includes(search);
    });
  }, [users, searchQuery]);

  // Helper: Status Badges
  const getStatusBadge = (user) => {
    if (!user.emailVerified) return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1.5"><IconMailExclamation size={14} /> Unverified</Badge>;
    if (!user.isApproved) return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 gap-1.5"><IconClockHour4 size={14} /> Pending Approval</Badge>;
    return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1.5"><IconCircleCheckFilled size={14} /> Approved</Badge>;
  };

  // Helper: Role Badges
  const getRoleBadge = (role) => {
    const isRoleAdmin = role?.toLowerCase() === "admin";
    return (
      <Badge variant={isRoleAdmin ? "default" : "secondary"} className={isRoleAdmin ? "bg-violet-600 gap-1" : "gap-1"}>
        {isRoleAdmin ? <IconShieldCheck size={12} /> : <IconUser size={12} />}
        {role || "user"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <IconLoader className="animate-spin h-10 w-10 text-primary" />
        <p className="text-muted-foreground font-medium">Verifying Admin Credentials...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Or a "Access Denied" message
  }
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
           <IconLock className="text-violet-600" size={24} />
           <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground font-medium">Manage user identities and access control directly from Firestore.</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card shadow-sm border-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Directory Size</CardTitle>
            <IconUsers size={18} className="text-primary" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{users.length}</div></CardContent>
        </Card>
        <Card className="bg-card shadow-sm border-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Active Admins</CardTitle>
            <IconShieldCheck size={18} className="text-violet-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{users.filter(u => u.role === "admin").length}</div></CardContent>
        </Card>
        <Card className="bg-card shadow-sm border-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Pending Action</CardTitle>
            <IconClockHour4 size={18} className="text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{users.filter(u => u.emailVerified && !u.isApproved).length}</div></CardContent>
        </Card>
      </div>

      {/* Main Directory Table */}
      <Card className="shadow-md border-muted/60 overflow-hidden">
        <div className="px-6 py-5 border-b bg-muted/10">
          <div className="relative flex-1 max-w-md">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-10 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="px-6 min-h-[450px]"> 
          <Table>
            <TableHeader>
              <TableRow className="border-muted/40">
                <TableHead className="py-5 font-bold">User Identity</TableHead>
                <TableHead className="font-bold">System Role</TableHead>
                <TableHead className="font-bold">Access Status</TableHead>
                <TableHead className="font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.uid} className="hover:bg-muted/20 border-muted/40 last:border-0">
                  <TableCell className="py-5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground tracking-tight">
                        {/* Pulling name strictly from Firestore fields */}
                        {user.name || user.displayName || "New User"}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono font-normal">
                        {user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <IconDotsVertical size={20} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Moderation</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleUpdateUser(user.uid, { isApproved: !user.isApproved })}>
                           {user.isApproved ? "Revoke Approval" : "Approve Access"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleUpdateUser(user.uid, { role: user.role === 'admin' ? 'user' : 'admin' })}>
                           {user.role === 'admin' ? "Demote to User" : "Make Admin"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}