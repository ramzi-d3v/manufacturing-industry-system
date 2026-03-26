"use client";

import { useState, useEffect } from "react";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import {
  IconPackage,
  IconTruck,
  IconCurrencyDollar,
  IconBuildingStore,
  IconRefresh,
  IconLoader,
  IconPlus,
  IconSearch,
  IconX,
  IconFilter,
  IconSortAscending,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  onSnapshot,
  orderBy,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { RawMaterialTable } from "@/components/raw-material-table";
import { RawMaterialPopup } from "@/components/raw-material-popup";

// Frontend categories
const categories = [
  { id: "raw", name: "Raw Material" },
  { id: "component", name: "Component" },
  { id: "packaging", name: "Packaging" },
  { id: "hardware", name: "Hardware" },
  { id: "chemicals", name: "Chemicals" },
  { id: "electronics", name: "Electronics" },
  { id: "textiles", name: "Textiles" },
  { id: "consumables", name: "Consumables" },
];

// Status options for filtering
const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "In Stock", label: "In Stock" },
  { value: "Out of Stock", label: "Out of Stock" },
];

// Sort options
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "price-asc", label: "Price (Low to High)" },
  { value: "price-desc", label: "Price (High to Low)" },
];

export default function RawMaterialPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [defectiveMaterials, setDefectiveMaterials] = useState([]);
  const [supplierStats, setSupplierStats] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [suppliersList, setSuppliersList] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  
  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  
  const [stats, setStats] = useState({
    totalMaterials: 0,
    totalValue: 0,
    totalDefective: 0,
    defectiveValue: 0,
    supplierDefects: 0,
    warehouseDefects: 0,
    totalSuppliers: 0,
    inStockCount: 0,
    outOfStockCount: 0,
  });

  // Get current user and fetch suppliers from Firestore
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!user) return;
      
      setLoadingSuppliers(true);
      try {
        // Fetch suppliers from suppliers/{userId}/list
        const suppliersRef = collection(db, "suppliers", user.uid, "list");
        const suppliersSnapshot = await getDocs(suppliersRef);
        const suppliersData = suppliersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSuppliersList(suppliersData);
        console.log("Suppliers loaded:", suppliersData.length);
      } catch (error) {
        console.error("Error fetching suppliers from Firestore:", error);
        toast.error("Failed to load suppliers");
      } finally {
        setLoadingSuppliers(false);
      }
    };
    
    fetchSuppliers();
  }, [user]);

  // Firestore real-time listener for user's raw materials subcollection
  useEffect(() => {
    if (!user) {
      setLoadingData(false);
      setMaterials([]);
      return;
    }

    setLoadingData(true);
    
    // Reference to the user's raw materials subcollection
    const userMaterialsRef = collection(db, "rawMaterials", user.uid, "materials");
    const q = query(userMaterialsRef, orderBy("createdAt", "desc"));

    console.log("Setting up listener for:", `rawMaterials/${user.uid}/materials`);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("Snapshot received, size:", snapshot.size);
        const materialsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("Material data:", { id: doc.id, ...data });
          return {
            id: doc.id,
            ...data,
          };
        });
        
        setMaterials(materialsData);
        console.log("Materials loaded:", materialsData.length);
        setLoadingData(false);
        setError(null);
      },
      (err) => {
        console.error("Firestore error:", err);
        setError("Failed to load materials. Please try again.");
        setLoadingData(false);
        toast.error("Error loading materials");
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...materials];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((m) => m.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((m) => m.category === categoryFilter);
    }

    // Apply sorting
    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate()));
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.createdAt?.toDate()) - new Date(b.createdAt?.toDate()));
    } else if (sortBy === "name-asc") {
      filtered.sort((a, b) => a.name?.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      filtered.sort((a, b) => b.name?.localeCompare(a.name));
    } else if (sortBy === "price-asc") {
      filtered.sort((a, b) => (a.unitPrice || 0) - (b.unitPrice || 0));
    } else if (sortBy === "price-desc") {
      filtered.sort((a, b) => (b.unitPrice || 0) - (a.unitPrice || 0));
    }

    setFilteredMaterials(filtered);

    // Calculate filtered stats
    const totalValue = filtered.reduce((sum, m) => sum + (m.unitPrice || 0), 0);
    const inStockCount = filtered.filter(m => m.status === "In Stock").length;
    const outOfStockCount = filtered.filter(m => m.status === "Out of Stock").length;
    const uniqueSuppliers = new Set(filtered.map(m => m.supplierName)).size;

    setStats({
      totalMaterials: filtered.length,
      totalValue,
      totalDefective: 0,
      defectiveValue: 0,
      supplierDefects: 0,
      warehouseDefects: 0,
      totalSuppliers: uniqueSuppliers,
      inStockCount,
      outOfStockCount,
    });

    // Supplier stats based on filtered data
    const supplierMap = new Map();
    filtered.forEach(m => {
      if (m.supplierName && !supplierMap.has(m.supplierName)) {
        supplierMap.set(m.supplierName, {
          name: m.supplierName,
          materials: [],
          totalValue: 0,
        });
      }
      if (m.supplierName) {
        const supplier = supplierMap.get(m.supplierName);
        supplier.materials.push(m.name);
        supplier.totalValue += m.unitPrice || 0;
      }
    });
    setSupplierStats(Array.from(supplierMap.values()));
  }, [materials, searchQuery, statusFilter, categoryFilter, sortBy]);

  // Add new material
  const handleMaterialAdded = async () => {
    toast.success("Material saved successfully!");
  };

  // Update material
  const handleUpdateMaterial = async (updatedMaterial) => {
    if (!user || !updatedMaterial.id) return;

    try {
      const materialRef = doc(db, "rawMaterials", user.uid, "materials", updatedMaterial.id);
      await updateDoc(materialRef, {
        ...updatedMaterial,
        updatedAt: Timestamp.now(),
      });
      toast.success("Material updated successfully!");
    } catch (err) {
      console.error("Error updating material:", err);
      toast.error("Failed to update material: " + err.message);
    }
  };

  // Delete material
  const handleDeleteMaterial = async (id) => {
    if (!user || !id) return;
    try {
      const materialRef = doc(db, "rawMaterials", user.uid, "materials", id);
      await deleteDoc(materialRef);
      toast.success("Material deleted successfully!");
    } catch (err) {
      console.error("Error deleting material:", err);
      toast.error("Failed to delete material: " + err.message);
    }
  };

  // Open popup for adding new material
  const handleAddClick = () => {
    setEditingMaterial(null);
    setIsPopupOpen(true);
  };

  // Open popup for editing material
  const handleEditMaterial = (material) => {
    setEditingMaterial(material);
    setIsPopupOpen(true);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSortBy("newest");
  };

  // Loading states
  if (loadingAuth || loadingData) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex-1 p-8 flex items-center justify-center">
            <div className="text-center">
              <IconLoader className="animate-spin text-slate-700" size={32} />
              <p className="mt-2 text-muted-foreground">Loading materials...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex-1 p-8 flex items-center justify-center">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => window.location.reload()} className="cursor-pointer">
                  <IconRefresh className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!user) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex-1 p-8 flex items-center justify-center">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please log in to view raw materials.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
  <>
    <style jsx global>{`
      @keyframes pulse-glow-bright-1 {
        0%, 100% {
          opacity: 0.5;
          transform: scale(1);
        }
        50% {
          opacity: 0.9;
          transform: scale(1.25);
        }
      }
      
      @keyframes pulse-glow-bright-2 {
        0%, 100% {
          opacity: 0.4;
          transform: scale(1);
        }
        50% {
          opacity: 0.85;
          transform: scale(1.3);
        }
      }
      
      @keyframes pulse-glow-bright-3 {
        0%, 100% {
          opacity: 0.35;
          transform: scale(1);
        }
        50% {
          opacity: 0.8;
          transform: scale(1.2);
        }
      }
      
      .animate-pulse-bright-1 {
        animation: pulse-glow-bright-1 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      
      .animate-pulse-bright-2 {
        animation: pulse-glow-bright-2 5s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.5s;
      }
      
      .animate-pulse-bright-3 {
        animation: pulse-glow-bright-3 4.5s cubic-bezier(0.4, 0, 0.6, 1) infinite 1s;
      }
    `}</style>
    
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader className="relative overflow-hidden bg-zinc-950" />
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {/* Top Left Glow - Brighter Purple */}
          <div className="absolute -top-[10%] -left-[10%] h-50 w-50 rounded-full bg-purple-500/30 blur-[100px] animate-pulse-bright-1" />
          {/* Center Right Glow - Brighter Indigo */}
          <div className="absolute top-[20%] -right-[5%] h-100 w-100 rounded-full bg-indigo-400/25 blur-[90px] animate-pulse-bright-2" />
          {/* Bottom Left Glow - Brighter Fuchsia */}
          <div className="absolute bottom-[10%] -left-[5%] h-50 w-75 rounded-full bg-fuchsia-500/20 blur-[70px] animate-pulse-bright-3" />
        </div>
        
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-100">Raw Materials</h2>
              <p className="text-muted-foreground">
                Track inventory, costs, and material batches
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddClick} variant="outline" className="cursor-pointer">
                <IconPlus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </div>
          </div>

          {/* Stats Cards - Enhanced with trend indicators */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Materials Card */}
            <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Materials
                  </CardTitle>
                  <IconPackage className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold mt-2">{stats.totalMaterials}</div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-1.5 py-0 text-[10px]">
                      {stats.inStockCount} In Stock
                    </Badge>
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-1.5 py-0 text-[10px]">
                      {stats.outOfStockCount} Out of Stock
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {stats.totalMaterials > 0 ? (
                      <IconTrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <IconTrendingDown className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span>Active</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Total inventory items tracked
                </p>
              </CardContent>
            </Card>

            {/* Total Value Card */}
            <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Value
                  </CardTitle>
                  <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold mt-2">
                  Tsh {stats.totalValue.toLocaleString()}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    {stats.totalValue > 1000000 ? (
                      <IconTrendingUp className="h-3 w-3 text-green-500" />
                    ) : stats.totalValue > 0 ? (
                      <IconTrendingUp className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <IconTrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-muted-foreground">
                      {stats.totalValue > 1000000 ? 'High Value' : stats.totalValue > 0 ? 'Medium Value' : 'No Value'}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {stats.totalMaterials > 0 && (
                      <span>Avg: Tsh {(stats.totalValue / stats.totalMaterials).toFixed(0)}</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Current inventory valuation
                </p>
              </CardContent>
            </Card>

            {/* Suppliers Card */}
            <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Active Suppliers
                  </CardTitle>
                  <IconBuildingStore className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold mt-2">{stats.totalSuppliers}</div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    {stats.totalSuppliers > 5 ? (
                      <IconTrendingUp className="h-3 w-3 text-green-500" />
                    ) : stats.totalSuppliers > 0 ? (
                      <IconTrendingUp className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <IconTrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-muted-foreground">
                      {stats.totalSuppliers > 5 ? 'Strong Network' : stats.totalSuppliers > 0 ? 'Growing' : 'No Suppliers'}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {stats.totalMaterials > 0 && (
                      <span>Avg: {(stats.totalMaterials / stats.totalSuppliers).toFixed(1)}/supplier</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Material sourcing partners
                </p>
              </CardContent>
            </Card>

            {/* Batches Card */}
            <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Material Batches
                  </CardTitle>
                  <IconTruck className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold mt-2">{stats.totalMaterials}</div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    {stats.inStockCount > stats.outOfStockCount ? (
                      <IconTrendingUp className="h-3 w-3 text-green-500" />
                    ) : stats.inStockCount === stats.outOfStockCount ? (
                      <IconMinus className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <IconTrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-muted-foreground">
                      {stats.inStockCount > stats.outOfStockCount ? 'Healthy Stock' : 'Low Stock Alert'}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {stats.inStockCount > 0 && (
                      <span>{Math.round((stats.inStockCount / stats.totalMaterials) * 100)}% in stock</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Unique batch tracking
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search, Filters, and Sort Section */}
          <div className="flex flex-col gap-3">
            {/* Main search and actions row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <IconSearch className="z-10absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, batch number, supplier, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 w-full bg-background/80 backdrop-blur-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] h-10 cursor-pointer bg-background/80 backdrop-blur-sm">
                    <IconPackage className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[130px] h-10 cursor-pointer bg-background/80 backdrop-blur-sm">
                    <IconFilter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="cursor-pointer">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name} className="cursor-pointer">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] h-10 cursor-pointer bg-background/80 backdrop-blur-sm">
                    <IconSortAscending className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-10 px-3 bg-background/80 backdrop-blur-sm"
                  title="Reset all filters"
                >
                  <IconRefresh className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Active filters display */}
            {(searchQuery || statusFilter !== "all" || categoryFilter !== "all") && (
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm">
                    <IconSearch className="h-3 w-3" />
                    Search: {searchQuery}
                    <button
                      onClick={() => setSearchQuery("")}
                      className="ml-1 hover:text-destructive"
                    >
                      <IconX className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm">
                    <IconPackage className="h-3 w-3" />
                    Status: {statusFilter}
                    <button
                      onClick={() => setStatusFilter("all")}
                      className="ml-1 hover:text-destructive"
                    >
                      <IconX className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {categoryFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm">
                    <IconFilter className="h-3 w-3" />
                    Category: {categoryFilter}
                    <button
                      onClick={() => setCategoryFilter("all")}
                      className="ml-1 hover:text-destructive"
                    >
                      <IconX className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Results header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium">Materials Inventory</h2>
              <Badge variant="outline" className="px-2 py-0 h-6 bg-background/80 backdrop-blur-sm">
                {filteredMaterials.length} {filteredMaterials.length === 1 ? "material" : "materials"}
              </Badge>
            </div>
          </div>

          {/* Main Content */}
          <Card className="bg-background/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Raw Materials Inventory</CardTitle>
              <CardDescription>
                All material batches in stock. Click on any batch number to see details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RawMaterialTable
                data={filteredMaterials}
                onUpdate={handleUpdateMaterial}
                onDelete={handleDeleteMaterial}
              />
            </CardContent>
          </Card>
        </div>

        {/* Material Popup */}
        <RawMaterialPopup
          open={isPopupOpen}
          onOpenChange={setIsPopupOpen}
          onMaterialAdded={handleMaterialAdded}
          material={editingMaterial}
          categories={categories}
        />
      </SidebarInset>
    </SidebarProvider>
  </>
);
}