"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getFirestoreDB, getFirebaseAuth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  IconLoader, IconSearch, IconDotsVertical, IconShieldCheck, 
  IconUser, IconCircleCheckFilled, IconCircleXFilled, IconUserX, 
  IconUsers, IconBan, IconChecklist
} from "@tabler/icons-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const router = useRouter();
  const auth = getFirebaseAuth();
  const db = getFirestoreDB();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && (userDoc.data()?.role === "admin" || userDoc.data()?.isAdmin === true)) {
            setIsAdmin(true);
            fetchUsers();
          } else {
            router.push("/"); 
          }
        } catch (error) { router.push("/"); }
      } else { router.push("/login"); }
    });
    return () => unsubscribe();
  }, [auth, db, router]);

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      setUsers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() })));
    } finally { setLoading(false); }
  };

  const handleUpdateUser = async (uid, data) => {
    try {
      await updateDoc(doc(db, "users", uid), { ...data, updatedAt: new Date() });
      toast.success("Security permissions updated");
      fetchUsers(); 
    } catch (err) { toast.error("Sync failed"); }
  };

  const handleDeclineUser = async () => {
    if (!declineReason.trim()) return toast.error("Please provide a reason");
    setIsProcessing(true);
    try {
      const userRef = doc(db, "users", selectedUser.uid);
      const declinedRef = doc(db, "declinedUsers", selectedUser.uid);

      const updateData = {
        ...selectedUser,
        isApproved: false,
        isDeclined: true,
        description: declineReason,
        declinedAt: new Date(),
      };

      await setDoc(declinedRef, updateData);
      await updateDoc(userRef, { isDeclined: true, isApproved: false, description: declineReason });

      toast.success("User access denied");
      setIsDeclineDialogOpen(false);
      setDeclineReason("");
      fetchUsers();
    } catch (err) { toast.error("Database error"); }
    finally { setIsProcessing(false); }
  };

  const stats = useMemo(() => ({
    total: users.length,
    approved: users.filter(u => u.isApproved && !u.isDeclined).length,
    declined: users.filter(u => u.isDeclined).length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const nameMatch = (user.firstName || user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (user.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      return activeTab === "active" ? (nameMatch && !user.isDeclined) : (nameMatch && user.isDeclined);
    });
  }, [users, searchQuery, activeTab]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
      <IconLoader className="animate-spin text-slate-700" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-6 md:px-16 lg:px-24 font-sans text-slate-200">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* TOP HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-white italic">Management</h1>
            <p className="text-slate-500 text-sm tracking-wide">System Access & Identity Logs</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white/5 p-1 rounded-xl cursor-pointer">
              <TabsList className="bg-transparent">
                <TabsTrigger value="active" className="rounded-lg text-xs cursor-pointer">Directory</TabsTrigger>
                <TabsTrigger value="declined" className="rounded-lg text-xs cursor-pointer">Archive</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-64">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
              <Input 
                placeholder="Find member..." 
                className="pl-9 bg-white/[0.03] border-white/5 text-xs text-white rounded-xl h-9 focus:ring-1 focus:ring-white/10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* STATUS UPDATES CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { label: "Total Accounts", count: stats.total, icon: IconUsers, color: "text-blue-400" },
            { label: "Approved", count: stats.approved, icon: IconChecklist, color: "text-green-400" },
            { label: "Declined", count: stats.declined, icon: IconBan, color: "text-red-400" },
          ].map((card, i) => (
            <Card key={i} className="bg-white/[0.02] border-white/5 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">{card.label}</p>
                  <p className="text-2xl font-semibold text-white tracking-tighter">{card.count}</p>
                </div>
                <div className={`p-2.5 rounded-xl bg-white/[0.03] ${card.color}`}>
                  <card.icon size={22} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* DATA TABLE */}
        <Card className="bg-white/[0.01] border-white/5 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-500 text-[10px] uppercase tracking-widest pl-8 h-12">System Identity</TableHead>
                <TableHead className="text-slate-500 text-[10px] uppercase tracking-widest h-12">Current Role</TableHead>
                <TableHead className="text-slate-500 text-[10px] uppercase tracking-widest h-12 text-center">Status</TableHead>
                <TableHead className="text-slate-500 text-[10px] uppercase tracking-widest h-12 text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.uid} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <TableCell className="py-5 pl-8">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-9 w-9 grayscale contrast-125 border border-white/10 rounded-xl">
                        <AvatarImage src={user.photoURL} />
                        <AvatarFallback className="bg-slate-900 text-slate-500 text-[10px] font-bold">
                          {(user.firstName?.[0] || user.email?.[0] || "?").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-slate-100 text-sm font-medium">
                          {user.firstName || user.name || "Unknown Identity"}
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono italic">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={`border-none rounded-lg text-[9px] px-2 py-0 cursor-default ${user.role === 'admin' ? 'bg-violet-500/10 text-violet-400' : 'bg-slate-500/10 text-slate-500'}`}>
                      {user.role === 'admin' ? <IconShieldCheck size={11} className="mr-1" /> : <IconUser size={11} className="mr-1" />}
                      {user.role ? user.role.toUpperCase() : 'USER'}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      {user.isDeclined ? (
                        <Badge variant="outline" className="text-[10px] text-red-500/70 border-red-500/20 bg-red-500/5 rounded-md py-0 cursor-default">Declined</Badge>
                      ) : user.isApproved ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-green-400/80 font-medium cursor-default">
                          <IconCircleCheckFilled size={12} /> Approved
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-md cursor-default">Pending</div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-right pr-8">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 text-slate-600 hover:text-white rounded-lg cursor-pointer">
                          <IconDotsVertical size={18} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 bg-[#0c0c0c] border-white/10 text-slate-300 rounded-xl shadow-2xl backdrop-blur-xl">
                        <DropdownMenuLabel className="text-[9px] text-slate-600 uppercase tracking-widest p-3">Privilege Control</DropdownMenuLabel>
                        <DropdownMenuItem className="text-xs focus:bg-white/5 cursor-pointer py-2" onClick={() => handleUpdateUser(user.uid, { isApproved: !user.isApproved, isDeclined: false })}>
                           {user.isApproved ? "Revoke Access" : "Approve Account"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem className="text-xs focus:bg-white/5 cursor-pointer py-2" onClick={() => handleUpdateUser(user.uid, { role: user.role === 'admin' ? 'user' : 'admin' })}>
                           {user.role === 'admin' ? "Make Regular User" : "Elevate to Admin"}
                        </DropdownMenuItem>
                        {!user.isDeclined && (
                          <>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="text-xs focus:bg-red-500/10 text-red-400 cursor-pointer py-2" onClick={() => { setSelectedUser(user); setIsDeclineDialogOpen(true); }}>
                               <IconUserX size={14} className="mr-2" /> Deny Access
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* DECLINE MODAL */}
        <Dialog open={isDeclineDialogOpen} onOpenChange={setIsDeclineDialogOpen}>
          <DialogContent className="bg-[#0f0f0f] border-white/10 text-slate-200 rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-white text-lg font-semibold">Deny System Access</DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">
                Provide a justification for rejecting <strong>{selectedUser?.firstName || selectedUser?.email}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea 
                placeholder="Ex: Unverified domain or restricted region..."
                className="bg-white/[0.03] border-white/10 focus:ring-violet-500/30 min-h-[100px] text-xs"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setIsDeclineDialogOpen(false)} className="text-slate-400 text-xs cursor-pointer">Cancel</Button>
              <Button onClick={handleDeclineUser} className="bg-red-600 hover:bg-red-700 text-white text-xs px-6 h-9 rounded-lg cursor-pointer transition-colors" disabled={isProcessing}>
                {isProcessing ? "Saving..." : "Confirm Denial"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}