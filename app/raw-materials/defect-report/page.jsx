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

  // Fetch suppliers from suppliers/{userId}/list subcollection
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!user) return;
      
      try {
        // Fetch suppliers from user-specific subcollection: suppliers/{userId}/list
        const suppliersRef = collection(db, "suppliers", user.uid, "list");
        const suppliersSnapshot = await getDocs(suppliersRef);
        const suppliersData = suppliersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSuppliers(suppliersData);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        toast.error("Failed to load suppliers");
      }
    };
    
    fetchSuppliers();
  }, [user]);

  // Fetch warehouses from warehouses/{userId}/list
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
        toast.error("Failed to load warehouses");
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
        toast.error("Failed to load raw materials");
      }
    };
    
    fetchRawMaterials();
  }, [user]);

  // Update the handleMaterialSelect function
const handleMaterialSelect = (materialId) => {
  const selectedMaterialData = rawMaterials.find(m => m.id === materialId);
  if (selectedMaterialData) {
    setSelectedMaterial(selectedMaterialData);
    setNewReport(prev => ({
      ...prev,
      materialId: selectedMaterialData.id, // Keep ID for form submission
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
    
    // Set supplier and warehouse details
    if (selectedMaterialData.supplierId) {
      const supplier = suppliers.find(s => s.id === selectedMaterialData.supplierId);
      if (supplier) setSelectedSupplierDetails(supplier);
    }
    if (selectedMaterialData.warehouseId) {
      const warehouse = warehouses.find(w => w.id === selectedMaterialData.warehouseId);
      if (warehouse) setSelectedWarehouseDetails(warehouse);
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
    className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[900px] h-[90vh] max-h-[90vh] p-0 gap-0 bg-background flex flex-col overflow-hidden"
    showCloseButton={true}
  >
    <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
      <DialogTitle className="text-xl flex items-center gap-2">
        <IconBug className="h-5 w-5" />
        Create Defect Report
      </DialogTitle>
      <DialogDescription className="text-sm text-muted-foreground">
        Record defective material details for tracking and analysis.
      </DialogDescription>
    </DialogHeader>

    {/* Scrollable form area */}
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <form id="defect-form" onSubmit={(e) => { e.preventDefault(); handleSubmitNewReport(); }} className="space-y-6">
        
        {/* Material Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <IconPackage className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Material Information</h3>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Material *</label>
            <Select onValueChange={handleMaterialSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a raw material..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {rawMaterials.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">No materials found.</div>
                ) : (
                  rawMaterials.map((material) => (
                    <SelectItem key={material.id} value={material.id} className="py-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{material.name}</span>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>Batch: {material.batchNumber || "N/A"}</span>
                          <span>•</span>
                          <span>Stock: {material.quantity || 0} {material.unit || "kg"}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Material Details Preview - Only shown after selection */}
          {selectedMaterial && (
            <div className="border rounded-md p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Selected Material Details</span>
                <Badge variant="outline" className="text-xs">
                  {selectedMaterial.status || "In Stock"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Material Name</p>
                  <p className="text-sm font-medium mt-0.5">{selectedMaterial.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Batch Number</p>
                  <p className="text-sm font-mono mt-0.5">{selectedMaterial.batchNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unit</p>
                  <p className="text-sm font-medium mt-0.5">{selectedMaterial.unit || "kg"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unit Price</p>
                  <p className="text-sm font-medium mt-0.5">${selectedMaterial.unitPrice || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Stock</p>
                  <p className="text-sm font-medium mt-0.5">{selectedMaterial.quantity || 0}</p>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                {selectedMaterial.supplierName && (
                  <p>Supplier: {selectedMaterial.supplierName}</p>
                )}
                {selectedMaterial.warehouseName && (
                  <p>Warehouse: {selectedMaterial.warehouseName}</p>
                )}
                {selectedMaterial.location && (
                  <p>Location: {selectedMaterial.location}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Supplier & Warehouse - Two Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Supplier */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <IconBuildingStore className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Supplier</h3>
            </div>
            
            <Select onValueChange={handleSupplierSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">No suppliers found.</div>
                ) : (
                  suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex flex-col">
                        <span>{s.name}</span>
                        {s.contact && <span className="text-xs text-muted-foreground">{s.contact}</span>}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            {selectedSupplierDetails && (
              <div className="border rounded-md p-3 space-y-1 text-sm">
                <p className="font-medium">{selectedSupplierDetails.name}</p>
                {selectedSupplierDetails.contact && (
                  <p className="flex items-center gap-2 mt-2">
                    <IconUser className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{selectedSupplierDetails.contact}</span>
                  </p>
                )}
                {selectedSupplierDetails.phone && (
                  <p className="flex items-center gap-2">
                    <IconPhone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{selectedSupplierDetails.phone}</span>
                  </p>
                )}
                {selectedSupplierDetails.email && (
                  <p className="flex items-center gap-2">
                    <IconMail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{selectedSupplierDetails.email}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Warehouse */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <IconBuildingWarehouse className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Warehouse</h3>
            </div>
            
            <Select onValueChange={handleWarehouseSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse..." />
              </SelectTrigger>
              <SelectContent>
                {warehouses.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">No warehouses found.</div>
                ) : (
                  warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      <div className="flex flex-col">
                        <span>{w.name}</span>
                        <span className="text-xs text-muted-foreground">{w.location}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            {selectedWarehouseDetails && (
              <div className="border rounded-md p-3 space-y-1 text-sm">
                <p className="font-medium">{selectedWarehouseDetails.name}</p>
                <p className="flex items-center gap-2 mt-2">
                  <IconMapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{selectedWarehouseDetails.location || "No location"}</span>
                </p>
                {selectedWarehouseDetails.manager && (
                  <p className="text-muted-foreground pl-5">Manager: {selectedWarehouseDetails.manager}</p>
                )}
                {selectedWarehouseDetails.phone && (
                  <p className="flex items-center gap-2">
                    <IconPhone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{selectedWarehouseDetails.phone}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Defect Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <IconBug className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Defect Details</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Defect Date</label>
              <Input 
                name="defectDate" 
                type="date" 
                value={newReport.defectDate} 
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Defect Type</label>
              <Input 
                name="defectType" 
                value={newReport.defectType} 
                onChange={handleInputChange} 
                placeholder="e.g., Quality Issue, Physical Damage"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Defect Source</label>
              <Select value={newReport.defectSource} onValueChange={(value) => handleSelectChange("defectSource", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {defectSourceOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Risk Level</label>
              <Select value={newReport.risk_level} onValueChange={(value) => handleSelectChange("risk_level", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  {risk_levelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className={option.color}>{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Quantity & Cost */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Quantity & Cost</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Defective Quantity *</label>
              <Input 
                name="quantity" 
                type="number" 
                step="0.01"
                value={newReport.quantity} 
                onChange={handleInputChange} 
                placeholder="0.00"
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit</label>
              <Input value={newReport.unit} disabled className="bg-muted/30" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estimated Loss</label>
              <div className="px-3 py-2 rounded-md border bg-muted/30 text-sm font-medium">
                ${((parseFloat(newReport.quantity) || 0) * (parseFloat(newReport.costPerUnit) || 0)).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea 
            name="description" 
            value={newReport.description} 
            onChange={handleInputChange} 
            placeholder="Describe the defect in detail including any relevant observations..."
            rows={3}
          />
        </div>

        {/* Action Taken */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <IconTruck className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Action Taken</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={newReport.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reported By</label>
              <Input 
                name="reportedBy" 
                value={newReport.reportedBy} 
                onChange={handleInputChange} 
                placeholder="Your name"
              />
            </div>
          </div>
          
          <Textarea 
            name="actionTaken" 
            value={newReport.actionTaken} 
            onChange={handleInputChange} 
            placeholder="Describe the actions taken to address this defect..."
            rows={2}
          />
        </div>
      </form>
    </div>

    <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
      <Button variant="outline" onClick={() => setDialogOpen(false)}>
        Cancel
      </Button>
      <Button type="submit" form="defect-form">
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