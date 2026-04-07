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
  where,
  orderBy,
  Timestamp
} from "firebase/firestore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  IconChevronLeft, IconChevronsLeft, IconChevronsRight, IconBuildingWarehouse,
  IconLocation, IconMail, IconPhone, IconMapPin, IconUserCircle,
  IconPackage, IconBuildingCommunity, IconUserCheck, IconUserCancel,
  IconUsersGroup, IconBriefcase, IconCrown, IconStar
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
  
  // User Filter States
  const [userStatusFilter, setUserStatusFilter] = useState("all"); // all, approved, declined, pending
  const [userRoleFilter, setUserRoleFilter] = useState("all"); // all, admin, manager, staff, other
  
  // Pagination State - 5 items per page for tables
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  
  // Suppliers State
  const [suppliers, setSuppliers] = useState([]);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({ name: "", contact: "", email: "", phone: "", address: "" });
  const [supplierCurrentPage, setSupplierCurrentPage] = useState(1);
  
  // Distributors State
  const [distributors, setDistributors] = useState([]);
  const [distributorDialogOpen, setDistributorDialogOpen] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState(null);
  const [distributorForm, setDistributorForm] = useState({ name: "", contact: "", email: "", phone: "", address: "", serviceArea: "" });
  const [distributorCurrentPage, setDistributorCurrentPage] = useState(1);
  
  // Warehouses State
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [warehouseForm, setWarehouseForm] = useState({ name: "", location: "", type: "main", capacity: "", manager: "", phone: "" });
  const [warehouseCurrentPage, setWarehouseCurrentPage] = useState(1);
  
  // Warehouse types
  const warehouseTypes = [
    { value: "main", label: "Main Warehouse" },
    { value: "cold", label: "Cold Storage" },
    { value: "hazardous", label: "Hazardous Materials" },
    { value: "bulk", label: "Bulk Storage" },
    { value: "distribution", label: "Distribution Center" },
    { value: "temporary", label: "Temporary Storage" },
  ];
  
  // Role options
  const roleOptions = [
    { value: "admin", label: "Admin", icon: IconCrown, color: "text-purple-400" },
    { value: "manager", label: "Manager", icon: IconBriefcase, color: "text-blue-400" },
    { value: "staff", label: "Staff", icon: IconUsersGroup, color: "text-green-400" },
    { value: "other", label: "Other", icon: IconUser, color: "text-slate-400" },
  ];
  
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
            fetchDistributors(user.uid);
            fetchWarehouses(user.uid);
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

  const fetchSuppliers = async (adminUid) => {
    try {
      const suppliersRef = collection(db, "suppliers", adminUid, "list");
      const snapshot = await getDocs(query(suppliersRef, orderBy("createdAt", "desc")));
      setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchDistributors = async (adminUid) => {
    try {
      const distributorsRef = collection(db, "distributors", adminUid, "list");
      const snapshot = await getDocs(query(distributorsRef, orderBy("createdAt", "desc")));
      setDistributors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching distributors:", error);
    }
  };

  const fetchWarehouses = async (adminUid) => {
    try {
      const warehousesRef = collection(db, "warehouses", adminUid, "list");
      const snapshot = await getDocs(query(warehousesRef, orderBy("createdAt", "desc")));
      setWarehouses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching warehouses:", error);
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

  // Supplier Management Functions
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
          updatedAt: Timestamp.now()
        });
        toast.success("Supplier updated successfully");
      } else {
        await addDoc(suppliersRef, {
          ...supplierForm,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
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

  // Distributor Management Functions
  const handleAddDistributor = async () => {
    if (!distributorForm.name) {
      toast.error("Distributor name is required");
      return;
    }
    if (!currentAdminUser) {
      toast.error("Admin user not found");
      return;
    }
    
    setIsProcessing(true);
    try {
      const distributorsRef = collection(db, "distributors", currentAdminUser.uid, "list");
      
      if (editingDistributor) {
        const distributorRef = doc(db, "distributors", currentAdminUser.uid, "list", editingDistributor.id);
        await updateDoc(distributorRef, {
          ...distributorForm,
          updatedAt: Timestamp.now()
        });
        toast.success("Distributor updated successfully");
      } else {
        await addDoc(distributorsRef, {
          ...distributorForm,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          createdBy: currentAdminUser.uid
        });
        toast.success("Distributor added successfully");
      }
      
      setDistributorDialogOpen(false);
      setEditingDistributor(null);
      setDistributorForm({ name: "", contact: "", email: "", phone: "", address: "", serviceArea: "" });
      fetchDistributors(currentAdminUser.uid);
    } catch (error) {
      console.error("Error saving distributor:", error);
      toast.error("Failed to save distributor: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteDistributor = async (id) => {
    if (!currentAdminUser) return;
    if (confirm("Are you sure you want to delete this distributor?")) {
      try {
        const distributorRef = doc(db, "distributors", currentAdminUser.uid, "list", id);
        await deleteDoc(distributorRef);
        toast.success("Distributor deleted successfully");
        fetchDistributors(currentAdminUser.uid);
      } catch (error) {
        console.error("Error deleting distributor:", error);
        toast.error("Failed to delete distributor");
      }
    }
  };

  // Warehouse Management Functions
  const handleAddWarehouse = async () => {
    if (!warehouseForm.name || !warehouseForm.location) {
      toast.error("Warehouse name and location are required");
      return;
    }
    if (!currentAdminUser) return;
    
    setIsProcessing(true);
    try {
      const warehousesRef = collection(db, "warehouses", currentAdminUser.uid, "list");
      
      if (editingWarehouse) {
        const warehouseRef = doc(db, "warehouses", currentAdminUser.uid, "list", editingWarehouse.id);
        await updateDoc(warehouseRef, {
          ...warehouseForm,
          capacity: parseFloat(warehouseForm.capacity) || 0,
          updatedAt: Timestamp.now()
        });
        toast.success("Warehouse updated successfully");
      } else {
        await addDoc(warehousesRef, {
          ...warehouseForm,
          capacity: parseFloat(warehouseForm.capacity) || 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          createdBy: currentAdminUser.uid
        });
        toast.success("Warehouse added successfully");
      }
      
      setWarehouseDialogOpen(false);
      setEditingWarehouse(null);
      setWarehouseForm({ name: "", location: "", type: "main", capacity: "", manager: "", phone: "" });
      fetchWarehouses(currentAdminUser.uid);
    } catch (error) {
      console.error("Error saving warehouse:", error);
      toast.error("Failed to save warehouse: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteWarehouse = async (id) => {
    if (!currentAdminUser) return;
    if (confirm("Are you sure you want to delete this warehouse? This may affect items stored here.")) {
      try {
        const warehouseRef = doc(db, "warehouses", currentAdminUser.uid, "list", id);
        await deleteDoc(warehouseRef);
        toast.success("Warehouse deleted successfully");
        fetchWarehouses(currentAdminUser.uid);
      } catch (error) {
        console.error("Error deleting warehouse:", error);
        toast.error("Failed to delete warehouse");
      }
    }
  };

  // Statistics for filter tabs
  const stats = {
    total: users.length,
    approved: users.filter(u => u.isApproved && !u.isDeclined).length,
    declined: users.filter(u => u.isDeclined).length,
    pending: users.filter(u => !u.isApproved && !u.isDeclined).length,
    admin: users.filter(u => u.role === "admin" && !u.isDeclined).length,
    manager: users.filter(u => u.role === "manager" && !u.isDeclined).length,
    staff: users.filter(u => u.role === "staff" && !u.isDeclined).length,
    other: users.filter(u => u.role === "other" && !u.isDeclined).length,
    suppliers: suppliers.length,
    distributors: distributors.length,
    warehouses: warehouses.length,
  };

  // Filtered Users based on status and role filters
  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    // Apply status filter
    if (userStatusFilter === "approved") {
      filtered = filtered.filter(u => u.isApproved && !u.isDeclined);
    } else if (userStatusFilter === "declined") {
      filtered = filtered.filter(u => u.isDeclined);
    } else if (userStatusFilter === "pending") {
      filtered = filtered.filter(u => !u.isApproved && !u.isDeclined);
    }
    
    // Apply role filter
    if (userRoleFilter !== "all") {
      filtered = filtered.filter(u => u.role === userRoleFilter && !u.isDeclined);
    }
    
    // Apply search filter
    filtered = filtered.filter(user => {
      const nameMatch = (user.firstName || user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (user.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch;
    });
    
    return filtered;
  }, [users, userStatusFilter, userRoleFilter, searchQuery]);

  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  // Filtered and Paginated Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      return supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (supplier.contact || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
             (supplier.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [suppliers, searchQuery]);

  const totalSupplierPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const paginatedSuppliers = useMemo(() => {
    const startIndex = (supplierCurrentPage - 1) * itemsPerPage;
    return filteredSuppliers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSuppliers, supplierCurrentPage]);

  // Filtered and Paginated Distributors
  const filteredDistributors = useMemo(() => {
    return distributors.filter(distributor => {
      return distributor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (distributor.contact || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
             (distributor.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
             (distributor.serviceArea || "").toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [distributors, searchQuery]);

  const totalDistributorPages = Math.ceil(filteredDistributors.length / itemsPerPage);
  const paginatedDistributors = useMemo(() => {
    const startIndex = (distributorCurrentPage - 1) * itemsPerPage;
    return filteredDistributors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDistributors, distributorCurrentPage]);

  // Filtered and Paginated Warehouses
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(warehouse => {
      return warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             warehouse.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (warehouse.manager || "").toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [warehouses, searchQuery]);

  const totalWarehousePages = Math.ceil(filteredWarehouses.length / itemsPerPage);
  const paginatedWarehouses = useMemo(() => {
    const startIndex = (warehouseCurrentPage - 1) * itemsPerPage;
    return filteredWarehouses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredWarehouses, warehouseCurrentPage]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSupplierCurrentPage(1);
    setDistributorCurrentPage(1);
    setWarehouseCurrentPage(1);
  }, [searchQuery, userStatusFilter, userRoleFilter, activeTab]);

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-6 md:px-16 lg:px-24 font-sans text-slate-200">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[300px] w-[300px] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] h-[400px] w-[400px] rounded-full bg-indigo-500/15 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[10%] h-[300px] w-[300px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>
      
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Breadcrumb */}
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
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm tracking-wide mt-1">
            Manage users, suppliers, distributors, and warehouses
          </p>
        </div>

        {/* Main Tab Navigation */}
        <div className="border-b border-white/10 overflow-x-auto">
          <div className="flex gap-8 min-w-max">
            <button
              onClick={() => {
                setActiveTab("users");
                setSearchQuery("");
                setUserStatusFilter("all");
                setUserRoleFilter("all");
              }}
              className={`pb-3 px-1 text-sm font-medium transition-all duration-200 relative ${
                activeTab === "users" ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <IconUsers size={16} />
                Users
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 bg-white/10 text-slate-400">
                  {stats.total}
                </Badge>
              </div>
              {activeTab === "users" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
            
            <button
              onClick={() => {
                setActiveTab("suppliers");
                setSearchQuery("");
              }}
              className={`pb-3 px-1 text-sm font-medium transition-all duration-200 relative ${
                activeTab === "suppliers" ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <IconTruck size={16} />
                Suppliers
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 bg-white/10 text-slate-400">
                  {stats.suppliers}
                </Badge>
              </div>
              {activeTab === "suppliers" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
            
            <button
              onClick={() => {
                setActiveTab("distributors");
                setSearchQuery("");
              }}
              className={`pb-3 px-1 text-sm font-medium transition-all duration-200 relative ${
                activeTab === "distributors" ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <IconPackage size={16} />
                Distributors
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 bg-white/10 text-slate-400">
                  {stats.distributors}
                </Badge>
              </div>
              {activeTab === "distributors" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
            
            <button
              onClick={() => {
                setActiveTab("warehouses");
                setSearchQuery("");
              }}
              className={`pb-3 px-1 text-sm font-medium transition-all duration-200 relative ${
                activeTab === "warehouses" ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <IconBuildingWarehouse size={16} />
                Warehouses
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 bg-white/10 text-slate-400">
                  {stats.warehouses}
                </Badge>
              </div>
              {activeTab === "warehouses" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Users Tab Content */}
        {activeTab === "users" && (
          <>
            {/* Status Filter Tabs */}
            <div className="border-b border-white/5  ">
              <div className="flex  gap-1">
                <button
                  onClick={() => setUserStatusFilter("all")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                    userStatusFilter === "all"
                      ? "bg-white/5 text-white border-b-2 border-white"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <IconUsers size={14} />
                    All Users
                    <Badge className="ml-1 text-[10px] bg-white/10">{stats.total}</Badge>
                  </div>
                </button>
                <button
                  onClick={() => setUserStatusFilter("approved")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                    userStatusFilter === "approved"
                      ? "bg-white/5 text-white border-b-2 border-white"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <IconUserCheck size={14} className="text-green-400" />
                    Approved
                    <Badge className="ml-1 text-[10px] bg-green-500/20 text-green-400">{stats.approved}</Badge>
                  </div>
                </button>
                <button
                  onClick={() => setUserStatusFilter("pending")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                    userStatusFilter === "pending"
                      ? "bg-white/5 text-white border-b-2 border-white"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <IconUser size={14} className="text-yellow-400" />
                    Pending
                    <Badge className="ml-1 text-[10px] bg-yellow-500/20 text-yellow-400">{stats.pending}</Badge>
                  </div>
                </button>
                <button
                  onClick={() => setUserStatusFilter("declined")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                    userStatusFilter === "declined"
                      ? "bg-white/5 text-white border-b-2 border-white"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <IconUserCancel size={14} className="text-red-400" />
                    Declined
                    <Badge className="ml-1 text-[10px] bg-red-500/20 text-red-400">{stats.declined}</Badge>
                  </div>
                </button>
              </div>
            </div>

            


            {/* Users Table */}
            <Card className="bg-white/[0.01] border-white/5 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-center gap-4">
                {/* Search Bar */}
              <div className="relative w-64">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <Input 
                  placeholder="Search users..."
                  className="pl-9 bg-white/[0.03] border-white/5 text-sm text-white rounded-xl h-9 focus:ring-1 focus:ring-white/10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {/* Role Filter Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setUserRoleFilter("all")}
                className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                  userRoleFilter === "all"
                    ? "bg-white/10 text-white"
                    : "bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                All Roles
              </button>
              {roleOptions.map((role) => {
                const RoleIcon = role.icon;
                const roleCount = stats[role.value];
                return (
                  <button
                    key={role.value}
                    onClick={() => setUserRoleFilter(role.value)}
                    className={`px-3 py-1.5 text-xs rounded-full transition-all flex items-center gap-1 ${
                      userRoleFilter === role.value
                        ? "bg-white/10 text-white"
                        : "bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    <RoleIcon size={12} className={role.color} />
                    {role.label}
                    <Badge className="ml-1 text-[9px] bg-white/10">
                      {roleCount || 0}
                    </Badge>
                  </button>
                );
              })}
            </div>
            </div>
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
                      <TableRow><TableCell colSpan={4} className="h-40 text-center text-slate-500 text-sm">No users found</TableCell></TableRow>
                    ) : (
                      paginatedUsers.map((user) => {
                        const role = roleOptions.find(r => r.value === user.role) || roleOptions[3];
                        const RoleIcon = role.icon;
                        return (
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
                              <Badge className={`border-none rounded-lg text-xs px-3 py-1 cursor-default font-medium flex items-center gap-1 w-fit ${
                                user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                                user.role === 'manager' ? 'bg-blue-500/10 text-blue-400' :
                                user.role === 'staff' ? 'bg-green-500/10 text-green-400' :
                                'bg-slate-500/10 text-slate-400'
                              }`}>
                                <RoleIcon size={12} />
                                {(user.role || 'other').toUpperCase()}
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
                                  <div className="flex items-center gap-1 text-xs text-yellow-400/80 bg-yellow-500/5 px-2 py-1 rounded-md cursor-default">
                                    Pending
                                  </div>
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
                                  <DropdownMenuLabel className="text-xs text-slate-600 uppercase tracking-wider p-3">Actions</DropdownMenuLabel>
                                  {!user.isApproved && !user.isDeclined && (
                                    <DropdownMenuItem className="text-sm focus:bg-white/5 cursor-pointer py-2" onClick={() => handleUpdateUser(user.uid, { isApproved: true })}>
                                      <IconChecklist size={14} className="mr-2 text-green-400" /> Approve Account
                                    </DropdownMenuItem>
                                  )}
                                  {user.isApproved && !user.isDeclined && (
                                    <DropdownMenuItem className="text-sm focus:bg-white/5 cursor-pointer py-2" onClick={() => handleUpdateUser(user.uid, { isApproved: false })}>
                                      <IconBan size={14} className="mr-2 text-yellow-400" /> Revoke Access
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator className="bg-white/5" />
                                  <DropdownMenuItem className="text-sm focus:bg-white/5 cursor-pointer py-2" onClick={() => {
                                    const newRole = user.role === 'admin' ? 'manager' : user.role === 'manager' ? 'staff' : user.role === 'staff' ? 'other' : 'staff';
                                    handleUpdateUser(user.uid, { role: newRole });
                                  }}>
                                    Change Role: {user.role === 'admin' ? '→ Manager' : user.role === 'manager' ? '→ Staff' : user.role === 'staff' ? '→ Other' : '→ Staff'}
                                  </DropdownMenuItem>
                                  {!user.isDeclined && !user.isApproved && (
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
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
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
          <div className="space-y-5">
            {/* Add Supplier Button */}
            <div className="flex justify-end">
              <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white/5 hover:bg-white/10 text-white text-sm cursor-pointer">
                    <IconPlus size={14} className="mr-2" /> Add Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0f0f0f] border-white/10 text-slate-200 rounded-2xl max-w-md">
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
                    <div>
                      <Label className="text-sm text-slate-400">Contact Person</Label>
                      <Input 
                        value={supplierForm.contact}
                        onChange={(e) => setSupplierForm({...supplierForm, contact: e.target.value})}
                        className="bg-white/[0.03] border-white/10 text-sm mt-1"
                        placeholder="John Smith"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-slate-400">Email</Label>
                        <Input 
                          value={supplierForm.email}
                          onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                          className="bg-white/[0.03] border-white/10 text-sm mt-1"
                          placeholder="contact@abcmetals.com"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-slate-400">Phone</Label>
                        <Input 
                          value={supplierForm.phone}
                          onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                          className="bg-white/[0.03] border-white/10 text-sm mt-1"
                          placeholder="+1-555-0123"
                        />
                      </div>
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
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setSupplierDialogOpen(false)} className="text-slate-400 text-sm">Cancel</Button>
                    <Button onClick={handleAddSupplier} className="bg-white/10 hover:bg-white/20 cursor-pointer text-sm" disabled={isProcessing}>
                      {isProcessing ? "Saving..." : editingSupplier ? "Update" : "Add Supplier"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search Bar */}
            <div className="flex items-center justify-end">
              <div className="relative w-64">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <Input 
                  placeholder="Search suppliers..."
                  className="pl-9 bg-white/[0.03] border-white/5 text-sm text-white rounded-xl h-9 focus:ring-1 focus:ring-white/10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Suppliers Table */}
            <Card className="bg-white/[0.01] border-white/5 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6">
                <Table>
                  <TableHeader className="bg-white/[0.02]">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wider pl-8 h-12">Supplier Name</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wider h-12">Contact Person</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wider h-12">Email</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wider h-12">Phone</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wider h-12">Address</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wider h-12 text-right pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSuppliers.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-500 text-sm">No suppliers found</TableCell></TableRow>
                    ) : (
                      paginatedSuppliers.map((supplier) => (
                        <TableRow key={supplier.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                          <TableCell className="py-4 pl-8">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <IconBuildingStore size={16} className="text-blue-400" />
                              </div>
                              <span className="text-white text-sm font-medium">{supplier.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">{supplier.contact || "-"}</TableCell>
                          <TableCell className="text-slate-300 text-sm">{supplier.email || "-"}</TableCell>
                          <TableCell className="text-slate-300 text-sm">{supplier.phone || "-"}</TableCell>
                          <TableCell className="text-slate-300 text-sm max-w-xs truncate">{supplier.address || "-"}</TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex items-center justify-end gap-1">
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
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                {filteredSuppliers.length > itemsPerPage && (
                  <Pagination 
                    currentPage={supplierCurrentPage}
                    totalPages={totalSupplierPages}
                    onPageChange={setSupplierCurrentPage}
                  />
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Distributors Tab Content */}
        {activeTab === "distributors" && (
          <div className="space-y-5">
            {/* Add Distributor Button */}
            <div className="flex justify-end">
              <Dialog open={distributorDialogOpen} onOpenChange={setDistributorDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white/5 hover:bg-white/10 text-white text-sm cursor-pointer">
                    <IconPlus size={14} className="mr-2" /> Add Distributor
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0f0f0f] border-white/10 text-slate-200 rounded-2xl max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl">{editingDistributor ? "Edit Distributor" : "Add New Distributor"}</DialogTitle>
                    <DialogDescription className="text-slate-500 text-sm">
                      Enter distributor details for product distribution
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label className="text-sm text-slate-400">Distributor Name *</Label>
                      <Input 
                        value={distributorForm.name}
                        onChange={(e) => setDistributorForm({...distributorForm, name: e.target.value})}
                        className="bg-white/[0.03] border-white/10 text-sm mt-1"
                        placeholder="City Distributors Inc"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-400">Contact Person</Label>
                      <Input 
                        value={distributorForm.contact}
                        onChange={(e) => setDistributorForm({...distributorForm, contact: e.target.value})}
                        className="bg-white/[0.03] border-white/10 text-sm mt-1"
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-slate-400">Email</Label>
                        <Input 
                          value={distributorForm.email}
                          onChange={(e) => setDistributorForm({...distributorForm, email: e.target.value})}
                          className="bg-white/[0.03] border-white/10 text-sm mt-1"
                          placeholder="sales@citydist.com"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-slate-400">Phone</Label>
                        <Input 
                          value={distributorForm.phone}
                          onChange={(e) => setDistributorForm({...distributorForm, phone: e.target.value})}
                          className="bg-white/[0.03] border-white/10 text-sm mt-1"
                          placeholder="+1-555-0456"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-400">Service Area</Label>
                      <Input 
                        value={distributorForm.serviceArea}
                        onChange={(e) => setDistributorForm({...distributorForm, serviceArea: e.target.value})}
                        className="bg-white/[0.03] border-white/10 text-sm mt-1"
                        placeholder="North America Region"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-400">Address</Label>
                      <Input 
                        value={distributorForm.address}
                        onChange={(e) => setDistributorForm({...distributorForm, address: e.target.value})}
                        className="bg-white/[0.03] border-white/10 text-sm mt-1"
                        placeholder="456 Distribution Ave"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setDistributorDialogOpen(false)} className="text-slate-400 text-sm">Cancel</Button>
                    <Button 
                      onClick={handleAddDistributor} 
                      disabled={isProcessing}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm cursor-pointer"
                    >
                      {isProcessing ? "Saving..." : editingDistributor ? "Update" : "Add Distributor"}
                    </Button> 
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search Bar */}
            <div className="flex items-center justify-end">
              <div className="relative w-64">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <Input 
                  placeholder="Search distributors..."
                  className="pl-9 bg-white/[0.03] border-white/5 text-sm text-white rounded-xl h-9 focus:ring-1 focus:ring-white/10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Distributors Table */}
            <Card className="bg-white/[0.01] border-white/5 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6">
                <Table>
                  <TableHeader className="bg-white/[0.02]">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wider pl-8 h-12">Distributor Name</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wider h-12">Contact Person</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wider h-12">Email</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wider h-12">Phone</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wider h-12">Service Area</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wider h-12">Address</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wider h-12 text-right pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDistributors.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="h-40 text-center text-slate-500 text-sm">No distributors found</TableCell></TableRow>
                    ) : (
                      paginatedDistributors.map((distributor) => (
                        <TableRow key={distributor.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                          <TableCell className="py-4 pl-8">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <IconPackage size={16} className="text-green-400" />
                              </div>
                              <span className="text-white text-sm font-medium">{distributor.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">{distributor.contact || "-"}</TableCell>
                          <TableCell className="text-slate-300 text-sm">{distributor.email || "-"}</TableCell>
                          <TableCell className="text-slate-300 text-sm">{distributor.phone || "-"}</TableCell>
                          <TableCell className="text-slate-300 text-sm">{distributor.serviceArea || "-"}</TableCell>
                          <TableCell className="text-slate-300 text-sm max-w-xs truncate">{distributor.address || "-"}</TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 text-slate-500 hover:text-white" onClick={() => {
                                setEditingDistributor(distributor);
                                setDistributorForm(distributor);
                                setDistributorDialogOpen(true);
                              }}>
                                <IconEdit size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 text-slate-500 hover:text-red-400" onClick={() => handleDeleteDistributor(distributor.id)}>
                                <IconTrash size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                {filteredDistributors.length > itemsPerPage && (
                  <Pagination 
                    currentPage={distributorCurrentPage}
                    totalPages={totalDistributorPages}
                    onPageChange={setDistributorCurrentPage}
                  />
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Warehouses Tab Content */}
        {activeTab === "warehouses" && (
          <div className="space-y-5">
            {/* Add Warehouse Button */}
            <div className="flex justify-end">
              <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white/5 hover:bg-white/10 text-white text-sm cursor-pointer">
                    <IconPlus size={14} className="mr-2" /> Add Warehouse
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0f0f0f] border-white/10 text-slate-200 rounded-2xl max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl">{editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}</DialogTitle>
                    <DialogDescription className="text-slate-500 text-sm">
                      Enter warehouse details for inventory storage
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label className="text-sm text-slate-400">Warehouse Name *</Label>
                      <Input 
                        value={warehouseForm.name}
                        onChange={(e) => setWarehouseForm({...warehouseForm, name: e.target.value})}
                        className="bg-white/[0.03] border-white/10 text-sm mt-1"
                        placeholder="Main Warehouse"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-400">Location *</Label>
                      <Input 
                        value={warehouseForm.location}
                        onChange={(e) => setWarehouseForm({...warehouseForm, location: e.target.value})}
                        className="bg-white/[0.03] border-white/10 text-sm mt-1"
                        placeholder="Building A, Floor 2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-slate-400">Warehouse Type</Label>
                        <Select value={warehouseForm.type} onValueChange={(v) => setWarehouseForm({...warehouseForm, type: v})}>
                          <SelectTrigger className="bg-white/[0.03] border-white/10 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouseTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm text-slate-400">Capacity (sq ft)</Label>
                        <Input 
                          type="number"
                          value={warehouseForm.capacity}
                          onChange={(e) => setWarehouseForm({...warehouseForm, capacity: e.target.value})}
                          className="bg-white/[0.03] border-white/10 text-sm mt-1"
                          placeholder="10000"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-slate-400">Manager Name</Label>
                        <Input 
                          value={warehouseForm.manager}
                          onChange={(e) => setWarehouseForm({...warehouseForm, manager: e.target.value})}
                          className="bg-white/[0.03] border-white/10 text-sm mt-1"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-slate-400">Phone</Label>
                        <Input 
                          value={warehouseForm.phone}
                          onChange={(e) => setWarehouseForm({...warehouseForm, phone: e.target.value})}
                          className="bg-white/[0.03] border-white/10 text-sm mt-1"
                          placeholder="+1-555-0123"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setWarehouseDialogOpen(false)} className="text-slate-400 cursor-pointer text-sm">Cancel</Button>
                    <Button 
                        onClick={handleAddWarehouse} 
                        disabled={isProcessing}
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                      >
                        {isProcessing ? "Saving..." : editingWarehouse ? "Update" : "Add Warehouse"}
                      </Button>   
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search Bar */}
            <div className="flex items-center justify-end">
              <div className="relative w-64">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <Input 
                  placeholder="Search warehouses..."
                  className="pl-9 bg-white/[0.03] border-white/5 text-sm text-white rounded-xl h-9 focus:ring-1 focus:ring-white/10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Warehouses Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {paginatedWarehouses.map(warehouse => (
                <Card key={warehouse.id} className="bg-white/[0.02] border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all duration-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <IconBuildingWarehouse size={20} className="text-purple-400" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-white">{warehouse.name}</h3>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <IconLocation size={12} />
                              {warehouse.location}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          {warehouse.type && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Badge variant="outline" className="text-[10px] bg-white/5">
                                {warehouseTypes.find(t => t.value === warehouse.type)?.label || warehouse.type}
                              </Badge>
                            </div>
                          )}
                          {warehouse.capacity && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>Capacity: {warehouse.capacity} sq ft</span>
                            </div>
                          )}
                          {warehouse.manager && (
                            <div className="col-span-2 flex items-center gap-2 text-xs text-slate-500">
                              <IconUserCircle size={12} />
                              <span>Manager: {warehouse.manager}</span>
                            </div>
                          )}
                          {warehouse.phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <IconPhone size={12} />
                              <span>{warehouse.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 text-slate-500 hover:text-white" onClick={() => {
                          setEditingWarehouse(warehouse);
                          setWarehouseForm({
                            name: warehouse.name || "",
                            location: warehouse.location || "",
                            type: warehouse.type || "main",
                            capacity: warehouse.capacity?.toString() || "",
                            manager: warehouse.manager || "",
                            phone: warehouse.phone || "",
                          });
                          setWarehouseDialogOpen(true);
                        }}>
                          <IconEdit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 text-slate-500 hover:text-red-400" onClick={() => handleDeleteWarehouse(warehouse.id)}>
                          <IconTrash size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredWarehouses.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">
                {searchQuery ? "No warehouses match your search" : "No warehouses added yet"}
              </div>
            )}
            
            {/* Pagination */}
            {filteredWarehouses.length > itemsPerPage && (
              <Pagination 
                currentPage={warehouseCurrentPage}
                totalPages={totalWarehousePages}
                onPageChange={setWarehouseCurrentPage}
              />
            )}
          </div>
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