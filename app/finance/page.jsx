// app/financials/income-expenses/page.jsx
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
  CardFooter,
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
import {
  IconCurrencyDollar,
  IconRefresh,
  IconLoader,
  IconTrendingUp,
  IconTrendingDown,
  IconChartBar,
  IconDownload,
  IconCalendar,
  IconPackage,
  IconBug,
  IconBuildingWarehouse,
  IconTruck,
  IconArrowUpRight,
  IconArrowDownRight,
  IconReceipt,
  IconWallet,
  IconMinus,
  IconChartPie,
  IconPercentage,
  IconArrowUp,
  IconArrowDown,
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
  where,
} from "firebase/firestore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Date range options
const dateRangeOptions = [
  { value: "all", label: "All Time" },
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "this-quarter", label: "This Quarter" },
  { value: "this-year", label: "This Year" },
  { value: "last-year", label: "Last Year" },
];

// Helper function to get trend for metrics
const getTrend = (current, previous) => {
  if (current > previous) return { icon: IconArrowUp, color: "text-green-500", label: "Up", percentage: previous > 0 ? ((current - previous) / previous * 100).toFixed(0) : "100" };
  if (current < previous) return { icon: IconArrowDown, color: "text-red-500", label: "Down", percentage: previous > 0 ? ((previous - current) / previous * 100).toFixed(0) : "0" };
  return { icon: IconMinus, color: "text-gray-500", label: "Stable", percentage: "0" };
};

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

export default function IncomeExpensesPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("this-month");
  
  // Data states
  const [rawMaterials, setRawMaterials] = useState([]);
  const [defectReports, setDefectReports] = useState([]);
  const [finishedProducts, setFinishedProducts] = useState([]);
  
  // Previous period data for trends
  const [previousFinancials, setPreviousFinancials] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    rawMaterialCost: 0,
    defectLoss: 0,
  });
  
  // Financial stats
  const [financials, setFinancials] = useState({
    totalExpenses: 0,
    totalIncome: 0,
    netProfit: 0,
    profitMargin: 0,
    rawMaterialCost: 0,
    defectLoss: 0,
    totalInventoryValue: 0,
    potentialIncome: 0,
    expensesByCategory: [],
    incomeByCategory: [],
  });

  // Helper to check if date is within range
  const isWithinRange = (date, range) => {
    if (!date) return false;
    const itemDate = new Date(date);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    switch (range) {
      case "this-month":
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
      case "last-month":
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return itemDate.getMonth() === lastMonth && itemDate.getFullYear() === lastMonthYear;
      case "this-quarter":
        const currentQuarter = Math.floor(currentMonth / 3);
        return Math.floor(itemDate.getMonth() / 3) === currentQuarter && itemDate.getFullYear() === currentYear;
      case "this-year":
        return itemDate.getFullYear() === currentYear;
      case "last-year":
        return itemDate.getFullYear() === currentYear - 1;
      default:
        return true;
    }
  };

  // Helper to get previous period date range
  const getPreviousPeriodRange = (currentRange) => {
    const now = new Date();
    switch (currentRange) {
      case "this-month":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: lastMonth, end: lastMonthEnd };
      case "this-quarter":
        const currentQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const previousQuarterStart = new Date(currentQuarterStart);
        previousQuarterStart.setMonth(previousQuarterStart.getMonth() - 3);
        const previousQuarterEnd = new Date(currentQuarterStart);
        previousQuarterEnd.setDate(previousQuarterEnd.getDate() - 1);
        return { start: previousQuarterStart, end: previousQuarterEnd };
      case "this-year":
        return { start: new Date(now.getFullYear() - 1, 0, 1), end: new Date(now.getFullYear() - 1, 11, 31) };
      default:
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date(now);
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        return { start: sixtyDaysAgo, end: thirtyDaysAgo };
    }
  };

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
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Fetch defect reports
  useEffect(() => {
    if (!user) return;

    const userDefectsRef = collection(db, "defectReports", user.uid, "reports");
    const q = query(userDefectsRef, orderBy("defectDate", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const defectsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          defectDate: doc.data().defectDate,
        }));
        setDefectReports(defectsData);
      },
      (err) => {
        console.error("Error fetching defect reports:", err);
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
      },
      (err) => {
        console.error("Error fetching finished products:", err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Calculate financials
  useEffect(() => {
    if (!rawMaterials.length && !defectReports.length && !finishedProducts.length) {
      setLoadingData(false);
      return;
    }

    setLoadingData(true);

    // Filter by date range
    const filteredMaterials = rawMaterials.filter(m => isWithinRange(m.createdAt, dateRange));
    const filteredDefects = defectReports.filter(d => isWithinRange(d.defectDate, dateRange));
    const filteredProducts = finishedProducts.filter(p => isWithinRange(p.createdAt, dateRange));

    // Calculate Raw Material Expenses
    const rawMaterialCost = filteredMaterials.reduce((sum, m) => {
      const cost = (m.unitPrice || 0) * (m.quantity || 0);
      return sum + cost;
    }, 0);

    // Calculate Defect Losses
    const defectLoss = filteredDefects.reduce((sum, d) => sum + (d.totalLoss || 0), 0);

    // Calculate Total Expenses
    const totalExpenses = rawMaterialCost + defectLoss;

    // Calculate Income from Finished Products
    const totalIncome = filteredProducts.reduce((sum, p) => {
      const value = (p.sellingPrice || 0) * (p.quantity || 0);
      return sum + value;
    }, 0);

    // Calculate Potential Income
    const potentialIncome = finishedProducts.reduce((sum, p) => {
      const value = (p.sellingPrice || 0) * (p.quantity || 0);
      return sum + value;
    }, 0);

    // Calculate Total Inventory Value
    const totalInventoryValue = rawMaterials.reduce((sum, m) => {
      const value = (m.unitPrice || 0) * (m.quantity || 0);
      return sum + value;
    }, 0) + finishedProducts.reduce((sum, p) => {
      const value = (p.sellingPrice || 0) * (p.quantity || 0);
      return sum + value;
    }, 0);

    // Calculate Net Profit
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Expenses by Category
    const expensesByCategory = [
      { name: "Raw Materials", amount: rawMaterialCost, icon: IconPackage, color: "text-blue-500" },
      { name: "Defect Losses", amount: defectLoss, icon: IconBug, color: "text-red-500" },
    ];

    // Income by Category
    const incomeByCategory = [
      { name: "Finished Products", amount: totalIncome, icon: IconReceipt, color: "text-green-500" },
    ];

    setFinancials({
      totalExpenses,
      totalIncome,
      netProfit,
      profitMargin,
      rawMaterialCost,
      defectLoss,
      totalInventoryValue,
      potentialIncome,
      expensesByCategory,
      incomeByCategory,
    });

    // Calculate previous period data for trends
    const prevRange = getPreviousPeriodRange(dateRange);
    const prevFilteredMaterials = rawMaterials.filter(m => {
      const date = new Date(m.createdAt);
      return date >= prevRange.start && date <= prevRange.end;
    });
    const prevFilteredDefects = defectReports.filter(d => {
      const date = new Date(d.defectDate);
      return date >= prevRange.start && date <= prevRange.end;
    });
    const prevFilteredProducts = finishedProducts.filter(p => {
      const date = new Date(p.createdAt);
      return date >= prevRange.start && date <= prevRange.end;
    });

    const prevRawMaterialCost = prevFilteredMaterials.reduce((sum, m) => sum + ((m.unitPrice || 0) * (m.quantity || 0)), 0);
    const prevDefectLoss = prevFilteredDefects.reduce((sum, d) => sum + (d.totalLoss || 0), 0);
    const prevTotalExpenses = prevRawMaterialCost + prevDefectLoss;
    const prevTotalIncome = prevFilteredProducts.reduce((sum, p) => sum + ((p.sellingPrice || 0) * (p.quantity || 0)), 0);
    const prevNetProfit = prevTotalIncome - prevTotalExpenses;
    const prevProfitMargin = prevTotalIncome > 0 ? (prevNetProfit / prevTotalIncome) * 100 : 0;

    setPreviousFinancials({
      totalIncome: prevTotalIncome,
      totalExpenses: prevTotalExpenses,
      netProfit: prevNetProfit,
      profitMargin: prevProfitMargin,
      rawMaterialCost: prevRawMaterialCost,
      defectLoss: prevDefectLoss,
    });

    setLoadingData(false);
  }, [rawMaterials, defectReports, finishedProducts, dateRange]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "Metric",
      "Amount ($)",
      "Date Range",
      "Generated At",
    ];
    
    const data = [
      ["Total Income", financials.totalIncome.toFixed(2), dateRange, new Date().toLocaleString()],
      ["Total Expenses", financials.totalExpenses.toFixed(2), dateRange, new Date().toLocaleString()],
      ["Raw Material Cost", financials.rawMaterialCost.toFixed(2), dateRange, new Date().toLocaleString()],
      ["Defect Losses", financials.defectLoss.toFixed(2), dateRange, new Date().toLocaleString()],
      ["Net Profit", financials.netProfit.toFixed(2), dateRange, new Date().toLocaleString()],
      ["Profit Margin", financials.profitMargin.toFixed(2) + "%", dateRange, new Date().toLocaleString()],
      ["Total Inventory Value", financials.totalInventoryValue.toFixed(2), dateRange, new Date().toLocaleString()],
      ["Potential Income", financials.potentialIncome.toFixed(2), dateRange, new Date().toLocaleString()],
    ];

    const csv = [headers, ...data].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-report-${format(new Date(), "dd-MM-yyyy")}.csv`;
    a.click();
    toast.success("Report exported successfully!");
  };

  // Get trends for cards
  const incomeTrend = getTrend(financials.totalIncome, previousFinancials.totalIncome);
  const expensesTrend = getTrend(financials.totalExpenses, previousFinancials.totalExpenses);
  const profitTrend = getTrend(financials.netProfit, previousFinancials.netProfit);
  const marginTrend = getTrend(financials.profitMargin, previousFinancials.profitMargin);
  
  const IncomeTrendIcon = incomeTrend.icon;
  const ExpensesTrendIcon = expensesTrend.icon;
  const ProfitTrendIcon = profitTrend.icon;
  const MarginTrendIcon = marginTrend.icon;

  // Calculate expense distribution percentages
  const expenseDistribution = {
    rawMaterials: financials.rawMaterialCost,
    defectLosses: financials.defectLoss,
  };
  const totalExpensesAmount = expenseDistribution.rawMaterials + expenseDistribution.defectLosses;

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
              <p className="mt-2 text-muted-foreground">Loading financial data...</p>
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
                <CardDescription>Please log in to view financial analytics.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const isProfitable = financials.netProfit > 0;

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
                <IconWallet className="h-8 w-8 text-primary" />
                Income & Expenses
              </h2>
              <p className="text-sm text-muted-foreground">
                Analyze your manufacturing financial performance
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px] h-10 cursor-pointer bg-background/80 backdrop-blur-sm">
                  <IconCalendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  {dateRangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleExportCSV} className="cursor-pointer" variant="outline">
                <IconDownload className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Enhanced Summary Header */}
          <div className="rounded-lg border border-border/50 overflow-hidden bg-background/40 backdrop-blur-sm">
            <div className="p-4 border-b border-border/50 bg-background/30">
              {/* Main Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                {/* Total Income */}
                <div className="flex flex-col p-3 bg-background/20 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <IconTrendingUp className="h-4 w-4 text-green-500" />
                    <p className="text-xs font-medium uppercase tracking-wider">Total Income</p>
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-xl md:text-2xl font-bold text-green-600">{formatCurrency(financials.totalIncome)}</p>
                    <div className={cn("flex items-center gap-0.5 text-xs", incomeTrend.color)}>
                      <IncomeTrendIcon className="h-3 w-3" />
                      <span>{incomeTrend.label}</span>
                      {incomeTrend.percentage !== "0" && (
                        <span className="text-xs">({incomeTrend.percentage}%)</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    From finished products
                  </p>
                </div>

                {/* Total Expenses */}
                <div className="flex flex-col p-3 bg-background/20 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <IconTrendingDown className="h-4 w-4 text-red-500" />
                    <p className="text-xs font-medium uppercase tracking-wider">Total Expenses</p>
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-xl md:text-2xl font-bold text-red-600">{formatCurrency(financials.totalExpenses)}</p>
                    <div className={cn("flex items-center gap-0.5 text-xs", expensesTrend.color)}>
                      <ExpensesTrendIcon className="h-3 w-3" />
                      <span>{expensesTrend.label}</span>
                      {expensesTrend.percentage !== "0" && (
                        <span className="text-xs">({expensesTrend.percentage}%)</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Raw materials + Defects
                  </p>
                </div>

                {/* Net Profit */}
                <div className="flex flex-col p-3 bg-background/20 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <IconCurrencyDollar className="h-4 w-4" />
                    <p className="text-xs font-medium uppercase tracking-wider">Net Profit</p>
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className={cn("text-xl md:text-2xl font-bold", isProfitable ? "text-green-600" : "text-red-600")}>
                      {formatCurrency(financials.netProfit)}
                    </p>
                    <div className={cn("flex items-center gap-0.5 text-xs", profitTrend.color)}>
                      <ProfitTrendIcon className="h-3 w-3" />
                      <span>{profitTrend.label}</span>
                      {profitTrend.percentage !== "0" && (
                        <span className="text-xs">({profitTrend.percentage}%)</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isProfitable ? "Profitable period" : "Loss period"}
                  </p>
                </div>

                {/* Profit Margin */}
                <div className="flex flex-col p-3 bg-background/20 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <IconPercentage className="h-4 w-4" />
                    <p className="text-xs font-medium uppercase tracking-wider">Profit Margin</p>
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-xl md:text-2xl font-bold">{financials.profitMargin.toFixed(1)}%</p>
                    <div className={cn("flex items-center gap-0.5 text-xs", marginTrend.color)}>
                      <MarginTrendIcon className="h-3 w-3" />
                      <span>{marginTrend.label}</span>
                      {marginTrend.percentage !== "0" && (
                        <span className="text-xs">({marginTrend.percentage}%)</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        financials.profitMargin > 30 ? "bg-green-500" :
                        financials.profitMargin > 15 ? "bg-blue-500" :
                        financials.profitMargin > 0 ? "bg-yellow-500" : "bg-red-500"
                      )}
                      style={{ width: `${Math.min(Math.max(financials.profitMargin, 0), 100)}%` }}
                    />
                  </div>
                </div>

                {/* ROI */}
                <div className="flex flex-col p-3 bg-background/20 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <IconChartBar className="h-4 w-4" />
                    <p className="text-xs font-medium uppercase tracking-wider">ROI</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className={cn("text-xl md:text-2xl font-bold", financials.totalExpenses > 0 && financials.netProfit > 0 ? "text-green-600" : "text-red-600")}>
                      {financials.totalExpenses > 0 ? ((financials.netProfit / financials.totalExpenses) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Return on investment
                  </p>
                </div>
              </div>

              {/* Expense Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border/30">
                {/* Expense Breakdown */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <IconChartPie className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expense Distribution</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-500/10 text-blue-600 text-xs px-2 py-1 gap-1">
                      <IconPackage className="h-3 w-3" />
                      Raw Materials: {formatCurrency(financials.rawMaterialCost)}
                      <span className="text-xs opacity-70">
                        ({totalExpensesAmount > 0 ? ((financials.rawMaterialCost / totalExpensesAmount) * 100).toFixed(0) : 0}%)
                      </span>
                    </Badge>
                    <Badge className="bg-red-500/10 text-red-600 text-xs px-2 py-1 gap-1">
                      <IconBug className="h-3 w-3" />
                      Defect Losses: {formatCurrency(financials.defectLoss)}
                      <span className="text-xs opacity-70">
                        ({totalExpensesAmount > 0 ? ((financials.defectLoss / totalExpensesAmount) * 100).toFixed(0) : 0}%)
                      </span>
                    </Badge>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <IconBuildingWarehouse className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Key Metrics</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Inventory Value:</span>
                      <span className="text-sm font-semibold">{formatCurrency(financials.totalInventoryValue)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Potential Income:</span>
                      <span className="text-sm font-semibold text-blue-600">{formatCurrency(financials.potentialIncome)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Turnover:</span>
                      <span className="text-sm font-semibold">
                        {financials.totalInventoryValue > 0 ? ((financials.totalIncome / financials.totalInventoryValue) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>
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

          {/* Detailed Breakdown - Expenses & Income */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Expenses Breakdown */}
            <Card className="bg-background/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-base font-medium">Expenses Breakdown</CardTitle>
                <CardDescription className="text-xs">
                  Detailed breakdown of where your money is spent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financials.expensesByCategory.map((expense, idx) => {
                    const percentage = (expense.amount / financials.totalExpenses) * 100 || 0;
                    const Icon = expense.icon;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${expense.color}`} />
                            <span>{expense.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{formatCurrency(expense.amount)}</span>
                            <span className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-red-500/70 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {financials.totalExpenses === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">No expenses recorded</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Income Breakdown */}
            <Card className="bg-background/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-base font-medium">Income Breakdown</CardTitle>
                <CardDescription className="text-xs">
                  Revenue sources and income streams
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financials.incomeByCategory.map((income, idx) => {
                    const percentage = (income.amount / financials.totalIncome) * 100 || 0;
                    const Icon = income.icon;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${income.color}`} />
                            <span>{income.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{formatCurrency(income.amount)}</span>
                            <span className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-green-500/70 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {financials.totalIncome === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">No income recorded</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Section */}
          <Card className="bg-background/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-medium">Financial Summary</CardTitle>
              <CardDescription className="text-xs">
                Key metrics and performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Income vs Expenses</p>
                  <p className="text-sm font-semibold mt-1">
                    {financials.totalIncome > financials.totalExpenses ? (
                      <span className="text-green-600">Surplus</span>
                    ) : (
                      <span className="text-red-600">Deficit</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(Math.abs(financials.totalIncome - financials.totalExpenses))}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Potential Income</p>
                  <p className="text-sm font-semibold mt-1 text-blue-600">
                    {formatCurrency(financials.potentialIncome)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    If all products sold
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Inventory Turnover</p>
                  <p className="text-sm font-semibold mt-1">
                    {financials.totalInventoryValue > 0 
                      ? ((financials.totalIncome / financials.totalInventoryValue) * 100).toFixed(0) 
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Income vs inventory value
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Efficiency Ratio</p>
                  <p className="text-sm font-semibold mt-1">
                    {financials.totalIncome > 0 
                      ? ((financials.totalExpenses / financials.totalIncome) * 100).toFixed(0) 
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Expenses per dollar earned
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}