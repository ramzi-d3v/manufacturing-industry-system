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
  IconCheckbox,
  IconAlertCircle,
  IconBox,
  IconCalendar,
  IconChartBar,
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
} from "firebase/firestore";
import { FinishedProductTable } from "@/components/finished-product-table";
import { FinishedProductPopup } from "@/components/finished-product-popup";

// Product categories
const productCategories = [
  { id: "electronics", name: "Electronics" },
  { id: "furniture", name: "Furniture" },
  { id: "clothing", name: "Clothing" },
  { id: "food", name: "Food & Beverage" },
  { id: "cosmetics", name: "Cosmetics" },
  { id: "tools", name: "Tools & Hardware" },
  { id: "medical", name: "Medical Supplies" },
  { id: "automotive", name: "Automotive" },
  { id: "other", name: "Other" },
];

// Quality status options
const qualityStatusOptions = [
  { value: "all", label: "All Quality" },
  { value: "Passed", label: "Passed QC" },
  { value: "Pending", label: "Pending QC" },
  { value: "Failed", label: "Failed QC" },
  { value: "Rework", label: "Needs Rework" },
];

// Sort options
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "price-asc", label: "Price (Low to High)" },
  { value: "price-desc", label: "Price (High to Low)" },
  { value: "stock-asc", label: "Stock (Low to High)" },
  { value: "stock-desc", label: "Stock (High to Low)" },
];

export default function FinishedProductPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    inStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalUnits: 0,
    passedQC: 0,
    failedQC: 0,
    pendingQC: 0,
    topCategory: "",
    averagePrice: 0,
  });

  // Firestore real-time listener for user's finished products subcollection
  useEffect(() => {
    if (!user) {
      setLoadingData(false);
      setProducts([]);
      return;
    }

    setLoadingData(true);
    
    const userProductsRef = collection(db, "finishedProducts", user.uid, "products");
    const q = query(userProductsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setProducts(productsData);
        setLoadingData(false);
        setError(null);
      },
      (err) => {
        console.error("Firestore error:", err);
        setError("Failed to load products. Please try again.");
        setLoadingData(false);
        toast.error("Error loading products");
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.warehouseName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    // Apply quality filter - using qualityGrade or testingStatus
    if (qualityFilter !== "all") {
      filtered = filtered.filter((p) => {
        if (qualityFilter === "Passed") {
          return p.testingStatus === "passed" || p.qualityGrade === "premium" || p.qualityGrade === "flagship";
        } else if (qualityFilter === "Failed") {
          return p.testingStatus === "failed";
        } else if (qualityFilter === "Pending") {
          return p.testingStatus === "not_tested" || p.testingStatus === "in_progress";
        } else if (qualityFilter === "Rework") {
          return p.testingStatus === "rework";
        }
        return true;
      });
    }

    // Apply sorting
    if (sortBy === "newest") {
      filtered.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateA - dateB;
      });
    } else if (sortBy === "name-asc") {
      filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "name-desc") {
      filtered.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    } else if (sortBy === "price-asc") {
      filtered.sort((a, b) => (a.sellingPrice || 0) - (b.sellingPrice || 0));
    } else if (sortBy === "price-desc") {
      filtered.sort((a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0));
    } else if (sortBy === "stock-asc") {
      filtered.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
    } else if (sortBy === "stock-desc") {
      filtered.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
    }

    setFilteredProducts(filtered);

    // Calculate stats
    const totalValue = filtered.reduce((sum, p) => sum + ((p.sellingPrice || 0) * (p.quantity || 0)), 0);
    const inStockCount = filtered.filter(p => (p.quantity || 0) > 100).length;
    const lowStockCount = filtered.filter(p => (p.quantity || 0) <= 100 && (p.quantity || 0) > 0).length;
    const outOfStockCount = filtered.filter(p => (p.quantity || 0) === 0).length;
    const totalUnits = filtered.reduce((sum, p) => sum + (p.quantity || 0), 0);
    
    // Quality stats based on testingStatus and qualityGrade
    const passedQC = filtered.filter(p => 
      p.testingStatus === "passed" || 
      p.qualityGrade === "premium" || 
      p.qualityGrade === "flagship"
    ).length;
    const failedQC = filtered.filter(p => p.testingStatus === "failed").length;
    const pendingQC = filtered.filter(p => 
      p.testingStatus === "not_tested" || 
      p.testingStatus === "in_progress" ||
      !p.testingStatus
    ).length;
    
    const averagePrice = filtered.length > 0 
      ? filtered.reduce((sum, p) => sum + (p.sellingPrice || 0), 0) / filtered.length 
      : 0;

    // Find top category
    const categoryCount = {};
    filtered.forEach(p => {
      if (p.category) {
        categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
      }
    });
    let topCategory = "";
    let maxCount = 0;
    Object.entries(categoryCount).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCategory = cat;
      }
    });

    setStats({
      totalProducts: filtered.length,
      totalValue,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      totalUnits,
      passedQC,
      failedQC,
      pendingQC,
      topCategory: topCategory || "None",
      averagePrice,
    });
  }, [products, searchQuery, categoryFilter, qualityFilter, sortBy]);

  // Export CSV function
  const handleExportCSV = () => {
    if (filteredProducts.length === 0) {
      toast.error("No products to export");
      return;
    }

    const headers = [
      "Product Name",
      "Batch Number",
      "Category",
      "Quantity",
      "Unit",
      "Cost Price",
      "Selling Price",
      "Total Value",
      "Supplier",
      "Warehouse",
      "Quality Status",
      "Testing Status",
      "Manufacturing Date",
      "Expiry Date",
      "Description"
    ];

    const csvData = filteredProducts.map((product) => [
      product.name || "",
      product.batchNumber || "",
      product.category || "",
      product.quantity || 0,
      product.unit || "pcs",
      product.costPrice || 0,
      product.sellingPrice || 0,
      ((product.sellingPrice || 0) * (product.quantity || 0)).toFixed(2),
      product.supplierName || "",
      product.warehouseName || "",
      product.qualityGrade || product.testingStatus || "Pending",
      product.testingStatus || "Not Tested",
      product.manufacturingDate ? new Date(product.manufacturingDate).toLocaleDateString() : "",
      product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : "",
      product.description || ""
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `finished-products-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${filteredProducts.length} products successfully!`);
  };

  // Add new product
  const handleProductAdded = async (productData) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    try {
      const userProductsRef = collection(db, "finishedProducts", user.uid, "products");
      await addDoc(userProductsRef, {
        ...productData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      toast.success("Product added successfully!");
    } catch (err) {
      console.error("Error adding product:", err);
      toast.error("Failed to add product: " + err.message);
    }
  };

  // Update product
  const handleUpdateProduct = async (updatedProduct) => {
    if (!user || !updatedProduct.id) return;

    try {
      const productRef = doc(db, "finishedProducts", user.uid, "products", updatedProduct.id);
      const { id, ...updateData } = updatedProduct;
      await updateDoc(productRef, {
        ...updateData,
        updatedAt: Timestamp.now(),
      });
      toast.success("Product updated successfully!");
    } catch (err) {
      console.error("Error updating product:", err);
      toast.error("Failed to update product: " + err.message);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id) => {
    if (!user || !id) return;
    try {
      const productRef = doc(db, "finishedProducts", user.uid, "products", id);
      await deleteDoc(productRef);
      toast.success("Product deleted successfully!");
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("Failed to delete product: " + err.message);
    }
  };

  // Open popup for editing
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsPopupOpen(true);
  };

  // Open popup for adding new product
  const handleAddClick = () => {
    setEditingProduct(null);
    setIsPopupOpen(true);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setQualityFilter("all");
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
              <p className="mt-2 text-muted-foreground">Loading products...</p>
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
                <CardDescription>Please log in to view finished products.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <>
      
     
      
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader className="relative overflow-hidden bg-zinc-950" />
            <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
            
            <div className="absolute top-[30%] -right-[10%] h-[400px] w-[400px] rounded-full bg-indigo-500/15 blur-[120px] animate-pulse delay-1000" />
            <div className="absolute bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-fuchsia-600/10 blur-[100px] animate-pulse delay-2000" />
          </div>
          
          <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-100">Finished Products</h2>
                <p className="text-muted-foreground">
                  Manage your finished goods inventory, track quality, and monitor stock levels
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleExportCSV} variant="outline" className="cursor-pointer">
                  <IconDownload className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button onClick={handleAddClick} variant="outline" className="cursor-pointer">
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Total Products Card */}
              <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Total Products
                    </CardTitle>
                    <IconPackage className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold mt-2">{stats.totalProducts}</div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-1.5 py-0 text-[10px]">
                        {stats.inStockCount} In Stock
                      </Badge>
                      <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-1.5 py-0 text-[10px]">
                        {stats.lowStockCount} Low Stock
                      </Badge>
                      <Badge className="bg-red-500/10 text-red-600 border-red-500/20 px-1.5 py-0 text-[10px]">
                        {stats.outOfStockCount} Out of Stock
                      </Badge>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {stats.totalUnits} total units in inventory
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
                  <div className="text-2xl font-bold mt-2 text-primary">
                    ${stats.totalValue.toLocaleString()}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      {stats.totalValue > 5000000 ? (
                        <IconTrendingUp className="h-3 w-3 text-green-500" />
                      ) : stats.totalValue > 0 ? (
                        <IconTrendingUp className="h-3 w-3 text-yellow-500" />
                      ) : (
                        <IconTrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className="text-muted-foreground">
                        {stats.totalValue > 5000000 ? 'High Value' : stats.totalValue > 0 ? 'Moderate' : 'No Value'}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      <span>Avg: ${stats.averagePrice.toFixed(0)}/unit</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Total inventory value
                  </p>
                </CardContent>
              </Card>

              {/* Quality Status Card */}
              <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Quality Status
                    </CardTitle>
                    <IconCheckbox className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold mt-2">{stats.passedQC}</div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-1.5 py-0 text-[10px]">
                        {stats.passedQC} Passed
                      </Badge>
                      <Badge className="bg-red-500/10 text-red-600 border-red-500/20 px-1.5 py-0 text-[10px]">
                        {stats.failedQC} Failed
                      </Badge>
                      <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-1.5 py-0 text-[10px]">
                        {stats.pendingQC} Pending
                      </Badge>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {Math.round((stats.passedQC / (stats.totalProducts || 1)) * 100)}% pass rate
                  </p>
                </CardContent>
              </Card>

              {/* Top Category Card */}
              <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Top Category
                    </CardTitle>
                    <IconChartBar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-xl font-bold mt-2 truncate">{stats.topCategory}</div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <IconPackage className="h-3 w-3" />
                      <span className="text-muted-foreground">Most produced</span>
                    </div>
                    <div className="text-muted-foreground">
                      {stats.totalProducts > 0 && (
                        <span>{Math.round((stats.passedQC / (stats.totalProducts || 1)) * 100)}% of inventory</span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Leading product category
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Search, Filters, and Sort Section */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <IconSearch className="absolute left-3 z-10 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, batch, supplier, warehouse..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 w-full bg-background/80 backdrop-blur-sm"
                  />
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[140px] h-10 cursor-pointer bg-background/80 backdrop-blur-sm">
                      <IconFilter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="cursor-pointer">All Categories</SelectItem>
                      {productCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name} className="cursor-pointer">
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={qualityFilter} onValueChange={setQualityFilter}>
                    <SelectTrigger className="w-[130px] h-10 cursor-pointer bg-background/80 backdrop-blur-sm">
                      <IconAlertCircle className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Quality" />
                    </SelectTrigger>
                    <SelectContent>
                      {qualityStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[150px] h-10 cursor-pointer bg-background/80 backdrop-blur-sm">
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
              {(searchQuery || categoryFilter !== "all" || qualityFilter !== "all") && (
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm">
                      <IconSearch className="h-3 w-3" />
                      Search: {searchQuery}
                      <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-destructive">
                        <IconX className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {categoryFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm">
                      <IconFilter className="h-3 w-3" />
                      Category: {categoryFilter}
                      <button onClick={() => setCategoryFilter("all")} className="ml-1 hover:text-destructive">
                        <IconX className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {qualityFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm">
                      <IconAlertCircle className="h-3 w-3" />
                      Quality: {qualityFilter}
                      <button onClick={() => setQualityFilter("all")} className="ml-1 hover:text-destructive">
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
                <h2 className="text-lg font-medium">Products Inventory</h2>
                <Badge variant="outline" className="px-2 py-0 h-6 bg-background/80 backdrop-blur-sm">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
                </Badge>
              </div>
            </div>

            {/* Main Content */}
            <Card className="bg-background/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle>Finished Products Inventory</CardTitle>
                <CardDescription>
                  Manage your finished goods, track quality control, and monitor stock levels.
                  Click on any product to see detailed information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FinishedProductTable
                  data={filteredProducts}
                  onUpdate={handleUpdateProduct}
                  onDelete={handleDeleteProduct}
                  onEdit={handleEditProduct}
                  categories={productCategories}
                />
              </CardContent>
            </Card>
          </div>

          {/* Product Popup */}
          <FinishedProductPopup
            open={isPopupOpen}
            onOpenChange={setIsPopupOpen}
            onProductAdded={handleProductAdded}
            product={editingProduct}
            categories={productCategories}
          />
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}