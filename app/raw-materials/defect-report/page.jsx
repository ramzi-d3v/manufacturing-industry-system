// app/batches/raw-material/defect-report/page.jsx
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
} from "firebase/firestore";
import { DefectReportTable } from "@/components/defect-report-table";

// Defect source options
const defectSourceOptions = [
  { value: "supplier", label: "Supplier Defect" },
  { value: "warehouse", label: "Warehouse Damage" },
  { value: "handling", label: "Handling Damage" },
  { value: "storage", label: "Storage Issue" },
];

// risk_level options
const risk_levelOptions = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

// Status options
const statusOptions = [
  { value: "Reported to Supplier", label: "Reported to Supplier" },
  { value: "Under Investigation", label: "Under Investigation" },
  { value: "Credit Note Issued", label: "Credit Note Issued" },
  { value: "Written Off", label: "Written Off" },
  { value: "Resolved", label: "Resolved" },
];

export default function DefectReportPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [dateRange, setDateRange] = useState("90d");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [risk_levelFilter, setrisk_levelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [newReport, setNewReport] = useState({
    materialName: "",
    defectDate: new Date().toISOString().split("T")[0],
    defectType: "",
    defectSource: "supplier",
    quantity: "",
    unit: "kg",
    costPerUnit: "",
    description: "",
    risk_level: "Medium",
    status: "Reported to Supplier",
    actionTaken: "",
    reportedBy: "",
    location: "",
    batchNumber: "",
    supplier: "",
  });

  const [stats, setStats] = useState({
    totalDefects: 0,
    totalLoss: 0,
    supplierDefects: 0,
    supplierLoss: 0,
    warehouseDefects: 0,
    warehouseLoss: 0,
    resolvedCount: 0,
    openCount: 0,
    highrisk_level: 0,
  });

  // Firestore real-time listener for user's defect reports subcollection
  useEffect(() => {
    if (!user) {
      setLoadingData(false);
      setReports([]);
      return;
    }

    setLoadingData(true);
    
    const userReportsRef = collection(db, "defectReports", user.uid, "reports");
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
        setError("Failed to load reports. Please try again.");
        setLoadingData(false);
        toast.error("Error loading reports");
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Apply filters, search, and sort
  useEffect(() => {
    let filtered = [...reports];

    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.materialName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.defectType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.id?.toString().includes(searchQuery)
      );
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter((r) => r.defectSource === sourceFilter);
    }

    if (risk_levelFilter !== "all") {
      filtered = filtered.filter(
        (r) => r.risk_level?.toLowerCase() === risk_levelFilter.toLowerCase()
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
      filtered.sort((a, b) => b.totalLoss - a.totalLoss);
    } else if (sortBy === "lowest-loss") {
      filtered.sort((a, b) => a.totalLoss - b.totalLoss);
    } else if (sortBy === "risk_level") {
      const risk_levelWeight = { High: 3, Medium: 2, Low: 1 };
      filtered.sort(
        (a, b) => risk_levelWeight[b.risk_level] - risk_levelWeight[a.risk_level]
      );
    }

    setFilteredReports(filtered);

    const totalLoss = filtered.reduce((sum, r) => sum + (r.totalLoss || 0), 0);
    const supplierDefects = filtered.filter((r) => r.defectSource === "supplier").length;
    const supplierLoss = filtered
      .filter((r) => r.defectSource === "supplier")
      .reduce((sum, r) => sum + (r.totalLoss || 0), 0);
    const warehouseDefects = filtered.filter((r) =>
      ["warehouse", "handling", "storage"].includes(r.defectSource)
    ).length;
    const warehouseLoss = filtered
      .filter((r) => ["warehouse", "handling", "storage"].includes(r.defectSource))
      .reduce((sum, r) => sum + (r.totalLoss || 0), 0);
    const resolvedCount = filtered.filter((r) => r.status === "Resolved").length;
    const openCount = filtered.filter((r) => r.status !== "Resolved").length;
    const highrisk_level = filtered.filter((r) => r.risk_level === "High").length;

    setStats({
      totalDefects: filtered.length,
      totalLoss,
      supplierDefects,
      supplierLoss,
      warehouseDefects,
      warehouseLoss,
      resolvedCount,
      openCount,
      highrisk_level,
    });
  }, [reports, dateRange, sourceFilter, risk_levelFilter, searchQuery, sortBy]);

  // Export CSV
  const handleExportReport = () => {
    const headers = [
      "ID",
      "Material",
      "Defect Date",
      "Type",
      "Source",
      "Supplier",
      "Quantity",
      "Loss",
      "risk_level",
      "Status",
      "Action",
    ];
    const csvData = filteredReports.map((r) => [
      r.id,
      r.materialName,
      r.defectDate,
      r.defectType,
      r.defectSource,
      r.supplier,
      `${r.quantity} ${r.unit}`,
      `$${r.totalLoss}`,
      r.risk_level,
      r.status,
      r.actionTaken,
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `defect-report-${new Date().toISOString().split("T")[0]}.csv`;
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
    if (!user) {
      toast.error("You must be logged in to create reports");
      return;
    }

    if (
      !newReport.materialName ||
      !newReport.quantity ||
      !newReport.costPerUnit ||
      !newReport.supplier
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const totalLoss = parseFloat(newReport.quantity) * parseFloat(newReport.costPerUnit);
    const reportData = {
      materialName: newReport.materialName,
      defectDate: newReport.defectDate,
      defectType: newReport.defectType || "Quality Issue",
      defectSource: newReport.defectSource,
      quantity: parseFloat(newReport.quantity),
      unit: newReport.unit,
      costPerUnit: parseFloat(newReport.costPerUnit),
      totalLoss,
      description: newReport.description || "",
      risk_level: newReport.risk_level,
      status: newReport.status,
      actionTaken: newReport.actionTaken || "",
      reportedBy: newReport.reportedBy || user.displayName || "System User",
      location: newReport.location || "",
      batchNumber: newReport.batchNumber || "",
      supplier: newReport.supplier,
      reportDate: new Date().toISOString().split("T")[0],
      createdAt: Timestamp.now(),
    };

    try {
      const userReportsRef = collection(db, "defectReports", user.uid, "reports");
      await addDoc(userReportsRef, reportData);
      toast.success("Defect report added successfully!");
      setDialogOpen(false);
      setNewReport({
        materialName: "",
        defectDate: new Date().toISOString().split("T")[0],
        defectType: "",
        defectSource: "supplier",
        quantity: "",
        unit: "kg",
        costPerUnit: "",
        description: "",
        risk_level: "Medium",
        status: "Reported to Supplier",
        actionTaken: "",
        reportedBy: "",
        location: "",
        batchNumber: "",
        supplier: "",
      });
    } catch (err) {
      console.error("Error adding report:", err);
      toast.error("Failed to add report: " + err.message);
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
      const reportRef = doc(db, "defectReports", user.uid, "reports", updatedReport.id);
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
      const reportRef = doc(db, "defectReports", user.uid, "reports", id);
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
                <CardDescription>Please log in to view defect reports.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Main UI
  return (
    <>
      <style jsx global>{`
        @keyframes pulse-glow-1 {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.2);
          }
        }
        
        @keyframes pulse-glow-2 {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.25);
          }
        }
        
        @keyframes pulse-glow-3 {
          0%, 100% {
            opacity: 0.25;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2);
          }
        }
        
        .animate-pulse-glow-1 {
          animation: pulse-glow-1 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-pulse-glow-2 {
          animation: pulse-glow-2 5s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.5s;
        }
        
        .animate-pulse-glow-3 {
          animation: pulse-glow-3 4.5s cubic-bezier(0.4, 0, 0.6, 1) infinite 1s;
        }
      `}</style>
      
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
                  Defect Report
                </h1>
                <p className="text-muted-foreground mt-1 text-sm italic">
                  Track and analyze material defects and losses
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
                        Enter the details of the defective material. Click save when you're done.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={(e) => { e.preventDefault(); handleSubmitNewReport(); }}>
                      <div className="grid gap-6 py-4">
                        {/* Material Information */}
                        <div className="space-y-3">
                          <h3 className="text-base font-medium border-b border-border pb-2">Material Information</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Material Name *</label>
                              <Input name="materialName" value={newReport.materialName} onChange={handleInputChange} placeholder="e.g., Steel Rod" className="cursor-text" required />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Supplier *</label>
                              <Input name="supplier" value={newReport.supplier} onChange={handleInputChange} placeholder="Supplier name" className="cursor-text" required />
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
                              <label className="text-sm text-muted-foreground">Defect Type</label>
                              <Input name="defectType" value={newReport.defectType} onChange={handleInputChange} placeholder="e.g., Quality Issue" className="cursor-text" />
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
                              <label className="text-sm text-muted-foreground">Risk Level</label>
                              <Select value={newReport.risk_level} onValueChange={(value) => handleSelectChange("risk_level", value)}>
                                <SelectTrigger className="cursor-pointer">
                                  <SelectValue placeholder="Select risk level" />
                                </SelectTrigger>
                                <SelectContent>
                                  {risk_levelOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Quantity and Cost */}
                        <div className="space-y-3">
                          <h3 className="text-base font-medium border-b border-border pb-2">Quantity & Cost</h3>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Quantity *</label>
                              <Input name="quantity" type="number" step="0.01" value={newReport.quantity} onChange={handleInputChange} placeholder="0" className="cursor-text" required />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Unit</label>
                              <Input name="unit" value={newReport.unit} onChange={handleInputChange} placeholder="kg" className="cursor-text" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Cost/Unit *</label>
                              <Input name="costPerUnit" type="number" step="0.01" value={newReport.costPerUnit} onChange={handleInputChange} placeholder="0.00" className="cursor-text" required />
                            </div>
                          </div>
                        </div>

                        {/* Location & Batch */}
                        <div className="space-y-3">
                          <h3 className="text-base font-medium border-b border-border pb-2">Location & Batch</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Location</label>
                              <Input name="location" value={newReport.location} onChange={handleInputChange} placeholder="e.g., Warehouse A" className="cursor-text" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm text-muted-foreground">Batch Number</label>
                              <Input name="batchNumber" value={newReport.batchNumber} onChange={handleInputChange} placeholder="e.g., B2024-001" className="cursor-text" />
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                          <h3 className="text-base font-medium border-b border-border pb-2">Description</h3>
                          <Textarea name="description" value={newReport.description} onChange={handleInputChange} placeholder="Describe the defect..." className="cursor-text" rows={3} />
                        </div>

                        {/* Action Taken */}
                        <div className="space-y-3">
                          <h3 className="text-base font-medium border-b border-border pb-2">Action Taken</h3>
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
                              <Input name="reportedBy" value={newReport.reportedBy} onChange={handleInputChange} placeholder="Your name" className="cursor-text" />
                            </div>
                          </div>
                          <Textarea name="actionTaken" value={newReport.actionTaken} onChange={handleInputChange} placeholder="What action has been taken?" className="cursor-text" rows={2} />
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

            {/* Stats Cards - Enhanced with trend indicators */}
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

              {/* Supplier Defects Card */}
              <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Supplier Defects
                    </CardTitle>
                    <IconTruck className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold mt-2">{stats.supplierDefects}</div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      {stats.supplierDefects > stats.warehouseDefects ? (
                        <IconTrendingUp className="h-3 w-3 text-yellow-500" />
                      ) : stats.supplierDefects > 0 ? (
                        <IconTrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <IconMinus className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-muted-foreground">
                        {stats.supplierDefects > 0 ? 'Quality Issue' : 'No Issues'}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      <span>Loss: ${stats.supplierLoss.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Defects from supplier quality
                  </p>
                </CardContent>
              </Card>

              {/* Warehouse Damage Card */}
              <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Warehouse Damage
                    </CardTitle>
                    <IconBuildingWarehouse className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold mt-2">{stats.warehouseDefects}</div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      {stats.warehouseDefects > stats.supplierDefects ? (
                        <IconTrendingDown className="h-3 w-3 text-red-500" />
                      ) : stats.warehouseDefects > 0 ? (
                        <IconTrendingUp className="h-3 w-3 text-yellow-500" />
                      ) : (
                        <IconMinus className="h-3 w-3 text-green-500" />
                      )}
                      <span className="text-muted-foreground">
                        {stats.warehouseDefects > 0 ? 'Handling Issue' : 'Well Managed'}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      <span>Loss: ${stats.warehouseLoss.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Damage during storage/handling
                  </p>
                </CardContent>
              </Card>

            </div>

            {/* Search, Filters, and Sort */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by material, supplier, ID..."
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
                      <SelectItem value="supplier" className="cursor-pointer">Supplier</SelectItem>
                      <SelectItem value="warehouse" className="cursor-pointer">Warehouse</SelectItem>
                      <SelectItem value="handling" className="cursor-pointer">Handling</SelectItem>
                      <SelectItem value="storage" className="cursor-pointer">Storage</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={risk_levelFilter} onValueChange={setrisk_levelFilter}>
                    <SelectTrigger className="w-[110px] h-10 cursor-pointer bg-background/80 backdrop-blur-sm">
                      <IconBug className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Risk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="cursor-pointer">All</SelectItem>
                      <SelectItem value="low" className="cursor-pointer">Low</SelectItem>
                      <SelectItem value="medium" className="cursor-pointer">Medium</SelectItem>
                      <SelectItem value="high" className="cursor-pointer">High</SelectItem>
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
                      <SelectItem value="risk_level" className="cursor-pointer">Risk Level</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateRange("90d");
                      setSourceFilter("all");
                      setrisk_levelFilter("all");
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
              {(sourceFilter !== "all" || risk_levelFilter !== "all" || dateRange !== "90d") && (
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
                      Source: {sourceFilter === "supplier" ? "Supplier" : sourceFilter === "warehouse" ? "Warehouse" : sourceFilter === "handling" ? "Handling" : "Storage"}
                      <button onClick={() => setSourceFilter("all")} className="ml-1 hover:text-destructive">
                        <IconX className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {risk_levelFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm">
                      <IconBug className="h-3 w-3" />
                      Risk: {risk_levelFilter === "low" ? "Low" : risk_levelFilter === "medium" ? "Medium" : "High"}
                      <button onClick={() => setrisk_levelFilter("all")} className="ml-1 hover:text-destructive">
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
            <DefectReportTable
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