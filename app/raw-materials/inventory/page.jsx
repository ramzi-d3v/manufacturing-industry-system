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
  IconBuildingWarehouse,
  IconDownload,
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
  const [warehouseStats, setWarehouseStats] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [suppliersList, setSuppliersList] = useState([]);
  const [warehousesList, setWarehousesList] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [exporting, setExporting] = useState(false);
  
  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [stats, setStats] = useState({
    totalMaterials: 0,
    totalQuantity: 0,
    totalValue: 0,
    totalDefective: 0,
    defectiveValue: 0,
    supplierDefects: 0,
    warehouseDefects: 0,
    totalSuppliers: 0,
    totalWarehouses: 0,
    inStockCount: 0,
    outOfStockCount: 0,
  });

  // Export to CSV function
  const exportToCSV = () => {
    if (filteredMaterials.length === 0) {
      toast.error("No data to export");
      return;
    }

    setExporting(true);
    try {
      // Define CSV headers
      const headers = [
        "Material Name",
        "Batch Number",
        "Category",
        "Type",
        "Unit",
        "Quantity",
        "Unit Price (USD)",
        "Total Value (USD)",
        "Status",
        "Supplier Name",
        "Supplier Contact",
        "Supplier Phone",
        "Supplier Email",
        "Warehouse Name",
        "Warehouse Location",
        "Storage Location",
        "Shelf Location",
        "Description",
        "Created At"
      ];

      // Map materials to CSV rows
      const rows = filteredMaterials.map(material => [
        material.name || "",
        material.batchNumber || "",
        material.category || "",
        material.type || "",
        material.unit || "kg",
        material.quantity || 0,
        material.unitPrice || 0,
        ((material.quantity || 0) * (material.unitPrice || 0)).toFixed(2),
        material.status || "Unknown",
        material.supplierName || "",
        material.supplierContact || "",
        material.supplierPhone || "",
        material.supplierEmail || "",
        material.warehouseName || "Not assigned",
        material.location || "",
        material.storageLocationName || "",
        material.shelfLocation || "",
        material.description || "",
        material.createdAt?.toDate ? material.createdAt.toDate().toLocaleDateString() : ""
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...rows.map(row => 
          row.map(cell => {
            if (typeof cell === "string" && (cell.includes(",") || cell.includes('"') || cell.includes("\n"))) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          }).join(",")
        )
      ].join("\n");

      // Add BOM for UTF-8 encoding and create download
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute("download", `raw_materials_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${filteredMaterials.length} materials successfully!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  // Get current user and fetch suppliers from Firestore
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!user) return;
      
      setLoadingSuppliers(true);
      try {
        const suppliersRef = collection(db, "suppliers");
        const suppliersSnapshot = await getDocs(suppliersRef);
        const suppliersData = suppliersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSuppliersList(suppliersData);
      } catch (error) {
        console.error("Error fetching suppliers from Firestore:", error);
        toast.error("Failed to load suppliers");
      } finally {
        setLoadingSuppliers(false);
      }
    };
    
    fetchSuppliers();
  }, [user]);

  // Fetch warehouses from Firestore
  useEffect(() => {
    const fetchWarehouses = async () => {
      if (!user) return;
      
      try {
        const warehousesRef = collection(db, "warehouses", user.uid, "list");
        const warehousesSnapshot = await getDocs(warehousesRef);
        const warehousesData = warehousesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setWarehousesList(warehousesData);
      } catch (error) {
        console.error("Error fetching warehouses:", error);
      }
    };
    
    fetchWarehouses();
  }, [user]);

  // Firestore real-time listener for user's raw materials subcollection
  useEffect(() => {
    if (!user) {
      setLoadingData(false);
      setMaterials([]);
      return;
    }

    setLoadingData(true);
    
    const userMaterialsRef = collection(db, "rawMaterials", user.uid, "materials");
    const q = query(userMaterialsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const materialsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
          };
        });
        
        setMaterials(materialsData);
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

    // Calculate stats with total value from quantity * unitPrice
    const totalQuantity = filtered.reduce((sum, m) => sum + (m.quantity || 0), 0);
    const totalValue = filtered.reduce((sum, m) => sum + ((m.quantity || 0) * (m.unitPrice || 0)), 0);
    const inStockCount = filtered.filter(m => m.status === "In Stock").length;
    const outOfStockCount = filtered.filter(m => m.status === "Out of Stock").length;
    const uniqueSuppliers = new Set(filtered.map(m => m.supplierName)).size;
    const uniqueWarehouses = new Set(filtered.map(m => m.warehouseName).filter(w => w)).size;

    setStats({
      totalMaterials: filtered.length,
      totalQuantity: totalQuantity,
      totalValue: totalValue,
      totalDefective: 0,
      defectiveValue: 0,
      supplierDefects: 0,
      warehouseDefects: 0,
      totalSuppliers: uniqueSuppliers,
      totalWarehouses: uniqueWarehouses,
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
          totalQuantity: 0,
        });
      }
      if (m.supplierName) {
        const supplier = supplierMap.get(m.supplierName);
        supplier.materials.push(m.name);
        supplier.totalValue += (m.quantity || 0) * (m.unitPrice || 0);
        supplier.totalQuantity += (m.quantity || 0);
      }
    });
    setSupplierStats(Array.from(supplierMap.values()));

    // Warehouse stats
    const warehouseMap = new Map();
    filtered.forEach(m => {
      if (m.warehouseName && !warehouseMap.has(m.warehouseName)) {
        warehouseMap.set(m.warehouseName, {
          name: m.warehouseName,
          materials: [],
          totalValue: 0,
          totalQuantity: 0,
        });
      }
      if (m.warehouseName) {
        const warehouse = warehouseMap.get(m.warehouseName);
        warehouse.materials.push(m.name);
        warehouse.totalValue += (m.quantity || 0) * (m.unitPrice || 0);
        warehouse.totalQuantity += (m.quantity || 0);
      }
    });
    setWarehouseStats(Array.from(warehouseMap.values()));
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
              <IconLoader className="animate-spin text-primary" size={32} />
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
            <Card className="max-w-md bg-background/80 backdrop-blur-sm border-border/50">
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
            <Card className="max-w-md bg-background/80 backdrop-blur-sm border-border/50">
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
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader className="relative overflow-hidden" />
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">           
          <div className="absolute top-[30%] -right-[10%] h-[400px] w-[400px] rounded-full bg-indigo-500/15 blur-[120px] " />
          <div className="absolute bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-fuchsia-600/10 blur-[100px] " />
        </div>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Raw Materials</h2>
              <p className="text-muted-foreground">
                Track inventory, costs, and material batches
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={exportToCSV} 
                variant="outline" 
                className="cursor-pointer"
                disabled={exporting || filteredMaterials.length === 0}
              >
                <IconDownload className="mr-2 h-4 w-4" />
                {exporting ? "Exporting..." : `Export (${filteredMaterials.length})`}
              </Button>
              <Button onClick={handleAddClick} className="cursor-pointer">
                <IconPlus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
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
                    <Badge className="bg-red-500/10 text-red-600 border-red-500/20 px-1.5 py-0 text-[10px]">
                      {stats.outOfStockCount} Out of Stock
                    </Badge>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Total unique material batches
                </p>
              </CardContent>
            </Card>

            {/* Total Quantity Card */}
            <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Quantity
                  </CardTitle>
                  <IconTruck className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold mt-2">{stats.totalQuantity.toLocaleString()}</div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    {stats.totalQuantity > 1000 ? (
                      <IconTrendingUp className="h-3 w-3 text-green-500" />
                    ) : stats.totalQuantity > 0 ? (
                      <IconTrendingUp className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <IconTrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-muted-foreground">
                      {stats.totalQuantity > 1000 ? 'High Volume' : stats.totalQuantity > 0 ? 'Medium Volume' : 'No Stock'}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {stats.totalMaterials > 0 && (
                      <span>Avg: {(stats.totalQuantity / stats.totalMaterials).toFixed(1)}/batch</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Total units across all materials
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
                  ${stats.totalValue.toLocaleString()}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    {stats.totalValue > 100000 ? (
                      <IconTrendingUp className="h-3 w-3 text-green-500" />
                    ) : stats.totalValue > 0 ? (
                      <IconTrendingUp className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <IconTrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-muted-foreground">
                      {stats.totalValue > 100000 ? 'High Value' : stats.totalValue > 0 ? 'Medium Value' : 'No Value'}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {stats.totalMaterials > 0 && (
                      <span>Avg: ${(stats.totalValue / stats.totalMaterials).toFixed(0)}</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Total inventory valuation (quantity × unit price)
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
                    {stats.totalMaterials > 0 && stats.totalSuppliers > 0 && (
                      <span>{(stats.totalMaterials / stats.totalSuppliers).toFixed(1)}/supplier</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Material sourcing partners
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search, Filters, and Sort Section */}
          <div className="flex flex-col gap-3">
            {/* Main search and actions row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  placeholder="Search by name, batch number, supplier, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 w-full bg-background/80 backdrop-blur-sm border-border/50"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] h-10 bg-background/80 backdrop-blur-sm border-border/50">
                    <IconPackage className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[130px] h-10 bg-background/80 backdrop-blur-sm border-border/50">
                    <IconFilter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] h-10 bg-background/80 backdrop-blur-sm border-border/50">
                    <IconSortAscending className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="h-10 px-3 bg-background/80 backdrop-blur-sm border-border/50"
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
                  <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm border-border/50">
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
                  <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm border-border/50">
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
                  <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm border-border/50">
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
              <Badge variant="outline" className="px-2 py-0 h-6 bg-background/80 backdrop-blur-sm border-border/50">
                {filteredMaterials.length} {filteredMaterials.length === 1 ? "material" : "materials"}
              </Badge>
            </div>
          </div>

          {/* Main Content - Glass Table */}
          <Card className="bg-background/40 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Raw Materials Inventory</CardTitle>
              <CardDescription>
                All material batches in stock. Click on any batch number to see details.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
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
  );
}