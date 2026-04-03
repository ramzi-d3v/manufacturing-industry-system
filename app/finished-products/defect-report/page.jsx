// app/batches/finished-products/defect-report/page.jsx
"use client";
import { IconLoader } from "@tabler/icons-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  IconBug,
  IconTruck,
  IconBuildingWarehouse,
  IconCalendar,
  IconDownload,
  IconSearch,
  IconX,
  IconPlus,
  IconCurrencyDollar,
  IconSortAscending,
  IconRefresh,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconPackage,
  IconAlertCircle,
} from "@tabler/icons-react";
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
  where,
} from "firebase/firestore";
import { FinishedProductDefectTable } from "@/components/finished-product-defect-table";

// Defect source options
const defectSourceOptions = [
  { value: "production", label: "Production Error" },
  { value: "handling", label: "Handling Damage" },
  { value: "storage", label: "Storage Issue" },
  { value: "transport", label: "Transport Damage" },
  { value: "customer", label: "Customer Return" },
];

// Risk level options
const riskLevelOptions = [
  { value: "Critical", label: "Critical" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
  { value: "Minor", label: "Minor" },
];

// Status options
const statusOptions = [
  { value: "Reported", label: "Reported" },
  { value: "Under Investigation", label: "Under Investigation" },
  { value: "Rework Planned", label: "Rework Planned" },
  { value: "Rework Completed", label: "Rework Completed" },
  { value: "Written Off", label: "Written Off" },
  { value: "Resolved", label: "Resolved" },
];

export default function FinishedProductDefectReportPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [dateRange, setDateRange] = useState("90d");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [riskLevelFilter, setRiskLevelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newReport, setNewReport] = useState({
    productId: "",
    productName: "",
    batchNumber: "",
    supplierId: "",
    supplierName: "",
    defectDate: new Date().toISOString().split("T")[0],
    defectSource: "production",
    defectCategory: "",
    quantity: "",
    unit: "pcs",
    costPerUnit: "",
    sellingPrice: "",
    riskLevel: "Medium",
    severity: "Medium",
    status: "Reported",
    actionTaken: "",
    reportedBy: "",
    location: "",
    qualityGrade: "",
    rootCause: "",
  });

  const [stats, setStats] = useState({
    totalDefects: 0,
    totalLoss: 0,
    productionDefects: 0,
    productionLoss: 0,
    handlingDefects: 0,
    handlingLoss: 0,
    resolvedCount: 0,
    openCount: 0,
    criticalCount: 0,
    highCount: 0,
  });

  // Fetch finished products from Firestore
  useEffect(() => {
    if (!user) return;

    const fetchFinishedProducts = async () => {
      try {
        const productsRef = collection(db, "finishedProducts", user.uid, "products");
        const productsSnapshot = await getDocs(productsRef);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFinishedProducts(productsData);
      } catch (err) {
        console.error("Error fetching finished products:", err);
        toast.error("Failed to load finished products");
      }
    };

    fetchFinishedProducts();
  }, [user]);

  // Fetch suppliers
  useEffect(() => {
    if (!user) return;

    const fetchSuppliers = async () => {
      try {
        // Fetch suppliers from root suppliers collection
        const suppliersRef = collection(db, "suppliers");
        const suppliersSnapshot = await getDocs(suppliersRef);
        const suppliersData = suppliersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSuppliers(suppliersData);
      } catch (err) {
        console.error("Error fetching suppliers:", err);
      }
    };

    fetchSuppliers();
  }, [user]);

  // Firestore real-time listener with proper index
  useEffect(() => {
    if (!user) {
      setLoadingData(false);
      setReports([]);
      return;
    }

    setLoadingData(true);
    
    const userReportsRef = collection(db, "finishedProductDefects", user.uid, "reports");
    const q = query(userReportsRef, orderBy("defectDate", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reportsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setReports(reportsData);
        setLoadingData(false);
        setError(null);
      },
      (err) => {
        console.error("Firestore error:", err);
        if (err.code === 'failed-precondition' || err.message.includes('index')) {
          setError("Please create the required Firestore index. Click the link in the console to create it automatically.");
          toast.error("Firestore index required. Check console for link.");
        } else {
          setError("Failed to load reports. Please try again.");
          toast.error("Error loading reports");
        }
        setLoadingData(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle batch selection - fetch product details from finishedProducts
  const handleBatchSelect = async (batchNumber) => {
    if (!batchNumber) {
      setSelectedProduct(null);
      setNewReport(prev => ({
        ...prev,
        batchNumber: "",
        productId: "",
        productName: "",
        qualityGrade: "",
        location: "",
        costPerUnit: "",
        sellingPrice: "",
      }));
      return;
    }

    try {
      const productsRef = collection(db, "finishedProducts", user.uid, "products");
      const q = query(productsRef, where("batchNumber", "==", batchNumber));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const product = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        setSelectedProduct(product);
        setNewReport(prev => ({
          ...prev,
          productId: product.id,
          productName: product.name || product.productName || "",
          batchNumber: product.batchNumber,
          qualityGrade: product.qualityGrade || "",
          location: product.location || "",
          costPerUnit: product.costPerUnit || "",
          sellingPrice: product.sellingPrice || "",
          unit: product.unit || "pcs",
        }));
        toast.success(`Loaded details for batch: ${batchNumber}`);
      } else {
        toast.error("Batch not found in finished products");
        setSelectedProduct(null);
      }
    } catch (err) {
      console.error("Error fetching batch details:", err);
      toast.error("Failed to load batch details");
    }
  };

  // Apply filters, search, and sort
  useEffect(() => {
    let filtered = [...reports];

    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.id?.toString().includes(searchQuery)
      );
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter((r) => r.defectSource === sourceFilter);
    }

    if (riskLevelFilter !== "all") {
      filtered = filtered.filter((r) => 
        r.riskLevel?.toLowerCase() === riskLevelFilter.toLowerCase() ||
        r.severity?.toLowerCase() === riskLevelFilter.toLowerCase()
      );
    }

    const now = new Date();
    if (dateRange === "7d") {
      const cutoff = new Date(now.setDate(now.getDate() - 7));
      filtered = filtered.filter((r) => new Date(r.defectDate) >= cutoff);
    } else if (dateRange === "30d") {
      const cutoff = new Date(now.setDate(now.getDate() - 30));
      filtered = filtered.filter((r) => new Date(r.defectDate) >= cutoff);
    } else if (dateRange === "90d") {
      const cutoff = new Date(now.setDate(now.getDate() - 90));
      filtered = filtered.filter((r) => new Date(r.defectDate) >= cutoff);
    }

    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.defectDate) - new Date(a.defectDate));
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.defectDate) - new Date(b.defectDate));
    } else if (sortBy === "highest-loss") {
      filtered.sort((a, b) => (b.totalLoss || 0) - (a.totalLoss || 0));
    } else if (sortBy === "lowest-loss") {
      filtered.sort((a, b) => (a.totalLoss || 0) - (b.totalLoss || 0));
    } else if (sortBy === "riskLevel") {
      const riskWeight = { Critical: 5, High: 4, Medium: 3, Low: 2, Minor: 1 };
      filtered.sort(
        (a, b) => (riskWeight[b.riskLevel] || 0) - (riskWeight[a.riskLevel] || 0)
      );
    }

    setFilteredReports(filtered);

    const totalLoss = filtered.reduce((sum, r) => sum + (r.totalLoss || 0), 0);
    const productionDefects = filtered.filter((r) => r.defectSource === "production").length;
    const productionLoss = filtered
      .filter((r) => r.defectSource === "production")
      .reduce((sum, r) => sum + (r.totalLoss || 0), 0);
    const handlingDefects = filtered.filter((r) =>
      ["handling", "storage", "transport"].includes(r.defectSource)
    ).length;
    const handlingLoss = filtered
      .filter((r) => ["handling", "storage", "transport"].includes(r.defectSource))
      .reduce((sum, r) => sum + (r.totalLoss || 0), 0);
    const resolvedCount = filtered.filter((r) => r.status === "Resolved").length;
    const openCount = filtered.filter((r) => r.status !== "Resolved").length;
    const criticalCount = filtered.filter((r) => 
      r.riskLevel === "Critical" || r.severity === "Critical"
    ).length;
    const highCount = filtered.filter((r) => 
      r.riskLevel === "High" || r.severity === "High"
    ).length;

    setStats({
      totalDefects: filtered.length,
      totalLoss,
      productionDefects,
      productionLoss,
      handlingDefects,
      handlingLoss,
      resolvedCount,
      openCount,
      criticalCount,
      highCount,
    });
  }, [reports, dateRange, sourceFilter, riskLevelFilter, searchQuery, sortBy]);

  // Export CSV
  const handleExportReport = () => {
    const headers = [
      "ID",
      "Product",
      "Batch",
      "Defect Date",
      "Source",
      "Risk Level",
      "Quantity",
      "Loss",
      "Status",
      "Action",
    ];
    const csvData = filteredReports.map((r) => [
      r.id,
      r.productName,
      r.batchNumber,
      r.defectDate,
      r.defectSource,
      r.riskLevel || r.severity,
      `${r.quantity} ${r.unit}`,
      `$${r.totalLoss || 0}`,
      r.status,
      r.actionTaken,
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finished-product-defect-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Report exported successfully!");
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReport((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setNewReport((prev) => ({ ...prev, [name]: value }));
  };

  // Create new report
  const handleSubmitNewReport = async () => {
    if (!newReport.productName || !newReport.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    const quantity = parseFloat(newReport.quantity) || 0;
    const costPerUnit = parseFloat(newReport.costPerUnit) || 0;
    const totalLoss = quantity * costPerUnit;

    const reportData = {
      productId: newReport.productId || "",
      productName: newReport.productName,
      batchNumber: newReport.batchNumber || "",
      supplierId: newReport.supplierId || null,
      supplierName: newReport.supplierName || "",
      defectDate: newReport.defectDate || new Date().toISOString().split('T')[0],
      defectCategory: newReport.defectCategory || "General",
      defectSource: newReport.defectSource || "production",
      riskLevel: newReport.riskLevel || newReport.severity || "Medium",
      severity: newReport.severity || newReport.riskLevel || "Medium",
      quantity: quantity,
      unit: newReport.unit || "pcs",
      costPerUnit: costPerUnit,
      sellingPrice: parseFloat(newReport.sellingPrice) || 0,
      totalLoss: totalLoss,
      status: newReport.status || "Reported",
      reportedBy: newReport.reportedBy || user?.email || "System",
      actionTaken: newReport.actionTaken || "",
      location: newReport.location || "",
      qualityGrade: newReport.qualityGrade || "",
      rootCause: newReport.rootCause || "",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      reportedByUserId: user?.uid,
    };

    try {
      const userReportsRef = collection(db, "finishedProductDefects", user.uid, "reports");
      await addDoc(userReportsRef, reportData);
      setDialogOpen(false);
      toast.success("Report created successfully");
      
      // Reset form
      setNewReport({
        productId: "",
        productName: "",
        batchNumber: "",
        supplierId: "",
        supplierName: "",
        defectDate: new Date().toISOString().split("T")[0],
        defectSource: "production",
        defectCategory: "",
        quantity: "",
        unit: "pcs",
        costPerUnit: "",
        sellingPrice: "",
        riskLevel: "Medium",
        severity: "Medium",
        status: "Reported",
        actionTaken: "",
        reportedBy: "",
        location: "",
        qualityGrade: "",
        rootCause: "",
      });
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error creating report:", error);
      toast.error("Failed to create report: " + error.message);
    }
  };

  // Update report
  const handleUpdateReport = async (updatedReport) => {
    if (!user || !updatedReport) return;

    const totalLoss = parseFloat(updatedReport.quantity) * parseFloat(updatedReport.costPerUnit);
    const updatedData = {
      ...updatedReport,
      totalLoss,
      updatedAt: Timestamp.now(),
    };
    delete updatedData.id;

    try {
      const reportRef = doc(db, "finishedProductDefects", user.uid, "reports", updatedReport.id);
      await updateDoc(reportRef, updatedData);
      toast.success("Report updated successfully!");
    } catch (err) {
      console.error("Error updating report:", err);
      toast.error("Failed to update report: " + err.message);
    }
  };

  // Delete report
  const handleDeleteReport = async (id) => {
    if (!user || !id) return;
    try {
      const reportRef = doc(db, "finishedProductDefects", user.uid, "reports", id);
      await deleteDoc(reportRef);
      toast.success("Report deleted successfully!");
    } catch (err) {
      console.error("Error deleting report:", err);
      toast.error("Failed to delete report: " + err.message);
    }
  };

  // Loading states
  if (loadingAuth || loadingData) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex-1 p-8 flex items-center justify-center">
            <div className="flex flex-col items-center">
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
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To fix this issue, you need to create a composite index in Firebase Console:
                </p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Go to Firebase Console → Firestore Database → Indexes</li>
                  <li>Click "Create Composite Index"</li>
                  <li>Collection: finishedProductDefects/{{userId}}/reports</li>
                  <li>Fields: defectDate (Descending)</li>
                  <li>Click "Create"</li>
                </ol>
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
                <CardDescription>Please log in to view defect reports.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Get unique batch numbers from finished products for dropdown
  const batchNumbers = finishedProducts
    .filter(p => p.batchNumber)
    .map(p => ({ batchNumber: p.batchNumber, product: p }));

  // Main UI
  return (
    <>
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader className="relative overflow-hidden z-1001 bg-zinc-950" />
          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute -top-[10%] -left-[10%] h-50 w-50 rounded-full bg-purple-600/20 blur-[120px] animate-pulse-glow-1" />
            <div className="absolute top-[20%] -right-[5%] h-100 w-100 rounded-full bg-indigo-500/15 blur-[100px] animate-pulse-glow-2" />
            <div className="absolute bottom-[10%] -left-[5%] h-50 w-75 rounded-full bg-fuchsia-600/10 blur-[80px] animate-pulse-glow-3" />
          </div>
          
          <div className="flex-1 p-4 md:p-8 pt-6 relative z-10">
            {/* Header with title and actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl lg:text-4xl tracking-tight text-foreground flex items-center gap-2">
                  <IconBug className="h-8 w-8 text-destructive" />
                  Finished Product Defect Report
                </h1>
                <p className="text-muted-foreground mt-1 text-sm italic">
                  Track and analyze finished product defects and quality issues
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExportReport} className="cursor-pointer h-8">
                  <IconDownload className="mr-2 h-4 w-4" />
                  Export
                </Button>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="cursor-pointer h-8">
                      <IconPlus className="mr-2 h-4 w-4" />
                      New Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent 
                    className="w-[90vw] max-w-[90vw] sm:w-[85vw] sm:max-w-[85vw] md:w-[80vw] md:max-w-[80vw] lg:w-[75vw] lg:max-w-[75vw] xl:w-[70vw] xl:max-w-[70vw] h-[93vh] max-h-[93vh] p-6 gap-4 bg-background overflow-y-auto"
                    showCloseButton={true}
                  >
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Create New Defect Report</DialogTitle>
                      <DialogDescription>
                        Enter the details of the defective finished product. Click save when you're done.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={(e) => { e.preventDefault(); handleSubmitNewReport(); }}>
                      <div className="grid gap-6 py-4">
                        {/* Batch Selection */}
                        <div className="space-y-3">
                          <h3 className="text-base font-medium border-b border-border pb-2">Batch Selection</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Select Batch Number</label>
                              <Select 
                                value={newReport.batchNumber} 
                                onValueChange={(value) => {
                                  handleSelectChange("batchNumber", value);
                                  handleBatchSelect(value);
                                }}
                              >
                                <SelectTrigger className="cursor-pointer">
                                  <SelectValue placeholder="Search or select batch" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                  {batchNumbers.map((item) => (
                                    <SelectItem key={item.batchNumber} value={item.batchNumber} className="cursor-pointer">
                                      {item.batchNumber} - {item.product.name || item.product.productName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Or Enter Manually</label>
                              <Input 
                                name="batchNumber" 
                                value={newReport.batchNumber} 
                                onChange={handleInputChange}
                                onBlur={(e) => handleBatchSelect(e.target.value)}
                                placeholder="Enter batch number" 
                                className="cursor-text" 
                              />
                            </div>
                          </div>
                        </div>

                        {/* Product Information */}
                        <div className="space-y-3">
                          <h3 className="text-base font-medium border-b border-border pb-2">Product Information</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Product Name *</label>
                              <Input 
                                name="productName" 
                                value={newReport.productName} 
                                onChange={handleInputChange} 
                                placeholder="e.g., Premium Headphones" 
                                className="cursor-text" 
                                required 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Supplier</label>
                              <Select 
                                value={newReport.supplierId} 
                                onValueChange={(value) => {
                                  const selectedSupplier = suppliers.find(s => s.id === value);
                                  handleSelectChange("supplierId", value);
                                  handleSelectChange("supplierName", selectedSupplier?.name || "");
                                }}
                              >
                                <SelectTrigger className="cursor-pointer">
                                  <SelectValue placeholder="Select supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {suppliers.map((supplier) => (
                                    <SelectItem key={supplier.id} value={supplier.id} className="cursor-pointer">
                                      {supplier.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Quality Grade</label>
                              <Input 
                                name="qualityGrade" 
                                value={newReport.qualityGrade} 
                                onChange={handleInputChange} 
                                placeholder="Auto-loaded from batch" 
                                className="cursor-text bg-muted/20" 
                                readOnly={!!selectedProduct}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Location</label>
                              <Input 
                                name="location" 
                                value={newReport.location} 
                                onChange={handleInputChange} 
                                placeholder="Auto-loaded from batch" 
                                className="cursor-text bg-muted/20" 
                                readOnly={!!selectedProduct}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Defect Details */}
                        <div className="space-y-3">
                          <h3 className="text-base font-medium border-b border-border pb-2">Defect Details</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Defect Date</label>
                              <Input name="defectDate" type="date" value={newReport.defectDate} onChange={handleInputChange} className="cursor-text" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Defect Category</label>
                              <Select value={newReport.defectCategory} onValueChange={(value) => handleSelectChange("defectCategory", value)}>
                                <SelectTrigger className="cursor-pointer">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cosmetic">Cosmetic Defect</SelectItem>
                                  <SelectItem value="functional">Functional Defect</SelectItem>
                                  <SelectItem value="packaging">Packaging Issue</SelectItem>
                                  <SelectItem value="labeling">Labeling Error</SelectItem>
                                  <SelectItem value="size">Size/Fit Issue</SelectItem>
                                  <SelectItem value="material">Material Flaw</SelectItem>
                                  <SelectItem value="assembly">Assembly Issue</SelectItem>
                                  <SelectItem value="finish">Finish/Coating Defect</SelectItem>
                                  <SelectItem value="performance">Performance Issue</SelectItem>
                                  <SelectItem value="safety">Safety Concern</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Defect Source</label>
                              <Select value={newReport.defectSource} onValueChange={(value) => handleSelectChange("defectSource", value)}>
                                <SelectTrigger className="cursor-pointer">
                                  <SelectValue placeholder="Select source" />
                                </SelectTrigger>
                                <SelectContent>
                                  {defectSourceOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Risk Level / Severity</label>
                              <Select value={newReport.riskLevel} onValueChange={(value) => {
                                handleSelectChange("riskLevel", value);
                                handleSelectChange("severity", value);
                              }}>
                                <SelectTrigger className="cursor-pointer">
                                  <SelectValue placeholder="Select risk level" />
                                </SelectTrigger>
                                <SelectContent>
                                  {riskLevelOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Status</label>
                              <Select value={newReport.status} onValueChange={(value) => handleSelectChange("status", value)}>
                                <SelectTrigger className="cursor-pointer">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Reported By</label>
                              <Input 
                                name="reportedBy" 
                                value={newReport.reportedBy || user?.email || ""} 
                                onChange={handleInputChange} 
                                placeholder="Your name" 
                                className="cursor-text" 
                              />
                            </div>
                          </div>
                        </div>

                        {/* Quantity and Cost */}
                        <div className="space-y-3">
                          <h3 className="text-base font-medium border-b border-border pb-2">Quantity & Cost</h3>
                          <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Quantity *</label>
                              <Input 
                                name="quantity" 
                                type="number" 
                                step="0.01" 
                                value={newReport.quantity} 
                                onChange={handleInputChange} 
                                placeholder="0" 
                                className="cursor-text" 
                                required 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Unit</label>
                              <Input name="unit" value={newReport.unit} onChange={handleInputChange} placeholder="pcs" className="cursor-text" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Cost per Unit ($) *</label>
                              <Input 
                                name="costPerUnit" 
                                type="number" 
                                step="0.01" 
                                value={newReport.costPerUnit} 
                                onChange={handleInputChange} 
                                placeholder="0.00" 
                                className="cursor-text" 
                                required 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Selling Price ($)</label>
                              <Input 
                                name="sellingPrice" 
                                type="number" 
                                step="0.01" 
                                value={newReport.sellingPrice} 
                                onChange={handleInputChange} 
                                placeholder="0.00" 
                                className="cursor-text" 
                              />
                            </div>
                          </div>
                          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                            <p className="text-xs text-muted-foreground">Calculated Total Loss</p>
                            <p className="text-lg font-bold text-destructive">
                              ${((parseFloat(newReport.quantity) || 0) * (parseFloat(newReport.costPerUnit) || 0)).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Root Cause */}
                        <div className="space-y-3">
                          <h3 className="text-base font-medium border-b border-border pb-2">Root Cause Analysis</h3>
                          <Textarea 
                            name="rootCause" 
                            value={newReport.rootCause} 
                            onChange={handleInputChange} 
                            placeholder="What caused this defect? (e.g., Machine calibration issue, Material quality problem, Operator error)" 
                            className="cursor-text" 
                            rows={2} 
                          />
                        </div>

                        {/* Action Taken */}
                        <div className="space-y-3">
                          <h3 className="text-base font-medium border-b border-border pb-2">Action Taken</h3>
                          <Textarea 
                            name="actionTaken" 
                            value={newReport.actionTaken} 
                            onChange={handleInputChange} 
                            placeholder="What action has been taken to resolve this defect?" 
                            className="cursor-text" 
                            rows={2} 
                          />
                        </div>
                      </div>

                      <DialogFooter className="mt-6">
                        <Button variant="outline" type="button" onClick={() => setDialogOpen(false)} className="cursor-pointer">
                          Cancel
                        </Button>
                        <Button type="submit" className="cursor-pointer">
                          <IconPlus className="mr-2 h-4 w-4" />
                          Create Report
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              {/* Total Defects Card */}
              <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Total Defects
                    </CardTitle>
                    <IconBug className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold mt-2">{stats.totalDefects}</div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-500/10 text-red-600 border-red-500/20 px-1.5 py-0 text-[10px]">
                        {stats.openCount} Open
                      </Badge>
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-1.5 py-0 text-[10px]">
                        {stats.resolvedCount} Resolved
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      {stats.totalDefects > 0 ? (
                        <IconTrendingUp className="h-3 w-3 text-yellow-500" />
                      ) : (
                        <IconMinus className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span>Active</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Total defect reports
                  </p>
                </CardContent>
              </Card>

              {/* Total Loss Card */}
              <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Total Loss
                    </CardTitle>
                    <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold mt-2 text-destructive">
                    ${stats.totalLoss.toLocaleString()}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      {stats.totalLoss > 10000 ? (
                        <IconTrendingUp className="h-3 w-3 text-red-500" />
                      ) : stats.totalLoss > 0 ? (
                        <IconTrendingUp className="h-3 w-3 text-yellow-500" />
                      ) : (
                        <IconMinus className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-muted-foreground">
                        {stats.totalLoss > 10000 ? 'High Impact' : stats.totalLoss > 0 ? 'Moderate' : 'No Loss'}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      {stats.totalDefects > 0 && (
                        <span>Avg: ${(stats.totalLoss / stats.totalDefects).toFixed(0)}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Financial impact from defects
                  </p>
                </CardContent>
              </Card>

              {/* Production Defects Card */}
              <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Production Defects
                    </CardTitle>
                    <IconPackage className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold mt-2">{stats.productionDefects}</div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      {stats.productionDefects > stats.handlingDefects ? (
                        <IconTrendingUp className="h-3 w-3 text-yellow-500" />
                      ) : stats.productionDefects > 0 ? (
                        <IconTrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <IconMinus className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-muted-foreground">
                        {stats.productionDefects > 0 ? 'Quality Issue' : 'No Issues'}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      <span>Loss: ${stats.productionLoss.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Defects from production process
                  </p>
                </CardContent>
              </Card>

              {/* Critical Issues Card */}
              <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Critical Issues
                    </CardTitle>
                    <IconAlertCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold mt-2">{stats.criticalCount}</div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      {stats.criticalCount > 5 ? (
                        <IconTrendingDown className="h-3 w-3 text-red-500" />
                      ) : stats.criticalCount > 0 ? (
                        <IconTrendingUp className="h-3 w-3 text-yellow-500" />
                      ) : (
                        <IconMinus className="h-3 w-3 text-green-500" />
                      )}
                      <span className="text-muted-foreground">
                        {stats.criticalCount > 0 ? 'Urgent Attention' : 'Under Control'}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      <span>High: {stats.highCount}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Critical & high risk defects
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Search, Filters, and Sort */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <IconSearch className="absolute z-10 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by product, batch..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 w-full bg-background/80 backdrop-blur-sm"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[130px] h-10 cursor-pointer bg-background/80 backdrop-blur-sm">
                      <IconCalendar className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90d" className="cursor-pointer">Last 3 months</SelectItem>
                      <SelectItem value="30d" className="cursor-pointer">Last 30 days</SelectItem>
                      <SelectItem value="7d" className="cursor-pointer">Last 7 days</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-[130px] h-10 cursor-pointer bg-background/80 backdrop-blur-sm">
                      <IconTruck className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="cursor-pointer">All Sources</SelectItem>
                      {defectSourceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
                    <SelectTrigger className="w-[110px] h-10 cursor-pointer bg-background/80 backdrop-blur-sm">
                      <IconAlertCircle className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Risk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="cursor-pointer">All</SelectItem>
                      {riskLevelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toLowerCase()} className="cursor-pointer">
                          {option.label}
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
                      <SelectItem value="newest" className="cursor-pointer">Newest first</SelectItem>
                      <SelectItem value="oldest" className="cursor-pointer">Oldest first</SelectItem>
                      <SelectItem value="highest-loss" className="cursor-pointer">Highest loss</SelectItem>
                      <SelectItem value="lowest-loss" className="cursor-pointer">Lowest loss</SelectItem>
                      <SelectItem value="riskLevel" className="cursor-pointer">Risk Level</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateRange("90d");
                      setSourceFilter("all");
                      setRiskLevelFilter("all");
                      setSearchQuery("");
                      setSortBy("newest");
                    }}
                    className="h-10 px-3 bg-background/80 backdrop-blur-sm"
                    title="Reset all filters"
                  >
                    <IconRefresh className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Active filters display */}
              {(sourceFilter !== "all" || riskLevelFilter !== "all" || dateRange !== "90d") && (
                <div className="flex flex-wrap gap-2">
                  {dateRange !== "90d" && (
                    <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm">
                      <IconCalendar className="h-3 w-3" />
                      {dateRange === "7d" ? "Last 7 days" : "Last 30 days"}
                      <button onClick={() => setDateRange("90d")} className="ml-1 hover:text-destructive">
                        <IconX className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {sourceFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm">
                      <IconTruck className="h-3 w-3" />
                      Source: {defectSourceOptions.find(s => s.value === sourceFilter)?.label || sourceFilter}
                      <button onClick={() => setSourceFilter("all")} className="ml-1 hover:text-destructive">
                        <IconX className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {riskLevelFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm">
                      <IconAlertCircle className="h-3 w-3" />
                      Risk: {riskLevelFilter === "critical" ? "Critical" : riskLevelFilter === "high" ? "High" : riskLevelFilter === "medium" ? "Medium" : riskLevelFilter === "low" ? "Low" : "Minor"}
                      <button onClick={() => setRiskLevelFilter("all")} className="ml-1 hover:text-destructive">
                        <IconX className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-medium">Defect Reports</h2>
                <Badge variant="outline" className="px-2 py-0 h-6 bg-background/80 backdrop-blur-sm">
                  {filteredReports.length} {filteredReports.length === 1 ? "report" : "reports"}
                </Badge>
              </div>
            </div>

            {/* DataTable */}
            <FinishedProductDefectTable
              data={filteredReports}
              onUpdate={handleUpdateReport}
              onDelete={handleDeleteReport}
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}