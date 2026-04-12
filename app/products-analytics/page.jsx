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
  IconCurrencyDollar,
  IconRefresh,
  IconLoader,
  IconSearch,
  IconX,
  IconSortAscending,
  IconTrendingUp,
  IconTrendingDown,
  IconChartBar,
  IconDownload,
  IconCategory,
  IconArrowUp,
  IconArrowDown,
  IconMinus,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { format } from "date-fns";
import { ProductAnalyticsTable } from "@/components/product-analytics-table";

// Product categories
const productCategories = [
  { id: "all", name: "All Categories" },
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

// Quality grades
const qualityGrades = [
  { id: "all", name: "All Grades" },
  { id: "premium", name: "Premium" },
  { id: "flagship", name: "Flagship" },
  { id: "standard", name: "Standard" },
  { id: "economy", name: "Economy" },
];

// Sort options
const sortOptions = [
  { value: "name-asc", label: "Name (A to Z)" },
  { value: "name-desc", label: "Name (Z to A)" },
  { value: "profit-asc", label: "Profit (Low to High)" },
  { value: "profit-desc", label: "Profit (High to Low)" },
  { value: "price-asc", label: "Price (Low to High)" },
  { value: "price-desc", label: "Price (High to Low)" },
  { value: "margin-asc", label: "Margin (Low to High)" },
  { value: "margin-desc", label: "Margin (High to Low)" },
];

// Helper function to get trend for stats
const getTrend = (current, previous) => {
  if (current > previous) return { icon: IconArrowUp, color: "text-green-500", label: "Up" };
  if (current < previous) return { icon: IconArrowDown, color: "text-red-500", label: "Down" };
  return { icon: IconMinus, color: "text-gray-500", label: "Stable" };
};

export default function ProductAnalyticsPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [products, setProducts] = useState([]);
  const [previousProducts, setPreviousProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("profit-desc");
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    totalCost: 0,
    totalProfit: 0,
    averageMargin: 0,
    topCategory: "",
    topProduct: "",
    highMarginCount: 0,
    lowMarginCount: 0,
  });

  const [previousStats, setPreviousStats] = useState({
    totalProducts: 0,
    totalProfit: 0,
    totalValue: 0,
    averageMargin: 0,
  });

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
        const productsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          const profitPerUnit = (data.sellingPrice || 0) - (data.costPrice || 0);
          const totalProfit = profitPerUnit * (data.quantity || 0);
          const margin = data.sellingPrice > 0 ? (profitPerUnit / data.sellingPrice) * 100 : 0;
          
          return {
            id: doc.id,
            ...data,
            profitPerUnit,
            totalProfit,
            margin,
          };
        });
        
        setProducts(productsData);
        
        // Store previous data for trend comparison (last month's data)
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const previousData = productsData.filter(p => {
          const createdAt = p.createdAt?.toDate?.() || new Date(p.createdAt);
          return createdAt < oneMonthAgo;
        });
        setPreviousProducts(previousData);
        
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

  useEffect(() => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    if (gradeFilter !== "all") {
      filtered = filtered.filter((p) => p.qualityGrade?.toLowerCase() === gradeFilter.toLowerCase());
    }

    if (sortBy === "name-asc") {
      filtered.sort((a, b) => a.name?.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      filtered.sort((a, b) => b.name?.localeCompare(a.name));
    } else if (sortBy === "profit-asc") {
      filtered.sort((a, b) => (a.totalProfit || 0) - (b.totalProfit || 0));
    } else if (sortBy === "profit-desc") {
      filtered.sort((a, b) => (b.totalProfit || 0) - (a.totalProfit || 0));
    } else if (sortBy === "price-asc") {
      filtered.sort((a, b) => (a.sellingPrice || 0) - (b.sellingPrice || 0));
    } else if (sortBy === "price-desc") {
      filtered.sort((a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0));
    } else if (sortBy === "margin-asc") {
      filtered.sort((a, b) => (a.margin || 0) - (b.margin || 0));
    } else if (sortBy === "margin-desc") {
      filtered.sort((a, b) => (b.margin || 0) - (a.margin || 0));
    }

    setFilteredProducts(filtered);

    const totalValue = filtered.reduce((sum, p) => sum + ((p.sellingPrice || 0) * (p.quantity || 0)), 0);
    const totalCost = filtered.reduce((sum, p) => sum + ((p.costPrice || 0) * (p.quantity || 0)), 0);
    const totalProfit = filtered.reduce((sum, p) => sum + (p.totalProfit || 0), 0);
    const averageMargin = totalValue > 0 ? (totalProfit / totalValue) * 100 : 0;
    
    const categoryProfit = {};
    filtered.forEach(p => {
      if (p.category) {
        categoryProfit[p.category] = (categoryProfit[p.category] || 0) + (p.totalProfit || 0);
      }
    });
    let topCategory = "";
    let maxProfit = 0;
    Object.entries(categoryProfit).forEach(([cat, profit]) => {
      if (profit > maxProfit) {
        maxProfit = profit;
        topCategory = cat;
      }
    });
    
    let topProduct = "";
    let topProductProfit = 0;
    filtered.forEach(p => {
      if ((p.totalProfit || 0) > topProductProfit) {
        topProductProfit = p.totalProfit || 0;
        topProduct = p.name;
      }
    });
    
    const highMarginCount = filtered.filter(p => p.margin > 30).length;
    const lowMarginCount = filtered.filter(p => p.margin < 10 && p.margin > 0).length;

    setStats({
      totalProducts: filtered.length,
      totalValue,
      totalCost,
      totalProfit,
      averageMargin,
      topCategory: topCategory || "None",
      topProduct: topProduct || "None",
      highMarginCount,
      lowMarginCount,
    });
    
    // Calculate previous stats for trends
    let previousFiltered = [...previousProducts];
    if (categoryFilter !== "all") {
      previousFiltered = previousFiltered.filter((p) => p.category === categoryFilter);
    }
    if (gradeFilter !== "all") {
      previousFiltered = previousFiltered.filter((p) => p.qualityGrade?.toLowerCase() === gradeFilter.toLowerCase());
    }
    
    const previousTotalValue = previousFiltered.reduce((sum, p) => sum + ((p.sellingPrice || 0) * (p.quantity || 0)), 0);
    const previousTotalProfit = previousFiltered.reduce((sum, p) => sum + (p.totalProfit || 0), 0);
    const previousAverageMargin = previousTotalValue > 0 ? (previousTotalProfit / previousTotalValue) * 100 : 0;
    
    setPreviousStats({
      totalProducts: previousFiltered.length,
      totalProfit: previousTotalProfit,
      totalValue: previousTotalValue,
      averageMargin: previousAverageMargin,
    });
    
  }, [products, previousProducts, searchQuery, categoryFilter, gradeFilter, sortBy]);

  const handleExportCSV = () => {
    const headers = [
      "Product Name",
      "SKU",
      "Batch Number",
      "Category",
      "Quality Grade",
      "Quantity",
      "Unit",
      "Cost Price ($)",
      "Selling Price ($)",
      "Profit per Unit ($)",
      "Total Profit ($)",
      "Margin (%)",
      "Total Value ($)",
    ];
    
    const csvData = filteredProducts.map((p) => [
      p.name,
      p.sku || "N/A",
      p.batchNumber || "N/A",
      p.category || "N/A",
      p.qualityGrade || "N/A",
      p.quantity || 0,
      p.unit || "pcs",
      p.costPrice?.toFixed(2) || "0.00",
      p.sellingPrice?.toFixed(2) || "0.00",
      p.profitPerUnit?.toFixed(2) || "0.00",
      p.totalProfit?.toFixed(2) || "0.00",
      p.margin?.toFixed(1) || "0.00",
      ((p.sellingPrice || 0) * (p.quantity || 0)).toFixed(2),
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `product-analytics-${format(new Date(), "dd-MM-yyyy")}.csv`;
    a.click();
    toast.success("Report exported successfully!");
  };

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setGradeFilter("all");
    setSortBy("profit-desc");
  };

  // Get trends for each stat
  const productTrend = getTrend(stats.totalProducts, previousStats.totalProducts);
  const profitTrend = getTrend(stats.totalProfit, previousStats.totalProfit);
  const valueTrend = getTrend(stats.totalValue, previousStats.totalValue);
  const marginTrend = getTrend(stats.averageMargin, previousStats.averageMargin);
  
  const ProductTrendIcon = productTrend.icon;
  const ProfitTrendIcon = profitTrend.icon;
  const ValueTrendIcon = valueTrend.icon;
  const MarginTrendIcon = marginTrend.icon;

  if (loadingAuth || loadingData) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex-1 p-8 flex items-center justify-center">
            <div className="text-center">
              <IconLoader className="animate-spin text-slate-700" size={32} />
          
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
                <CardDescription>Please log in to view product analytics.</CardDescription>
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
          <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
            
            <div className="absolute top-[30%] -right-[10%] h-[400px] w-[400px] rounded-full bg-indigo-500/15 blur-[120px] " />
            <div className="absolute bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-fuchsia-600/10 blur-[100px] " />
          </div>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                <IconChartBar className="h-8 w-8 text-primary" />
                Product Analytics
              </h2>
              <p className="text-muted-foreground">
                See how your products are performing - profits, margins, and more
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportCSV} className="cursor-pointer" variant="outline">
                <IconDownload className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            </div>
          </div>

          {/* Stats Cards with Trends */}
          

          {/* Secondary Stats Cards */}
          

          {/* Filters Section */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  placeholder="Search by product name, SKU, or batch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 w-full bg-background/80 backdrop-blur-sm"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px] h-10 cursor-pointer bg-background/80 backdrop-blur-sm">
                    <IconCategory className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="cursor-pointer">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-[130px] h-10 cursor-pointer bg-background/80 backdrop-blur-sm">
                    <IconPackage className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Quality Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {qualityGrades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id} className="cursor-pointer">
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] h-10 cursor-pointer bg-background/80 backdrop-blur-sm">
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
                  title="Clear all filters"
                >
                  <IconRefresh className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Active filters display */}
            {(searchQuery || categoryFilter !== "all" || gradeFilter !== "all") && (
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
                    <IconCategory className="h-3 w-3" />
                    Category: {productCategories.find(c => c.id === categoryFilter)?.name}
                    <button onClick={() => setCategoryFilter("all")} className="ml-1 hover:text-destructive">
                      <IconX className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {gradeFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm">
                    <IconPackage className="h-3 w-3" />
                    Grade: {qualityGrades.find(g => g.id === gradeFilter)?.name}
                    <button onClick={() => setGradeFilter("all")} className="ml-1 hover:text-destructive">
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
              <h2 className="text-lg font-medium">Product List</h2>
              <Badge variant="outline" className="px-2 py-0 h-6 bg-background/80 backdrop-blur-sm">
                {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
              </Badge>
            </div>
          </div>

          {/* Products Table */}
          <ProductAnalyticsTable
            data={filteredProducts}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Helper function for className merging (add at the end)
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}