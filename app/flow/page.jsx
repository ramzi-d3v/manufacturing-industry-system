// app/logistics/flow/page.jsx
"use client";

import { useState, useEffect } from "react";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  IconPackage,
  IconTruck,
  IconBuildingWarehouse,
  IconRefresh,
  IconLoader,
  IconSearch,
  IconX,
  IconFilter,
  IconArrowUp,
  IconArrowDown,
  IconLocation,
  IconBarcode,
  IconBox,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconChartBar,
  IconCurrencyDollar,
  IconPercentage,
  IconChartPie,
  IconCategory,
  IconMinus,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Material categories
const materialCategories = [
  { id: "all", name: "All Materials" },
  { id: "raw", name: "Raw Material" },
  { id: "component", name: "Component" },
  { id: "packaging", name: "Packaging" },
  { id: "hardware", name: "Hardware" },
  { id: "chemicals", name: "Chemicals" },
];

// Product categories
const productCategories = [
  { id: "all", name: "All Products" },
  { id: "electronics", name: "Electronics" },
  { id: "furniture", name: "Furniture" },
  { id: "clothing", name: "Clothing" },
  { id: "food", name: "Food & Beverage" },
  { id: "cosmetics", name: "Cosmetics" },
];

// Helper function to format currency
const formatCurrency = (value) => {
  if (value === undefined || value === null) return "$0";
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// Helper function to format number
const formatNumber = (value) => {
  if (value === undefined || value === null) return "0";
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toLocaleString();
};

export default function LogisticsFlowPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("raw-materials");
  
  // Pagination states for Raw Materials
  const [materialCurrentPage, setMaterialCurrentPage] = useState(1);
  const [materialItemsPerPage] = useState(10);
  
  // Pagination states for Finished Products
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  const [productItemsPerPage] = useState(10);
  
  // Filter states for Raw Materials
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialCategory, setMaterialCategory] = useState("all");
  const [materialStockFilter, setMaterialStockFilter] = useState("all");
  
  // Filter states for Finished Products
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("all");
  const [productStockFilter, setProductStockFilter] = useState("all");
  
  const [stats, setStats] = useState({
    totalRawMaterials: 0,
    totalRawValue: 0,
    lowStockMaterials: 0,
    outOfStockMaterials: 0,
    totalFinishedProducts: 0,
    totalProductValue: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalLocations: 0,
  });

  // Fetch raw materials
  useEffect(() => {
    if (!user) return;

    const userMaterialsRef = collection(db, "rawMaterials", user.uid, "materials");
    const q = query(userMaterialsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const materialsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        }));
        setRawMaterials(materialsData);
      },
      (err) => {
        console.error("Error fetching raw materials:", err);
        setError("Failed to load raw materials");
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Fetch finished products
  useEffect(() => {
    if (!user) return;

    const userProductsRef = collection(db, "finishedProducts", user.uid, "products");
    const q = query(userProductsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        }));
        setFinishedProducts(productsData);
        setLoadingData(false);
      },
      (err) => {
        console.error("Error fetching finished products:", err);
        setError("Failed to load finished products");
        setLoadingData(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Filter raw materials
  useEffect(() => {
    let filtered = [...rawMaterials];

    if (materialSearch) {
      filtered = filtered.filter(
        (m) =>
          m.name?.toLowerCase().includes(materialSearch.toLowerCase()) ||
          m.batchNumber?.toLowerCase().includes(materialSearch.toLowerCase()) ||
          m.supplierName?.toLowerCase().includes(materialSearch.toLowerCase())
      );
    }

    if (materialCategory !== "all") {
      filtered = filtered.filter((m) => m.category === materialCategory);
    }

    if (materialStockFilter === "in-stock") {
      filtered = filtered.filter((m) => (m.quantity || 0) > 0);
    } else if (materialStockFilter === "low-stock") {
      filtered = filtered.filter((m) => (m.quantity || 0) > 0 && (m.quantity || 0) <= (m.reorderLevel || 5));
    } else if (materialStockFilter === "out-of-stock") {
      filtered = filtered.filter((m) => (m.quantity || 0) === 0);
    }

    setFilteredMaterials(filtered);
    setMaterialCurrentPage(1); // Reset to first page when filters change
  }, [rawMaterials, materialSearch, materialCategory, materialStockFilter]);

  // Filter finished products
  useEffect(() => {
    let filtered = [...finishedProducts];

    if (productSearch) {
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.batchNumber?.toLowerCase().includes(productSearch.toLowerCase())
      );
    }

    if (productCategory !== "all") {
      filtered = filtered.filter((p) => p.category === productCategory);
    }

    if (productStockFilter === "in-stock") {
      filtered = filtered.filter((p) => (p.quantity || 0) > 0);
    } else if (productStockFilter === "low-stock") {
      filtered = filtered.filter((p) => (p.quantity || 0) > 0 && (p.quantity || 0) <= 10);
    } else if (productStockFilter === "out-of-stock") {
      filtered = filtered.filter((p) => (p.quantity || 0) === 0);
    }

    setFilteredProducts(filtered);
    setProductCurrentPage(1); // Reset to first page when filters change
  }, [finishedProducts, productSearch, productCategory, productStockFilter]);

  // Calculate stats
  useEffect(() => {
    const totalRawMaterials = rawMaterials.length;
    const totalRawValue = rawMaterials.reduce((sum, m) => sum + ((m.unitPrice || 0) * (m.quantity || 0)), 0);
    const lowStockMaterials = rawMaterials.filter(m => (m.quantity || 0) > 0 && (m.quantity || 0) <= (m.reorderLevel || 5)).length;
    const outOfStockMaterials = rawMaterials.filter(m => (m.quantity || 0) === 0).length;
    
    const totalFinishedProducts = finishedProducts.length;
    const totalProductValue = finishedProducts.reduce((sum, p) => sum + ((p.sellingPrice || 0) * (p.quantity || 0)), 0);
    const lowStockProducts = finishedProducts.filter(p => (p.quantity || 0) > 0 && (p.quantity || 0) <= 10).length;
    const outOfStockProducts = finishedProducts.filter(p => (p.quantity || 0) === 0).length;
    
    const allLocations = [...rawMaterials.map(m => m.location), ...finishedProducts.map(p => p.location)].filter(Boolean);
    const totalLocations = [...new Set(allLocations)].length;

    setStats({
      totalRawMaterials,
      totalRawValue,
      lowStockMaterials,
      outOfStockMaterials,
      totalFinishedProducts,
      totalProductValue,
      lowStockProducts,
      outOfStockProducts,
      totalLocations,
    });
  }, [rawMaterials, finishedProducts]);

  // Reset raw material filters
  const resetMaterialFilters = () => {
    setMaterialSearch("");
    setMaterialCategory("all");
    setMaterialStockFilter("all");
  };

  // Reset finished product filters
  const resetProductFilters = () => {
    setProductSearch("");
    setProductCategory("all");
    setProductStockFilter("all");
  };

  // Get stock status
  const getStockStatus = (quantity, reorderLevel = 5, isProduct = false) => {
    const threshold = isProduct ? 10 : (reorderLevel || 5);
    if (quantity === 0) return { label: "Out of Stock", color: "text-red-500", bg: "bg-red-500/10", icon: IconX };
    if (quantity <= threshold) return { label: "Low Stock", color: "text-yellow-500", bg: "bg-yellow-500/10", icon: IconClock };
    return { label: "In Stock", color: "text-green-500", bg: "bg-green-500/10", icon: IconCheck };
  };

  // Pagination helper
  const paginateData = (data, currentPage, itemsPerPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  // Get current page data
  const currentMaterials = paginateData(filteredMaterials, materialCurrentPage, materialItemsPerPage);
  const currentProducts = paginateData(filteredProducts, productCurrentPage, productItemsPerPage);
  
  // Calculate total pages
  const materialTotalPages = Math.ceil(filteredMaterials.length / materialItemsPerPage);
  const productTotalPages = Math.ceil(filteredProducts.length / productItemsPerPage);

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
              <p className="mt-2 text-muted-foreground">Loading inventory...</p>
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
                  Try Again
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
                <CardTitle>Sign In Required</CardTitle>
                <CardDescription>Please log in to view logistics and flow.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Calculate stock health distribution
  const materialStockHealth = {
    inStock: filteredMaterials.filter(m => (m.quantity || 0) > (m.reorderLevel || 5)).length,
    lowStock: filteredMaterials.filter(m => (m.quantity || 0) > 0 && (m.quantity || 0) <= (m.reorderLevel || 5)).length,
    outOfStock: filteredMaterials.filter(m => (m.quantity || 0) === 0).length,
  };

  const productStockHealth = {
    inStock: filteredProducts.filter(p => (p.quantity || 0) > 10).length,
    lowStock: filteredProducts.filter(p => (p.quantity || 0) > 0 && (p.quantity || 0) <= 10).length,
    outOfStock: filteredProducts.filter(p => (p.quantity || 0) === 0).length,
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader className="relative overflow-hidden bg-zinc-950" />
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
            
            <div className="absolute top-[30%] -right-[10%] h-[400px] w-[400px] rounded-full bg-indigo-500/15 blur-[120px] animate-pulse delay-1000" />
            <div className="absolute bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-fuchsia-600/10 blur-[100px] animate-pulse delay-2000" />
          </div>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                <IconTruck className="h-8 w-8 text-primary" />
                Logistics & Flow
              </h2>
              <p className="text-muted-foreground">
                Track raw material batches and finished goods inventory with locations
              </p>
            </div>
          </div>

          {/* Enhanced Summary Header */}
          <div className="rounded-lg border border-border/50 overflow-hidden bg-background/40 backdrop-blur-sm">
            <div className="p-4 border-b border-border/50 bg-background/30">
              {/* Main Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                {/* Raw Materials */}
                <div className="flex flex-col p-2 bg-background/20 rounded-lg">
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <IconPackage className="h-3.5 w-3.5" />
                    <p className="text-xs font-medium uppercase tracking-wider">Raw Materials</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold">{formatNumber(stats.totalRawMaterials)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Value: {formatCurrency(stats.totalRawValue)}
                  </p>
                </div>

                {/* Finished Products */}
                <div className="flex flex-col p-2 bg-background/20 rounded-lg">
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <IconBox className="h-3.5 w-3.5" />
                    <p className="text-xs font-medium uppercase tracking-wider">Finished Goods</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold">{formatNumber(stats.totalFinishedProducts)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Value: {formatCurrency(stats.totalProductValue)}
                  </p>
                </div>

                {/* Total Inventory Value */}
                <div className="flex flex-col p-2 bg-background/20 rounded-lg">
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <IconCurrencyDollar className="h-3.5 w-3.5" />
                    <p className="text-xs font-medium uppercase tracking-wider">Total Value</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.totalRawValue + stats.totalProductValue)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Raw + Finished goods
                  </p>
                </div>

                {/* Storage Locations */}
                <div className="flex flex-col p-2 bg-background/20 rounded-lg">
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <IconBuildingWarehouse className="h-3.5 w-3.5" />
                    <p className="text-xs font-medium uppercase tracking-wider">Locations</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold">{formatNumber(stats.totalLocations)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active storage locations
                  </p>
                </div>

                {/* Total Items */}
                <div className="flex flex-col p-2 bg-background/20 rounded-lg">
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <IconChartBar className="h-3.5 w-3.5" />
                    <p className="text-xs font-medium uppercase tracking-wider">Total Items</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold">{formatNumber(stats.totalRawMaterials + stats.totalFinishedProducts)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Batches tracked
                  </p>
                </div>
              </div>

              {/* Stock Health Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border/30">
                {/* Raw Materials Stock Health */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <IconChartPie className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Raw Materials Stock Health</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-green-500/10 text-green-600 text-xs px-2 py-1 gap-1">
                      <IconCheck className="h-3 w-3" />
                      In Stock: {materialStockHealth.inStock}
                    </Badge>
                    <Badge className="bg-yellow-500/10 text-yellow-600 text-xs px-2 py-1 gap-1">
                      <IconClock className="h-3 w-3" />
                      Low Stock: {materialStockHealth.lowStock}
                    </Badge>
                    <Badge className="bg-red-500/10 text-red-600 text-xs px-2 py-1 gap-1">
                      <IconX className="h-3 w-3" />
                      Out of Stock: {materialStockHealth.outOfStock}
                    </Badge>
                  </div>
                </div>

                {/* Finished Products Stock Health */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <IconChartPie className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Finished Goods Stock Health</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-green-500/10 text-green-600 text-xs px-2 py-1 gap-1">
                      <IconCheck className="h-3 w-3" />
                      In Stock: {productStockHealth.inStock}
                    </Badge>
                    <Badge className="bg-yellow-500/10 text-yellow-600 text-xs px-2 py-1 gap-1">
                      <IconClock className="h-3 w-3" />
                      Low Stock: {productStockHealth.lowStock}
                    </Badge>
                    <Badge className="bg-red-500/10 text-red-600 text-xs px-2 py-1 gap-1">
                      <IconX className="h-3 w-3" />
                      Out of Stock: {productStockHealth.outOfStock}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Flow Visualization Mini */}
              <div className="mt-3 pt-2 border-t border-border/30">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Production Pipeline</span>
                  <span>{stats.totalRawMaterials} raw → {stats.totalFinishedProducts} finished</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                    style={{ width: `${stats.totalFinishedProducts / (stats.totalRawMaterials + stats.totalFinishedProducts || 1) * 100}%` }}
                  />
                </div>
              </div>

              {/* Last updated timestamp */}
              <div className="flex justify-end mt-2 pt-1 border-t border-border/30">
                <div className="text-xs text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-border">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab("raw-materials")}
                className={cn(
                  "pb-3 px-1 text-sm font-medium transition-all duration-200 relative",
                  activeTab === "raw-materials"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <IconPackage className="h-4 w-4" />
                  Raw Materials Inventory
                  <Badge variant="secondary" className="ml-1 text-xs px-1">
                    {filteredMaterials.length}
                  </Badge>
                </div>
                {activeTab === "raw-materials" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("finished-products")}
                className={cn(
                  "pb-3 px-1 text-sm font-medium transition-all duration-200 relative",
                  activeTab === "finished-products"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <IconBox className="h-4 w-4" />
                  Finished Goods Inventory
                  <Badge variant="secondary" className="ml-1 text-xs px-1">
                    {filteredProducts.length}
                  </Badge>
                </div>
                {activeTab === "finished-products" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            </div>
          </div>

          {/* Raw Materials Tab Content */}
          {activeTab === "raw-materials" && (
            <div className="space-y-3 animate-in fade-in-50 duration-200">
              {/* Raw Materials Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, batch, supplier..."
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    className="pl-9 h-10 w-full bg-background/80 backdrop-blur-sm"
                  />
                </div>
                <Select value={materialCategory} onValueChange={setMaterialCategory}>
                  <SelectTrigger className="w-[130px] h-10 bg-background/80 backdrop-blur-sm">
                    <IconFilter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={materialStockFilter} onValueChange={setMaterialStockFilter}>
                  <SelectTrigger className="w-[130px] h-10 bg-background/80 backdrop-blur-sm">
                    <IconPackage className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Stock Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetMaterialFilters}
                  className="h-10 px-3 bg-background/80 backdrop-blur-sm"
                >
                  <IconRefresh className="h-4 w-4" />
                </Button>
              </div>

              {/* Raw Materials Table */}
              <Card className="bg-background/80 backdrop-blur-sm border-border/50">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-background/60 border-b">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-xs">Batch Number</th>
                          <th className="text-left py-3 px-4 font-medium text-xs">Material Name</th>
                          <th className="text-left py-3 px-4 font-medium text-xs">Category</th>
                          <th className="text-left py-3 px-4 font-medium text-xs">Location</th>
                          <th className="text-right py-3 px-4 font-medium text-xs">Quantity</th>
                          <th className="text-right py-3 px-4 font-medium text-xs">Unit</th>
                          <th className="text-right py-3 px-4 font-medium text-xs">Status</th>
                         </tr>
                      </thead>
                      <tbody>
                        {currentMaterials.length > 0 ? (
                          currentMaterials.map((material) => {
                            const stockStatus = getStockStatus(material.quantity, material.reorderLevel, false);
                            const StatusIcon = stockStatus.icon;
                            return (
                              <tr key={material.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                <td className="py-3 px-4 font-mono text-xs">
                                  <div className="flex items-center gap-2">
                                    <IconBarcode className="h-3 w-3 text-muted-foreground" />
                                    {material.batchNumber || "N/A"}
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-medium">{material.name}</td>
                                <td className="py-3 px-4 text-xs text-muted-foreground">{material.category || "Uncategorized"}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1">
                                    <IconLocation className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs">{material.location || "Not specified"}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right font-medium">{material.quantity || 0}</td>
                                <td className="py-3 px-4 text-right text-xs text-muted-foreground">{material.unit || "pcs"}</td>
                                <td className="py-3 px-4 text-right">
                                  <Badge className={cn("text-xs gap-1", stockStatus.bg, stockStatus.color)}>
                                    <StatusIcon className="h-3 w-3" />
                                    {stockStatus.label}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                              No raw materials found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination for Raw Materials */}
                  {filteredMaterials.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
                      <div className="text-xs text-muted-foreground">
                        Showing {((materialCurrentPage - 1) * materialItemsPerPage) + 1} to {Math.min(materialCurrentPage * materialItemsPerPage, filteredMaterials.length)} of {filteredMaterials.length} materials
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMaterialCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={materialCurrentPage === 1}
                          className="h-8 w-8 p-0"
                        >
                          <IconChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, materialTotalPages) }, (_, i) => {
                            let pageNum;
                            if (materialTotalPages <= 5) {
                              pageNum = i + 1;
                            } else if (materialCurrentPage <= 3) {
                              pageNum = i + 1;
                            } else if (materialCurrentPage >= materialTotalPages - 2) {
                              pageNum = materialTotalPages - 4 + i;
                            } else {
                              pageNum = materialCurrentPage - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={materialCurrentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setMaterialCurrentPage(pageNum)}
                                className="h-8 w-8 p-0 text-xs"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMaterialCurrentPage(prev => Math.min(prev + 1, materialTotalPages))}
                          disabled={materialCurrentPage === materialTotalPages}
                          className="h-8 w-8 p-0"
                        >
                          <IconChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Finished Products Tab Content */}
          {activeTab === "finished-products" && (
            <div className="space-y-3 animate-in fade-in-50 duration-200">
              {/* Finished Products Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, batch..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9 h-10 w-full bg-background/80 backdrop-blur-sm"
                  />
                </div>
                <Select value={productCategory} onValueChange={setProductCategory}>
                  <SelectTrigger className="w-[130px] h-10 bg-background/80 backdrop-blur-sm">
                    <IconFilter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={productStockFilter} onValueChange={setProductStockFilter}>
                  <SelectTrigger className="w-[130px] h-10 bg-background/80 backdrop-blur-sm">
                    <IconBox className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Stock Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetProductFilters}
                  className="h-10 px-3 bg-background/80 backdrop-blur-sm"
                >
                  <IconRefresh className="h-4 w-4" />
                </Button>
              </div>

              {/* Finished Products Table */}
              <Card className="bg-background/80 backdrop-blur-sm border-border/50">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-background/60 border-b">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-xs">Batch Number</th>
                          <th className="text-left py-3 px-4 font-medium text-xs">Product Name</th>
                          <th className="text-left py-3 px-4 font-medium text-xs">Category</th>
                          <th className="text-left py-3 px-4 font-medium text-xs">Location</th>
                          <th className="text-right py-3 px-4 font-medium text-xs">Quantity</th>
                          <th className="text-right py-3 px-4 font-medium text-xs">Unit</th>
                          <th className="text-right py-3 px-4 font-medium text-xs">Status</th>
                          <th className="text-right py-3 px-4 font-medium text-xs">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentProducts.length > 0 ? (
                          currentProducts.map((product) => {
                            const stockStatus = getStockStatus(product.quantity, 10, true);
                            const StatusIcon = stockStatus.icon;
                            const totalValue = (product.sellingPrice || 0) * (product.quantity || 0);
                            return (
                              <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                <td className="py-3 px-4 font-mono text-xs">
                                  <div className="flex items-center gap-2">
                                    <IconBarcode className="h-3 w-3 text-muted-foreground" />
                                    {product.batchNumber || "N/A"}
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-medium">{product.name}</td>
                                <td className="py-3 px-4 text-xs text-muted-foreground">{product.category || "Uncategorized"}</td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1">
                                    <IconLocation className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs">{product.location || "Not specified"}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right font-medium">{product.quantity || 0}</td>
                                <td className="py-3 px-4 text-right text-xs text-muted-foreground">{product.unit || "pcs"}</td>
                                <td className="py-3 px-4 text-right">
                                  <Badge className={cn("text-xs gap-1", stockStatus.bg, stockStatus.color)}>
                                    <StatusIcon className="h-3 w-3" />
                                    {stockStatus.label}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-right text-xs font-medium">
                                  ${totalValue.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                              No finished products found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination for Finished Products */}
                  {filteredProducts.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
                      <div className="text-xs text-muted-foreground">
                        Showing {((productCurrentPage - 1) * productItemsPerPage) + 1} to {Math.min(productCurrentPage * productItemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProductCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={productCurrentPage === 1}
                          className="h-8 w-8 p-0"
                        >
                          <IconChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, productTotalPages) }, (_, i) => {
                            let pageNum;
                            if (productTotalPages <= 5) {
                              pageNum = i + 1;
                            } else if (productCurrentPage <= 3) {
                              pageNum = i + 1;
                            } else if (productCurrentPage >= productTotalPages - 2) {
                              pageNum = productTotalPages - 4 + i;
                            } else {
                              pageNum = productCurrentPage - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={productCurrentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setProductCurrentPage(pageNum)}
                                className="h-8 w-8 p-0 text-xs"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProductCurrentPage(prev => Math.min(prev + 1, productTotalPages))}
                          disabled={productCurrentPage === productTotalPages}
                          className="h-8 w-8 p-0"
                        >
                          <IconChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}