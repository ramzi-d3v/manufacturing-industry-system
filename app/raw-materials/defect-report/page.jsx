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
  IconBuildingStore,
  IconUser,
  IconPhone,
  IconMail,
  IconMapPin,
  IconPackage,
  IconBarcode,
  IconChevronDown,
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
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { DefectReportTable } from "@/components/defect-report-table";

// Defect source options
const defectSourceOptions = [
  { value: "supplier", label: "Supplier Defect", icon: IconBuildingStore },
  { value: "warehouse", label: "Warehouse Damage", icon: IconBuildingWarehouse },
  { value: "handling", label: "Handling Damage", icon: IconTruck },
  { value: "storage", label: "Storage Issue", icon: IconBuildingWarehouse },
];

// risk_level options
const risk_levelOptions = [
  { value: "Low", label: "Low", color: "text-green-600" },
  { value: "Medium", label: "Medium", color: "text-yellow-600" },
  { value: "High", label: "High", color: "text-red-600" },
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
  
  // Data from Firestore
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedSupplierDetails, setSelectedSupplierDetails] = useState(null);
  const [selectedWarehouseDetails, setSelectedWarehouseDetails] = useState(null);
  
  const [newReport, setNewReport] = useState({
    materialId: "",
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
    supplierId: "",
    supplierName: "",
    warehouseId: "",
    warehouseName: "",
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

  // Fetch suppliers from Firestore
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!user) return;
      
      try {
        // Fetch suppliers from root suppliers collection
        const suppliersRef = collection(db, "suppliers");
        const suppliersSnapshot = await getDocs(suppliersRef);
        const suppliersData = suppliersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSuppliers(suppliersData);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
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
        setWarehouses(warehousesData);
      } catch (error) {
        console.error("Error fetching warehouses:", error);
      }
    };
    
    fetchWarehouses();
  }, [user]);

  // Fetch raw materials from Firestore
  useEffect(() => {
    const fetchRawMaterials = async () => {
      if (!user) return;
      
      try {
        const materialsRef = collection(db, "rawMaterials", user.uid, "materials");
        const materialsSnapshot = await getDocs(materialsRef);
        const materialsData = materialsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRawMaterials(materialsData);
      } catch (error) {
        console.error("Error fetching raw materials:", error);
      }
    };
    
    fetchRawMaterials();
  }, [user]);

  // Handle material selection
  const handleMaterialSelect = (materialId) => {
    const selectedMaterialData = rawMaterials.find(m => m.id === materialId);
    if (selectedMaterialData) {
      setSelectedMaterial(selectedMaterialData);
      setNewReport(prev => ({
        ...prev,
        materialId: selectedMaterialData.id,
        materialName: selectedMaterialData.name,
        unit: selectedMaterialData.unit || "kg",
        costPerUnit: selectedMaterialData.unitPrice?.toString() || "",
        batchNumber: selectedMaterialData.batchNumber || "",
        supplierId: selectedMaterialData.supplierId || "",
        supplierName: selectedMaterialData.supplierName || "",
        warehouseId: selectedMaterialData.warehouseId || "",
        warehouseName: selectedMaterialData.warehouseName || "",
        location: selectedMaterialData.location || "",
      }));
      
      // Set supplier details
      if (selectedMaterialData.supplierId) {
        const supplier = suppliers.find(s => s.id === selectedMaterialData.supplierId);
        if (supplier) {
          setSelectedSupplierDetails(supplier);
        }
      } else {
        setSelectedSupplierDetails(null);
      }
      
      // Set warehouse details
      if (selectedMaterialData.warehouseId) {
        const warehouse = warehouses.find(w => w.id === selectedMaterialData.warehouseId);
        if (warehouse) {
          setSelectedWarehouseDetails(warehouse);
        }
      } else {
        setSelectedWarehouseDetails(null);
      }
    }
  };

  // Handle supplier selection directly
  const handleSupplierSelect = (supplierId) => {
    const selectedSupplier = suppliers.find(s => s.id === supplierId);
    if (selectedSupplier) {
      setNewReport(prev => ({
        ...prev,
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
      }));
      setSelectedSupplierDetails(selectedSupplier);
    }
  };

  // Handle warehouse selection directly
  const handleWarehouseSelect = (warehouseId) => {
    const selectedWarehouse = warehouses.find(w => w.id === warehouseId);
    if (selectedWarehouse) {
      setNewReport(prev => ({
        ...prev,
        warehouseId: selectedWarehouse.id,
        warehouseName: selectedWarehouse.name,
        location: selectedWarehouse.location,
      }));
      setSelectedWarehouseDetails(selectedWarehouse);
    }
  };

  // Firestore real-time listener - Fixed: removed orderBy to avoid index error
  useEffect(() => {
    if (!user) {
      setLoadingData(false);
      setReports([]);
      return;
    }

    setLoadingData(true);
    
    const userReportsRef = collection(db, "defectReports", user.uid, "reports");
    const q = query(userReportsRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reportsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        const sortedReports = [...reportsData].sort((a, b) => 
          new Date(b.defectDate) - new Date(a.defectDate)
        );
        
        setReports(sortedReports);
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
          r.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      "Risk Level",
      "Status",
      "Action",
    ];
    const csvData = filteredReports.map((r) => [
      r.id,
      r.materialName,
      r.defectDate,
      r.defectType,
      r.defectSource,
      r.supplierName,
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

    if (!newReport.materialId || !newReport.quantity || !newReport.costPerUnit) {
      toast.error("Please fill in all required fields");
      return;
    }

    const totalLoss = parseFloat(newReport.quantity) * parseFloat(newReport.costPerUnit);
    const reportData = {
      materialId: newReport.materialId,
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
      supplierId: newReport.supplierId,
      supplierName: newReport.supplierName,
      warehouseId: newReport.warehouseId,
      warehouseName: newReport.warehouseName,
      reportDate: new Date().toISOString().split("T")[0],
      createdAt: Timestamp.now(),
    };

    try {
      const userReportsRef = collection(db, "defectReports", user.uid, "reports");
      await addDoc(userReportsRef, reportData);
      toast.success("Defect report added successfully!");
      setDialogOpen(false);
      setNewReport({
        materialId: "",
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
        supplierId: "",
        supplierName: "",
        warehouseId: "",
        warehouseName: "",
      });
      setSelectedMaterial(null);
      setSelectedSupplierDetails(null);
      setSelectedWarehouseDetails(null);
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
     
      
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader className="relative overflow-hidden" />
          
            <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
            
            <div className="absolute top-[30%] -right-[10%] h-[400px] w-[400px] rounded-full bg-indigo-500/15 blur-[120px] " />
            <div className="absolute bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-fuchsia-600/10 blur-[100px] " />
          </div>
          
          <div className="flex-1 p-4 md:p-8 pt-6 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl lg:text-4xl tracking-tight text-foreground flex items-center gap-2">
                  <IconBug className="h-8 w-8 text-primary" />
                  Raw Material Defect Report
                </h1>
                <p className="text-muted-foreground mt-1 text-sm italic">
                  Track and analyze material defects and losses
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExportReport} className="cursor-pointer h-9">
                  <IconDownload className="mr-2 h-4 w-4" />
                  Export
                </Button>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <DialogTrigger asChild>
    <Button className="cursor-pointer h-9">
      <IconPlus className="mr-2 h-4 w-4" />
      New Report
    </Button>
  </DialogTrigger>
  
  <DialogContent 
    className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[850px] h-[90vh] max-h-[90vh] p-0 gap-0 bg-background/95 backdrop-blur-md border-border/50 flex flex-col overflow-hidden"
    showCloseButton={true}
  >
    <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50 flex-shrink-0">
      <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
        <IconBug className="h-5 w-5 text-primary" />
        Create New Defect Report
      </DialogTitle>
      <DialogDescription className="text-xs sm:text-sm">
        Enter the details of the defective material. Fields marked with * are required.
      </DialogDescription>
    </DialogHeader>

    {/* Scrollable form area */}
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 scrollbar-thin scrollbar-thumb-border/50">
      <form id="defect-form" onSubmit={(e) => { e.preventDefault(); handleSubmitNewReport(); }} className="space-y-6 sm:space-y-8 pb-4">
        
        {/* Material Selection */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-primary/80 uppercase tracking-wider">
            <IconPackage className="h-4 w-4" />
            Material Information
          </h3>
          <div className="grid gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium">Select Material *</label>
              <Select value={newReport.materialId} onValueChange={handleMaterialSelect}>
                <SelectTrigger className="w-full h-10 sm:h-11 py-6 bg-background border-border/50 text-start overflow-hidden">
                  <SelectValue placeholder="Choose a raw material..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {rawMaterials.length === 0 ? (
                    <div className="px-2 py-3 text-sm text-muted-foreground text-center">No materials found.</div>
                  ) : (
                    rawMaterials.map((material) => (
                      <SelectItem key={material.id} value={material.id} className="py-2 sm:py-3">
                        <div className="flex flex-col gap-0.5 sm:gap-1">
                          <span className="font-semibold text-xs sm:text-sm">{material.name}</span>
                          <div className="flex flex-wrap gap-1 sm:gap-2 text-[9px] sm:text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <IconBarcode className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              Batch: {material.batchNumber || "N/A"}
                            </span>
                            <span>•</span>
                            <span>Stock: {material.quantity || 0} {material.unit || "kg"}</span>
                            <span>•</span>
                            <span>Price: ${material.unitPrice || 0}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Batch Preview - Shows full material details after selection */}
            {selectedMaterial && (
              <div className="bg-primary/5 rounded-lg p-3 sm:p-4 border border-primary/10">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <p className="text-[10px] sm:text-xs font-medium text-primary uppercase tracking-wider flex items-center gap-1">
                    <IconPackage className="h-3 w-3" />
                    Batch Preview
                  </p>
                  <Badge variant="outline" className="text-[9px] sm:text-[10px]">
                    {selectedMaterial.status || "In Stock"}
                  </Badge>
                </div>
                
                {/* Material Details Grid - Responsive */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[9px] sm:text-[10px] uppercase text-muted-foreground font-bold">Batch Number</p>
                    <p className="text-[11px] sm:text-sm font-mono font-medium break-all">{selectedMaterial.batchNumber || "N/A"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] sm:text-[10px] uppercase text-muted-foreground font-bold">Unit</p>
                    <p className="text-[11px] sm:text-sm font-medium">{selectedMaterial.unit || "kg"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] sm:text-[10px] uppercase text-muted-foreground font-bold">Unit Price</p>
                    <p className="text-[11px] sm:text-sm font-medium">${selectedMaterial.unitPrice || 0}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] sm:text-[10px] uppercase text-muted-foreground font-bold">Current Stock</p>
                    <p className="text-[11px] sm:text-sm font-semibold text-primary">{selectedMaterial.quantity || 0}</p>
                  </div>
                </div>
                
                {/* Additional Material Info for xs screens */}
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-primary/10 grid grid-cols-1 gap-1 text-[10px] sm:text-xs text-muted-foreground">
                  {selectedMaterial.supplierName && (
                    <p className="flex items-center gap-1">
                      <IconBuildingStore className="h-3 w-3" />
                      Supplier: {selectedMaterial.supplierName}
                    </p>
                  )}
                  {selectedMaterial.warehouseName && (
                    <p className="flex items-center gap-1">
                      <IconBuildingWarehouse className="h-3 w-3" />
                      Warehouse: {selectedMaterial.warehouseName}
                    </p>
                  )}
                  {selectedMaterial.location && (
                    <p className="flex items-center gap-1">
                      <IconMapPin className="h-3 w-3" />
                      Location: {selectedMaterial.location}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Grid: Supplier & Warehouse side-by-side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Supplier */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <IconBuildingStore className="h-4 w-4 text-primary" />
              Supplier
            </h3>
            <Select value={newReport.supplierId} onValueChange={handleSupplierSelect}>
              <SelectTrigger className="h-10 sm:h-11 py-6">
                <SelectValue placeholder="Choose supplier..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">No suppliers found.</div>
                ) : (
                  suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="py-2">
                      <div className="flex flex-col">
                        <span className="text-sm">{s.name}</span>
                        {s.contact && <span className="text-[10px] text-muted-foreground">Contact: {s.contact}</span>}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedSupplierDetails && (
              <div className="text-[10px] sm:text-xs bg-muted/40 p-2 sm:p-3 rounded-md space-y-1 border border-border/40">
                <p className="flex items-center gap-1 sm:gap-2"><IconUser className="h-3 w-3" /> {selectedSupplierDetails.contact || "No contact"}</p>
                {selectedSupplierDetails.phone && <p className="flex items-center gap-1 sm:gap-2"><IconPhone className="h-3 w-3" /> {selectedSupplierDetails.phone}</p>}
                {selectedSupplierDetails.email && <p className="flex items-center gap-1 sm:gap-2 text-muted-foreground"><IconMail className="h-3 w-3" /> {selectedSupplierDetails.email}</p>}
              </div>
            )}
          </div>

          {/* Warehouse */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <IconBuildingWarehouse className="h-4 w-4 text-primary" />
              Warehouse
            </h3>
            <Select value={newReport.warehouseId} onValueChange={handleWarehouseSelect} className="p-5">
              <SelectTrigger className="h-10 sm:h-11 py-6">
                <SelectValue placeholder="Choose warehouse..." />
              </SelectTrigger>
              <SelectContent >
                {warehouses.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">No warehouses found.</div>
                ) : (
                  warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id} className="py-2">
                      <div className="flex flex-col">
                        <span className="text-sm">{w.name}</span>
                        <span className="text-[10px] text-muted-foreground">{w.location}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedWarehouseDetails && (
              <div className="text-[10px] sm:text-xs bg-muted/40 p-2 sm:p-3 rounded-md space-y-1 border border-border/40">
                <p className="flex items-center gap-1 sm:gap-2"><IconMapPin className="h-3 w-3" /> {selectedWarehouseDetails.location || "No location"}</p>
                {selectedWarehouseDetails.manager && <p className="text-muted-foreground ml-4 sm:ml-5">Mgr: {selectedWarehouseDetails.manager}</p>}
                {selectedWarehouseDetails.phone && <p className="flex items-center gap-1 sm:gap-2"><IconPhone className="h-3 w-3" /> {selectedWarehouseDetails.phone}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Defect Details */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <IconBug className="h-4 w-4 text-primary" />
            Defect Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Defect Date</label>
              <Input 
                name="defectDate" 
                type="date" 
                value={newReport.defectDate} 
                onChange={handleInputChange}
                className="h-10 sm:h-11"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Defect Type</label>
              <Input 
                name="defectType" 
                value={newReport.defectType} 
                onChange={handleInputChange} 
                placeholder="e.g., Quality Issue"
                className="h-10 sm:h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Defect Source</label>
              <Select value={newReport.defectSource} onValueChange={(value) => handleSelectChange("defectSource", value)}>
                <SelectTrigger className="h-10 sm:h-11">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {defectSourceOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value} className="cursor-pointer py-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                                          <span>{option.label}</span>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5 sm:space-y-2">
                              <label className="text-xs font-medium uppercase text-muted-foreground">Risk Level</label>
                              <Select value={newReport.risk_level} onValueChange={(value) => handleSelectChange("risk_level", value)}>
                                <SelectTrigger className="h-10 sm:h-11">
                                  <SelectValue placeholder="Select risk level" />
                                </SelectTrigger>
                                <SelectContent>
                                  {risk_levelOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                                      <span className={option.color}>{option.label}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Quantity and Cost */}
                        <div className="space-y-3 sm:space-y-4">
                          <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                            <IconCurrencyDollar className="h-4 w-4 text-primary" />
                            Quantity & Cost
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div className="space-y-1.5 sm:space-y-2">
                              <label className="text-xs font-medium uppercase text-muted-foreground">Qty Defective *</label>
                              <Input 
                                name="quantity" 
                                type="number" 
                                step="0.01"
                                value={newReport.quantity} 
                                onChange={handleInputChange} 
                                placeholder="0.00"
                                className="h-10 sm:h-11"
                                required 
                              />
                            </div>
                            <div className="space-y-1.5 sm:space-y-2">
                              <label className="text-xs font-medium uppercase text-muted-foreground">Unit</label>
                              <Input 
                                value={newReport.unit} 
                                disabled 
                                className="h-10 sm:h-11 bg-muted/30"
                              />
                            </div>
                            <div className="space-y-1.5 sm:space-y-2">
                              <label className="text-xs font-medium uppercase text-muted-foreground">Estimated Loss</label>
                              <div className="h-10 sm:h-11 px-3 rounded-md border bg-destructive/5 border-destructive/20 flex items-center text-sm sm:text-base font-bold text-destructive">
                                ${((parseFloat(newReport.quantity) || 0) * (parseFloat(newReport.costPerUnit) || 0)).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2 sm:space-y-3">
                          <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                            <IconBug className="h-4 w-4 text-primary" />
                            Description
                          </h3>
                          <Textarea 
                            name="description" 
                            value={newReport.description} 
                            onChange={handleInputChange} 
                            placeholder="Describe the defect in detail..."
                            rows={3}
                            className="min-h-[80px] sm:min-h-[100px] bg-background resize-none text-sm"
                          />
                        </div>

                        {/* Action Taken */}
                        <div className="space-y-2 sm:space-y-3">
                          <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                            <IconTruck className="h-4 w-4 text-primary" />
                            Action Taken
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-1.5 sm:space-y-2">
                              <label className="text-xs font-medium uppercase text-muted-foreground">Status</label>
                              <Select value={newReport.status} onValueChange={(value) => handleSelectChange("status", value)}>
                                <SelectTrigger className="h-10 sm:h-11">
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
                            <div className="space-y-1.5 sm:space-y-2">
                              <label className="text-xs font-medium uppercase text-muted-foreground">Reported By</label>
                              <Input 
                                name="reportedBy" 
                                value={newReport.reportedBy} 
                                onChange={handleInputChange} 
                                placeholder="Your name"
                                className="h-10 sm:h-11"
                              />
                            </div>
                          </div>
                          <Textarea 
                            name="actionTaken" 
                            value={newReport.actionTaken} 
                            onChange={handleInputChange} 
                            placeholder="What action has been taken to address this defect?"
                            rows={2}
                            className="resize-none text-sm"
                          />
                        </div>
                      </form>
                    </div>

                    <DialogFooter className="px-4 sm:px-6 pb-8 border-t border-border/50 bg-muted/20 flex-shrink-0">
                      
                      <Button variant="ghost" onClick={() => setDialogOpen(false)} className="h-8 cursor-pointer">
                        Cancel
                      </Button>
                      <Button type="submit" form="defect-form" className="px-4  h-8 cursor-pointer">
                        <IconPlus className="mr-2 h-4 w-4" />
                        Create Report
                      </Button>
                    </DialogFooter>
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
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Defects</CardTitle>
                    <IconBug className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold mt-2">{stats.totalDefects}</div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-xs">
                    <Badge className="bg-red-500/10 text-red-600 border-red-500/20 px-1.5 py-0 text-[10px]">{stats.openCount} Open</Badge>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-1.5 py-0 text-[10px]">{stats.resolvedCount} Resolved</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Total defect reports</p>
                </CardContent>
              </Card>

              {/* Total Loss Card */}
              <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Loss</CardTitle>
                    <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold mt-2 text-destructive">${stats.totalLoss.toLocaleString()}</div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-[10px] text-muted-foreground mt-2">Financial impact from defects</p>
                </CardContent>
              </Card>

              {/* Supplier Defects Card */}
              <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Supplier Defects</CardTitle>
                    <IconBuildingStore className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold mt-2">{stats.supplierDefects}</div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground">Loss: ${stats.supplierLoss.toLocaleString()}</div>
                  <p className="text-[10px] text-muted-foreground mt-2">Defects from supplier quality</p>
                </CardContent>
              </Card>

              {/* Warehouse Damage Card */}
              <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Warehouse Damage</CardTitle>
                    <IconBuildingWarehouse className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold mt-2">{stats.warehouseDefects}</div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground">Loss: ${stats.warehouseLoss.toLocaleString()}</div>
                  <p className="text-[10px] text-muted-foreground mt-2">Damage during storage/handling</p>
                </CardContent>
              </Card>
            </div>

            {/* Search, Filters, and Sort */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    placeholder="Search by material, supplier, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-11 w-full bg-background/80 backdrop-blur-sm border-border/50"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[130px] h-11 bg-background/80 backdrop-blur-sm border-border/50">
                      <IconCalendar className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90d">Last 3 months</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-[130px] h-11 bg-background/80 backdrop-blur-sm border-border/50">
                      <IconTruck className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="handling">Handling</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={risk_levelFilter} onValueChange={setrisk_levelFilter}>
                    <SelectTrigger className="w-[110px] h-11 bg-background/80 backdrop-blur-sm border-border/50">
                      <IconBug className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Risk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px] h-11 bg-background/80 backdrop-blur-sm border-border/50">
                      <IconSortAscending className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                      <SelectItem value="highest-loss">Highest loss</SelectItem>
                      <SelectItem value="lowest-loss">Lowest loss</SelectItem>
                      <SelectItem value="risk_level">Risk Level</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateRange("90d");
                      setSourceFilter("all");
                      setrisk_levelFilter("all");
                      setSearchQuery("");
                      setSortBy("newest");
                    }}
                    className="h-11 px-3 bg-background/80 backdrop-blur-sm border-border/50"
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
                    <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm border-border/50">
                      <IconCalendar className="h-3 w-3" />
                      {dateRange === "7d" ? "Last 7 days" : "Last 30 days"}
                      <button onClick={() => setDateRange("90d")} className="ml-1 hover:text-destructive"><IconX className="h-3 w-3" /></button>
                    </Badge>
                  )}
                  {sourceFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm border-border/50">
                      <IconTruck className="h-3 w-3" />
                      Source: {sourceFilter}
                      <button onClick={() => setSourceFilter("all")} className="ml-1 hover:text-destructive"><IconX className="h-3 w-3" /></button>
                    </Badge>
                  )}
                  {risk_levelFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm border-border/50">
                      <IconBug className="h-3 w-3" />
                      Risk: {risk_levelFilter}
                      <button onClick={() => setrisk_levelFilter("all")} className="ml-1 hover:text-destructive"><IconX className="h-3 w-3" /></button>
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-medium">Defect Reports</h2>
                <Badge variant="outline" className="px-2 py-0 h-6 bg-background/80 backdrop-blur-sm border-border/50">
                  {filteredReports.length} {filteredReports.length === 1 ? "report" : "reports"}
                </Badge>
              </div>
            </div>

            {/* DataTable */}
            <Card className="bg-background/40 backdrop-blur-sm border-border/50">
              <CardContent className="p-0 sm:p-6">
                <DefectReportTable
                  data={filteredReports}
                  onUpdate={handleUpdateReport}
                  onDelete={handleDeleteReport}
                />
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}