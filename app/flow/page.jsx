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

export default function LogisticsFlowPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("raw-materials");
  
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

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader className="relative overflow-hidden bg-zinc-950" />
        
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

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Raw Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRawMaterials}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-yellow-500/10 text-yellow-600 text-[10px]">
                    {stats.lowStockMaterials} Low Stock
                  </Badge>
                  <Badge className="bg-red-500/10 text-red-600 text-[10px]">
                    {stats.outOfStockMaterials} Out of Stock
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Total Value: ${stats.totalRawValue.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Finished Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalFinishedProducts}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-yellow-500/10 text-yellow-600 text-[10px]">
                    {stats.lowStockProducts} Low Stock
                  </Badge>
                  <Badge className="bg-red-500/10 text-red-600 text-[10px]">
                    {stats.outOfStockProducts} Out of Stock
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Total Value: ${stats.totalProductValue.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Storage Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLocations}</div>
                <div className="flex items-center gap-2 mt-1">
                  <IconLocation className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">Active locations</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Across warehouse and storage
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Inventory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRawMaterials + stats.totalFinishedProducts}</div>
                <div className="flex items-center gap-2 mt-1">
                  <IconBox className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">Items tracked</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Raw + Finished goods
                </p>
              </CardContent>
            </Card>
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
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1">
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
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1">
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
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
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
                        {filteredMaterials.length > 0 ? (
                          filteredMaterials.map((material) => {
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
                                  <Badge className={cn("text-[10px] gap-1", stockStatus.bg, stockStatus.color)}>
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
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
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
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((product) => {
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
                                  <Badge className={cn("text-[10px] gap-1", stockStatus.bg, stockStatus.color)}>
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
                </CardContent>
              </Card>
            </div>
          )}

          {/* Flow Visualization */}
          <Card className="bg-background/80 backdrop-blur-sm border-border/50 mt-6">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Material Flow</CardTitle>
              <CardDescription className="text-[10px]">
                Visual representation of inventory movement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <IconPackage className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <p className="text-xs font-medium">Raw Materials</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.totalRawMaterials}</p>
                  <p className="text-[10px] text-muted-foreground">Batches in stock</p>
                </div>
                <div className="flex items-center justify-center">
                  <IconArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <IconBox className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="text-xs font-medium">Finished Goods</p>
                  <p className="text-2xl font-bold text-green-500">{stats.totalFinishedProducts}</p>
                  <p className="text-[10px] text-muted-foreground">Products ready for sale</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Production Pipeline</span>
                  <span className="text-muted-foreground">
                    {stats.totalRawMaterials} raw → {stats.totalFinishedProducts} finished
                  </span>
                </div>
                <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                    style={{ width: `${stats.totalFinishedProducts / (stats.totalRawMaterials + stats.totalFinishedProducts || 1) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}