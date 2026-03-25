// app/admin/page.jsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getFirestoreDB, getFirebaseAuth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  addDoc,
  query,
  where
} from "firebase/firestore";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  IconLoader, IconSearch, IconDotsVertical, IconShieldCheck, 
  IconUser, IconCircleCheckFilled, IconCircleXFilled, IconUserX, 
  IconUsers, IconBan, IconChecklist, IconChevronRight, IconHome,
  IconTruck, IconPlus, IconEdit, IconTrash, IconBuildingStore,
  IconChevronLeft, IconChevronsLeft, IconChevronsRight
} from "@tabler/icons-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAdminUser, setCurrentAdminUser] = useState(null);
  
  // Users State
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  
  // Pagination State - 6 items per page
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Suppliers State - Now stored in subcollection under admin user
  const [suppliers, setSuppliers] = useState([]);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({ name: "", contact: "", email: "", phone: "", address: "" });
  const [supplierCurrentPage, setSupplierCurrentPage] = useState(1);
  
  const router = useRouter();
  const auth = getFirebaseAuth();
  const db = getFirestoreDB();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "user_details", user.uid));
          const userData = userDoc.data();
          if (userDoc.exists() && (userData?.role === "admin" || userData?.isAdmin === true)) {
            setIsAdmin(true);
            setCurrentAdminUser({ uid: user.uid, ...userData });
            fetchUsers();
            fetchSuppliers(user.uid);
          } else {
            router.push("/");
          }
        } catch (error) {
          router.push("/");
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth, db, router]);

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "user_details"));
      setUsers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Fetch suppliers from subcollection: suppliers/{adminUid}/list
  const fetchSuppliers = async (adminUid) => {
    try {
      const suppliersRef = collection(db, "suppliers", adminUid, "list");
      const snapshot = await getDocs(suppliersRef);
      setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  // User Management Functions
  const handleUpdateUser = async (uid, data) => {
    setIsProcessing(true);
    try {
      const userRef = doc(db, "user_details", uid);
      const declinedRef = doc(db, "declinedUsers", uid);

      const updates = { ...data };
      if (updates.role) updates.isAdmin = updates.role === "admin";
      if (updates.isAdmin !== undefined && !updates.role) updates.role = updates.isAdmin ? "admin" : "user";

      if (updates.isApproved === true) {
        await deleteDoc(declinedRef);
        updates.isDeclined = false;
        updates.description = "";
      }

      await updateDoc(userRef, { ...updates, updatedAt: new Date() });
      toast.success("Identity updated successfully");
      fetchUsers();
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineUser = async () => {
    if (!declineReason.trim()) return toast.error("Please provide a reason");
    setIsProcessing(true);
    try {
      const userRef = doc(db, "user_details", selectedUser.uid);
      const declinedRef = doc(db, "declinedUsers", selectedUser.uid);

      await updateDoc(userRef, {
        isDeclined: true,
        isApproved: false,
        description: declineReason,
        updatedAt: new Date()
      });

      await setDoc(declinedRef, {
        ...selectedUser,
        isApproved: false,
        isDeclined: true,
        description: declineReason,
        declinedAt: new Date(),
      }, { merge: true });

      toast.success("User moved to archive");
      setIsDeclineDialogOpen(false);
      setDeclineReason("");
      fetchUsers();
    } catch (err) {
      toast.error("Database sync error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Supplier Management Functions - Now using subcollection
  const handleAddSupplier = async () => {
    if (!supplierForm.name) {
      toast.error("Supplier name is required");
      return;
    }
    if (!currentAdminUser) {
      toast.error("Admin user not found");
      return;
    }
    
    setIsProcessing(true);
    try {
      const suppliersRef = collection(db, "suppliers", currentAdminUser.uid, "list");
      
      if (editingSupplier) {
        const supplierRef = doc(db, "suppliers", currentAdminUser.uid, "list", editingSupplier.id);
        await updateDoc(supplierRef, {
          ...supplierForm,
          updatedAt: new Date()
        });
        toast.success("Supplier updated successfully");
      } else {
        await addDoc(suppliersRef, {
          ...supplierForm,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: currentAdminUser.uid
        });
        toast.success("Supplier added successfully");
      }
      
      setSupplierDialogOpen(false);
      setEditingSupplier(null);
      setSupplierForm({ name: "", contact: "", email: "", phone: "", address: "" });
      fetchSuppliers(currentAdminUser.uid);
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast.error("Failed to save supplier: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (!currentAdminUser) return;
    if (confirm("Are you sure you want to delete this supplier?")) {
      try {
        const supplierRef = doc(db, "suppliers", currentAdminUser.uid, "list", id);
        await deleteDoc(supplierRef);
        toast.success("Supplier deleted successfully");
        fetchSuppliers(currentAdminUser.uid);
      } catch (error) {
        console.error("Error deleting supplier:", error);
        toast.error("Failed to delete supplier");
      }
    }
  };

  // Statistics
  const stats = useMemo(() => ({
    total: users.length,
    approved: users.filter(u => u.isApproved && !u.isDeclined).length,
    declined: users.filter(u => u.isDeclined).length,
    suppliers: suppliers.length,
  }), [users, suppliers]);

  // Filtered and Paginated Users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const nameMatch = (user.firstName || user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (user.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch;
    });
  }, [users, searchQuery]);

  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  // Filtered and Paginated Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      return supplier.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [suppliers, searchQuery]);

  const totalSupplierPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const paginatedSuppliers = useMemo(() => {
    const startIndex = (supplierCurrentPage - 1) * itemsPerPage;
    return filteredSuppliers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSuppliers, supplierCurrentPage]);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
    setSupplierCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <IconLoader className="animate-spin text-slate-700" size={32} />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Pagination Component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-end gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 text-slate-400 hover:text-white"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <IconChevronsLeft size={14} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 text-slate-400 hover:text-white"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <IconChevronLeft size={14} />
        </Button>
        <span className="text-sm text-slate-500 px-2">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 text-slate-400 hover:text-white"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <IconChevronRight size={14} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 text-slate-400 hover:text-white"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <IconChevronsRight size={14} />
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-6 md:px-16 lg:px-24 font-sans text-slate-200">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[300px] w-[300px] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] h-[400px] w-[400px] rounded-full bg-indigo-500/15 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[10%] h-[300px] w-[300px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>
      
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Breadcrumb with Navigation - Same Row */}
        <div className="flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors cursor-pointer text-sm">
                    <IconHome size={14} /> Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <IconChevronRight size={12} className="text-slate-700" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-slate-300 text-sm font-medium">Admin Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Navigation Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab("users");
                setSearchQuery("");
              }}
              className={`cursor-pointer rounded-lg px-6 py-2 text-xs font-medium transition-all ${
                activeTab === "users"
                  ? "border-b-3 bg-white/5"
                  : "text-slate-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <IconUsers size={12} className="inline mr-2" />
              Users
            </button>
            <button
              onClick={() => {
                setActiveTab("suppliers");
                setSearchQuery("");
              }}
              className={`cursor-pointer rounded-lg px-6 py-2 text-xs font-medium transition-all ${
                activeTab === "suppliers"
                  ? "border-b-3 bg-white/5"
                  : "text-slate-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <IconTruck size={14} className="inline mr-2" />
              Suppliers
            </button>
          </div>
        </div>

        {/* Title with Search Bar - Same Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              {activeTab === "users" ? "User Management" : "Supplier Management"}
            </h1>
            <p className="text-slate-500 text-sm tracking-wide mt-1">
              {activeTab === "users" 
                ? "Manage user roles and system access" 
                : "Manage raw material suppliers for procurement"}
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-64">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <Input 
              placeholder={`Search ${activeTab === "users" ? "users..." : "suppliers..."}`}
              className="pl-9 bg-white/[0.03] border-white/5 text-sm text-white rounded-xl h-9 focus:ring-1 focus:ring-white/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Users Tab Content */}
        {activeTab === "users" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { label: "Total Users", count: stats.total, icon: IconUsers, color: "text-blue-400" },
                { label: "Approved", count: stats.approved, icon: IconChecklist, color: "text-green-400" },
                { label: "Declined", count: stats.declined, icon: IconBan, color: "text-red-400" },
              ].map((card, i) => (
                <Card key={i} className="bg-white/[0.02] border-white/5 backdrop-blur-md rounded-2xl shadow-xl hover:scale-[1.02] transition-transform duration-300">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">{card.label}</p>
                      <p className="text-3xl font-bold text-white">{card.count}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-white/[0.03] ${card.color}`}>
                      <card.icon size={24} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Users Table */}
            <Card className="bg-white/[0.01] border-white/5 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6">
                <Table>
                  <TableHeader className="bg-white/[0.02]">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wider pl-8 h-12">User Identity</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wider h-12">Role</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wider h-12 text-center">Status</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wider h-12 text-right pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="h-40 text-center text-slate-500 text-sm">No matching records</TableCell></TableRow>
                    ) : (
                      paginatedUsers.map((user) => (
                        <TableRow key={user.uid} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                          <TableCell className="py-4 pl-8">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10 grayscale contrast-125 border border-white/10 rounded-xl">
                                <AvatarImage src={user.photoURL} />
                                <AvatarFallback className="bg-slate-900 text-slate-500 text-sm font-bold">
                                  {(user.firstName?.[0] || user.email?.[0] || "?").toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-white text-sm font-medium">
                                  {user.firstName || user.name || "New Identity"}
                                </span>
                                <span className="text-xs text-slate-500">{user.email}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`border-none rounded-lg text-xs px-3 py-1 cursor-default font-medium ${user.role === 'admin' ? 'bg-violet-500/10 text-violet-400' : 'bg-slate-500/10 text-slate-400'}`}>
                              {user.role === 'admin' ? <IconShieldCheck size={12} className="mr-1" /> : <IconUser size={12} className="mr-1" />}
                              {(user.role || 'user').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              {user.isDeclined ? (
                                <div className="flex items-center gap-1.5 text-xs text-red-500/70 border border-red-500/20 bg-red-500/5 px-2 py-1 rounded-md cursor-help" title={user.description}>
                                  <IconCircleXFilled size={12} /> Declined
                                </div>
                              ) : user.isApproved ? (
                                <div className="flex items-center gap-1.5 text-xs text-green-400/80 font-medium cursor-default">
                                  <IconCircleCheckFilled size={12} /> Approved
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-md cursor-default">Pending</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 text-slate-500 hover:text-white rounded-lg cursor-pointer">
                                  <IconDotsVertical size={18} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52 bg-[#0c0c0c] border-white/10 text-slate-300 rounded-xl shadow-2xl backdrop-blur-xl">
                                <DropdownMenuLabel className="text-xs text-slate-600 uppercase tracking-wider p-3">Privileges</DropdownMenuLabel>
                                <DropdownMenuItem className="text-sm focus:bg-white/5 cursor-pointer py-2" onClick={() => handleUpdateUser(user.uid, { isApproved: !user.isApproved })}>
                                  {user.isApproved ? "Revoke Access" : "Approve Account"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem className="text-sm focus:bg-white/5 cursor-pointer py-2" onClick={() => handleUpdateUser(user.uid, { role: user.role === 'admin' ? 'user' : 'admin' })}>
                                  {user.role === 'admin' ? "Demote to User" : "Elevate to Admin"}
                                </DropdownMenuItem>
                                {!user.isDeclined && (
                                  <>
                                    <DropdownMenuSeparator className="bg-white/5" />
                                    <DropdownMenuItem className="text-sm focus:bg-red-500/10 text-red-400 cursor-pointer py-2" onClick={() => { setSelectedUser(user); setIsDeclineDialogOpen(true); }}>
                                      <IconUserX size={14} className="mr-2" /> Deny Access
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                
                {/* Pagination - Bottom Right */}
                {filteredUsers.length > itemsPerPage && (
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalUserPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>
            </Card>
          </>
        )}

        {/* Suppliers Tab Content */}
        {activeTab === "suppliers" && (
          <Card className="bg-white/[0.01] border-white/5 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <IconTruck size={20} /> Supplier Directory
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Manage raw material suppliers ({stats.suppliers} total)</p>
                </div>
                <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-white/5 hover:bg-white/10 text-white text-sm cursor-pointer">
                      <IconPlus size={14} className="mr-2" /> Add Supplier
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0f0f0f] border-white/10 text-slate-200 rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl">{editingSupplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
                      <DialogDescription className="text-slate-500 text-sm">
                        Enter supplier details for raw material procurement
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label className="text-sm text-slate-400">Company Name *</Label>
                        <Input 
                          value={supplierForm.name}
                          onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                          className="bg-white/[0.03] border-white/10 text-sm mt-1"
                          placeholder="ABC Metals Corp"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-slate-400">Contact Person</Label>
                          <Input 
                            value={supplierForm.contact}
                            onChange={(e) => setSupplierForm({...supplierForm, contact: e.target.value})}
                            className="bg-white/[0.03] border-white/10 text-sm mt-1"
                            placeholder="John Smith"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-slate-400">Email</Label>
                          <Input 
                            value={supplierForm.email}
                            onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                            className="bg-white/[0.03] border-white/10 text-sm mt-1"
                            placeholder="contact@abcmetals.com"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-slate-400">Phone</Label>
                          <Input 
                            value={supplierForm.phone}
                            onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                            className="bg-white/[0.03] border-white/10 text-sm mt-1"
                            placeholder="+1-555-0123"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-slate-400">Address</Label>
                          <Input 
                            value={supplierForm.address}
                            onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                            className="bg-white/[0.03] border-white/10 text-sm mt-1"
                            placeholder="123 Industrial Park"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setSupplierDialogOpen(false)} className="text-slate-400 text-sm">Cancel</Button>
                      <Button onClick={handleAddSupplier} className="bg-white/10 hover:bg-white/20 text-sm" disabled={isProcessing}>
                        {isProcessing ? "Saving..." : editingSupplier ? "Update" : "Add Supplier"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-3">
                {paginatedSuppliers.map(supplier => (
                  <div key={supplier.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:bg-white/[0.05] transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <IconBuildingStore size={18} className="text-orange-400" />
                        <span className="text-base font-medium text-white">{supplier.name}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-slate-500">
                        {supplier.contact && <span>Contact: {supplier.contact}</span>}
                        {supplier.email && <span>Email: {supplier.email}</span>}
                        {supplier.phone && <span>Phone: {supplier.phone}</span>}
                      </div>
                      {supplier.address && (
                        <p className="text-sm text-slate-600 mt-1">{supplier.address}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 text-slate-500 hover:text-white" onClick={() => {
                        setEditingSupplier(supplier);
                        setSupplierForm(supplier);
                        setSupplierDialogOpen(true);
                      }}>
                        <IconEdit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 text-slate-500 hover:text-red-400" onClick={() => handleDeleteSupplier(supplier.id)}>
                        <IconTrash size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredSuppliers.length === 0 && (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    {searchQuery ? "No suppliers match your search" : "No suppliers added yet"}
                  </div>
                )}
              </div>
              
              {/* Pagination - Bottom Right for Suppliers */}
              {filteredSuppliers.length > itemsPerPage && (
                <Pagination 
                  currentPage={supplierCurrentPage}
                  totalPages={totalSupplierPages}
                  onPageChange={setSupplierCurrentPage}
                />
              )}
            </div>
          </Card>
        )}

        {/* Decline User Dialog */}
        <Dialog open={isDeclineDialogOpen} onOpenChange={setIsDeclineDialogOpen}>
          <DialogContent className="bg-[#0f0f0f] border-white/10 text-slate-200 rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-semibold tracking-tight">Block System Access</DialogTitle>
              <DialogDescription className="text-slate-500 text-sm">
                Provide a justification for rejecting <strong>{selectedUser?.firstName || selectedUser?.email}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea 
                placeholder="Ex: Security risk..."
                className="bg-white/[0.03] border-white/10 focus:ring-violet-500/30 min-h-[100px] text-sm"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setIsDeclineDialogOpen(false)} className="text-slate-400 text-sm cursor-pointer">Cancel</Button>
              <Button 
                onClick={handleDeclineUser} 
                className="bg-red-600 hover:bg-red-700 text-white text-sm px-6 h-9 rounded-lg cursor-pointer transition-all" 
                disabled={isProcessing}
              >
                {isProcessing ? "Saving..." : "Confirm Denial"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}