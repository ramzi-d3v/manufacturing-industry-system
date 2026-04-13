// app/energy/consumption/page.jsx
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
  IconBolt,
  IconGasStation,
  IconChartBar,
  IconCalendar,
  IconFilter,
  IconDownload,
  IconSearch,
  IconPlus,
  IconRefresh,
  IconCurrencyDollar,
  IconMapPin,
  IconUser,
  IconNotes,
  IconX,
  IconLoader,
  IconArrowUp,
  IconArrowDown,
  IconTrendingUp,
  IconTrendingDown,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { db, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EnergyConsumptionTable } from "@/components/energy-consumption-table";

// Energy types
const energyTypes = [
  { value: "electricity", label: "Electricity", icon: IconBolt, color: "#eab308", bgLight: "bg-yellow-500/10", borderLight: "border-yellow-500/20" },
  { value: "fuel", label: "Fuel", icon: IconGasStation, color: "#f97316", bgLight: "bg-orange-500/10", borderLight: "border-orange-500/20" },
  { value: "gas", label: "Natural Gas", icon: IconBolt, color: "#3b82f6", bgLight: "bg-blue-500/10", borderLight: "border-blue-500/20" },
  { value: "diesel", label: "Diesel", icon: IconGasStation, color: "#a855f7", bgLight: "bg-purple-500/10", borderLight: "border-purple-500/20" },
];

const fuelTypes = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "cng", label: "CNG" },
  { value: "lpg", label: "LPG" },
  { value: "heavy_fuel_oil", label: "Heavy Fuel Oil" },
];

const units = {
  electricity: "kWh",
  fuel: "liters",
  gas: "m³",
  diesel: "liters",
};

const defaultCosts = {
  electricity: 0.15,
  fuel: 1.20,
  gas: 0.50,
  diesel: 1.10,
};

const dateRangeOptions = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

const sortOptions = [
  { value: "desc", label: "Newest First" },
  { value: "asc", label: "Oldest First" },
];

// Add Record Dialog
function AddRecordDialog({ open, onOpenChange, onSave, user }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    energyType: "electricity",
    fuelType: "",
    consumption: "",
    unit: "kWh",
    costPerUnit: defaultCosts.electricity.toString(),
    cost: "",
    machine: "",
    area: "",
    recordedBy: user?.displayName || user?.email?.split('@')[0] || "",
    notes: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "consumption" || name === "costPerUnit") {
      const consumption = name === "consumption" ? parseFloat(value) : parseFloat(formData.consumption);
      const costPerUnit = name === "costPerUnit" ? parseFloat(value) : parseFloat(formData.costPerUnit);
      if (!isNaN(consumption) && !isNaN(costPerUnit)) {
        setFormData(prev => ({ ...prev, cost: (consumption * costPerUnit).toFixed(2) }));
      }
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "energyType") {
      const unit = units[value] || "kWh";
      const defaultCost = defaultCosts[value] || 0;
      setFormData(prev => ({ 
        ...prev, 
        unit, 
        costPerUnit: defaultCost.toString(),
        fuelType: value === "fuel" || value === "diesel" ? "diesel" : "",
        cost: prev.consumption ? (parseFloat(prev.consumption) * defaultCost).toFixed(2) : ""
      }));
    }
  };

  const handleSubmit = () => {
    if (!formData.date || !formData.energyType || !formData.consumption) {
      toast.error("Please fill all required fields");
      return;
    }
    onSave(formData);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      energyType: "electricity",
      fuelType: "",
      consumption: "",
      unit: "kWh",
      costPerUnit: defaultCosts.electricity.toString(),
      cost: "",
      machine: "",
      area: "",
      recordedBy: user?.displayName || user?.email?.split('@')[0] || "",
      notes: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] md:w-[85vw] md:max-w-[85vw] lg:w-[80vw] lg:max-w-[80vw] xl:w-[75vw] xl:max-w-[75vw] max-h-[90vh] p-4 sm:p-6 gap-4 bg-background/95 backdrop-blur-md border-border/50 overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <IconPlus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Add Energy Record
          </DialogTitle>
          <DialogDescription>Record new energy consumption data.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
              <IconBolt className="h-4 w-4 text-primary" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Date *</Label>
                <Input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="h-11 bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Energy Type *</Label>
                <Select
                  value={formData.energyType}
                  onValueChange={(value) => handleSelectChange("energyType", value)}
                >
                  <SelectTrigger className="h-11 bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {energyTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(formData.energyType === "fuel" || formData.energyType === "diesel") && (
                <div className="space-y-2">
                  <Label className="text-sm">Fuel Type</Label>
                  <Select
                    value={formData.fuelType}
                    onValueChange={(value) => handleSelectChange("fuelType", value)}
                  >
                    <SelectTrigger className="h-11 bg-background/50">
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelTypes.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
              <IconChartBar className="h-4 w-4 text-primary" />
              Consumption & Cost
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Consumption ({formData.unit}) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  name="consumption"
                  value={formData.consumption}
                  onChange={handleInputChange}
                  className="h-11 bg-background/50"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Cost per Unit ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  name="costPerUnit"
                  value={formData.costPerUnit}
                  onChange={handleInputChange}
                  className="h-11 bg-background/50"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Total Cost</Label>
                <Input
                  type="text"
                  value={formData.cost ? `$${formData.cost}` : "$0.00"}
                  readOnly
                  className="h-11 bg-amber-500/10 font-semibold text-amber-500 border-amber-500/20"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
              <IconMapPin className="h-4 w-4 text-primary" />
              Location Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Machine/Equipment</Label>
                <Input
                  name="machine"
                  value={formData.machine}
                  onChange={handleInputChange}
                  className="h-11 bg-background/50"
                  placeholder="e.g., Production Line A, Boiler #2"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Area/Department</Label>
                <Input
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className="h-11 bg-background/50"
                  placeholder="e.g., Manufacturing, Warehouse"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
              <IconUser className="h-4 w-4 text-primary" />
              Additional Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Recorded By</Label>
                <Input
                  name="recordedBy"
                  value={formData.recordedBy}
                  onChange={handleInputChange}
                  className="h-11 bg-background/50"
                  placeholder="Name of person recording this entry"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Notes</Label>
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="bg-background/50 resize-none"
                  placeholder="Additional comments or observations..."
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600">
            <IconPlus className="mr-2 h-4 w-4" />
            Add Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EnergyConsumptionPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("30d");
  const [energyTypeFilter, setEnergyTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  
  const [stats, setStats] = useState({
    totalConsumption: 0,
    totalCost: 0,
    electricityConsumption: 0,
    electricityCost: 0,
    fuelConsumption: 0,
    fuelCost: 0,
    gasConsumption: 0,
    gasCost: 0,
    avgCostPerUnit: 0,
    avgDailyCost: 0,
  });

  const getEnergyRecordsRef = (userId) => collection(db, "energy", userId, "records");

  // Fetch data
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(getEnergyRecordsRef(user.uid), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        const dateVal = d.date?.toDate ? d.date.toDate() : new Date(d.date);
        return { id: doc.id, ...d, date: dateVal, dateDisplay: dateVal.toLocaleDateString() };
      });
      setRecords(data);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error(err);
      setError("Failed to load energy data");
      toast.error("Failed to load data");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Filter & stats
  useEffect(() => {
    let filtered = [...records];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.energyType?.toLowerCase().includes(q) || 
        r.machine?.toLowerCase().includes(q) || 
        r.area?.toLowerCase().includes(q) || 
        r.recordedBy?.toLowerCase().includes(q)
      );
    }
    
    if (energyTypeFilter !== "all") {
      filtered = filtered.filter(r => r.energyType === energyTypeFilter);
    }
    
    const now = new Date();
    if (dateRange === "7d") {
      const cutoff = new Date(now.setDate(now.getDate() - 7));
      filtered = filtered.filter(r => r.date >= cutoff);
    } else if (dateRange === "30d") {
      const cutoff = new Date(now.setDate(now.getDate() - 30));
      filtered = filtered.filter(r => r.date >= cutoff);
    } else if (dateRange === "90d") {
      const cutoff = new Date(now.setDate(now.getDate() - 90));
      filtered = filtered.filter(r => r.date >= cutoff);
    }
    
    filtered.sort((a, b) => sortOrder === "desc" ? b.date - a.date : a.date - b.date);
    setFilteredRecords(filtered);

    const totalConsumption = filtered.reduce((s, r) => s + (r.consumption || 0), 0);
    const totalCost = filtered.reduce((s, r) => s + (r.cost || 0), 0);
    const electricity = filtered.filter(r => r.energyType === "electricity");
    const fuel = filtered.filter(r => r.energyType === "fuel" || r.energyType === "diesel");
    const gas = filtered.filter(r => r.energyType === "gas");
    
    const daysInRange = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 30;
    
    setStats({
      totalConsumption,
      totalCost,
      electricityConsumption: electricity.reduce((s, r) => s + (r.consumption || 0), 0),
      electricityCost: electricity.reduce((s, r) => s + (r.cost || 0), 0),
      fuelConsumption: fuel.reduce((s, r) => s + (r.consumption || 0), 0),
      fuelCost: fuel.reduce((s, r) => s + (r.cost || 0), 0),
      gasConsumption: gas.reduce((s, r) => s + (r.consumption || 0), 0),
      gasCost: gas.reduce((s, r) => s + (r.cost || 0), 0),
      avgCostPerUnit: totalConsumption > 0 ? totalCost / totalConsumption : 0,
      avgDailyCost: totalCost / daysInRange,
    });
  }, [records, searchQuery, dateRange, energyTypeFilter, sortOrder]);

  const handleAddRecord = async (formData) => {
    if (!user) return;
    const consumption = parseFloat(formData.consumption);
    const costPerUnit = parseFloat(formData.costPerUnit);
    const recordData = {
      date: Timestamp.fromDate(new Date(formData.date)),
      energyType: formData.energyType,
      fuelType: formData.fuelType || null,
      consumption,
      unit: formData.unit,
      costPerUnit,
      cost: consumption * costPerUnit,
      machine: formData.machine || null,
      area: formData.area || null,
      recordedBy: formData.recordedBy || user.displayName || user.email?.split('@')[0] || "System",
      notes: formData.notes || null,
      createdAt: Timestamp.now(),
    };
    try {
      await addDoc(getEnergyRecordsRef(user.uid), recordData);
      toast.success("Record added successfully!");
    } catch (error) {
      toast.error("Failed to add record");
      console.error(error);
    }
  };

  const handleUpdateRecord = async (updatedRecord) => {
    if (!user || !updatedRecord.id) return;
    const consumption = parseFloat(updatedRecord.consumption);
    const costPerUnit = parseFloat(updatedRecord.costPerUnit);
    const updateData = {
      date: Timestamp.fromDate(new Date(updatedRecord.date)),
      energyType: updatedRecord.energyType,
      fuelType: updatedRecord.fuelType || null,
      consumption,
      unit: updatedRecord.unit,
      costPerUnit,
      cost: consumption * costPerUnit,
      machine: updatedRecord.machine || null,
      area: updatedRecord.area || null,
      recordedBy: updatedRecord.recordedBy || null,
      notes: updatedRecord.notes || null,
      updatedAt: Timestamp.now(),
    };
    try {
      await updateDoc(doc(db, "energy", user.uid, "records", updatedRecord.id), updateData);
      toast.success("Record updated successfully!");
    } catch (error) {
      toast.error("Failed to update record");
      console.error(error);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!user || !id) return;
    try {
      await deleteDoc(doc(db, "energy", user.uid, "records", id));
      toast.success("Record deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete record");
      console.error(error);
    }
  };

  const handleExport = () => {
    const headers = ["Date", "Energy Type", "Fuel Type", "Consumption", "Unit", "Cost", "Rate", "Machine/Area", "Recorded By", "Notes"];
    const rows = filteredRecords.map(r => [
      r.dateDisplay, 
      r.energyType, 
      r.fuelType || "", 
      r.consumption, 
      r.unit, 
      r.cost, 
      r.costPerUnit, 
      r.machine || r.area || "", 
      r.recordedBy, 
      r.notes || ""
    ]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `energy-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export started");
  };

  const resetFilters = () => {
    setSearchQuery("");
    setEnergyTypeFilter("all");
    setDateRange("30d");
    setSortOrder("desc");
  };

  if (loadingAuth || loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex-1 p-8 flex items-center justify-center">
            <div className="text-center">
              <IconLoader className="animate-spin text-slate-700" size={32} />
              <p className="mt-2 text-muted-foreground">Loading energy data...</p>
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
                <CardDescription>Please log in to view energy consumption data.</CardDescription>
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
        
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute top-[30%] -right-[10%] h-[400px] w-[400px] rounded-full bg-yellow-500/15 blur-[120px] animate-pulse delay-1000" />
          <div className="absolute bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-amber-600/10 blur-[100px] animate-pulse delay-2000" />
        </div>
        
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                <IconBolt className="h-8 w-8 text-yellow-500" />
                Energy Consumption
              </h2>
              <p className="text-muted-foreground">
                Track electricity, fuel, and gas usage across your facilities
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExport} variant="outline" className="cursor-pointer">
                <IconDownload className="mr-2 h-4 w-4" />
                Download Report
              </Button>
              <Button 
                onClick={() => setAddDialogOpen(true)} 
                className="cursor-pointer bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
              >
                <IconPlus className="mr-2 h-4 w-4" />
                Add Record
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Consumption
                  </CardTitle>
                  <IconChartBar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold mt-2">
                  {stats.totalConsumption.toLocaleString()}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-1.5 py-0 text-[10px]">
                      {stats.electricityConsumption.toLocaleString()} kWh
                    </Badge>
                    <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 px-1.5 py-0 text-[10px]">
                      {stats.fuelConsumption.toLocaleString()} L
                    </Badge>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Combined all energy types
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Cost
                  </CardTitle>
                  <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold mt-2 text-primary">
                  ${stats.totalCost.toLocaleString()}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    {stats.avgCostPerUnit > 1 ? (
                      <IconTrendingUp className="h-3 w-3 text-yellow-500" />
                    ) : stats.avgCostPerUnit > 0 ? (
                      <IconTrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <IconTrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-muted-foreground">
                      Avg ${stats.avgCostPerUnit.toFixed(2)}/unit
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    <span>${stats.avgDailyCost.toFixed(2)}/day</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Total energy expenditure
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Electricity
                  </CardTitle>
                  <IconBolt className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold mt-2">
                  {stats.electricityConsumption.toLocaleString()}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-1.5 py-0 text-[10px]">
                      kWh
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">
                    ${stats.electricityCost.toLocaleString()}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  @ ${defaultCosts.electricity}/kWh avg
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background/40 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Fuel & Gas
                  </CardTitle>
                  <IconGasStation className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold mt-2">
                  {(stats.fuelConsumption + stats.gasConsumption).toLocaleString()}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 px-1.5 py-0 text-[10px]">
                      {stats.fuelConsumption.toLocaleString()} L
                    </Badge>
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 px-1.5 py-0 text-[10px]">
                      {stats.gasConsumption.toLocaleString()} m³
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">
                    ${(stats.fuelCost + stats.gasCost).toLocaleString()}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Combined fuel and gas usage
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
                  placeholder="Search by energy type, machine, area, or recorded by..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 w-full bg-background/80 backdrop-blur-sm"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Select value={energyTypeFilter} onValueChange={setEnergyTypeFilter}>
                  <SelectTrigger className="w-[140px] h-10 cursor-pointer bg-background/80 backdrop-blur-sm">
                    <IconFilter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Energy Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="cursor-pointer">All Types</SelectItem>
                    {energyTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="cursor-pointer">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

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

                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[140px] h-10 cursor-pointer bg-background/80 backdrop-blur-sm">
                    <IconArrowUp className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort" />
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

            {(searchQuery || energyTypeFilter !== "all" || dateRange !== "30d") && (
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
                {energyTypeFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm">
                    <IconFilter className="h-3 w-3" />
                    Type: {energyTypes.find(t => t.value === energyTypeFilter)?.label}
                    <button onClick={() => setEnergyTypeFilter("all")} className="ml-1 hover:text-destructive">
                      <IconX className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {dateRange !== "30d" && (
                  <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm">
                    <IconCalendar className="h-3 w-3" />
                    Range: {dateRangeOptions.find(o => o.value === dateRange)?.label}
                    <button onClick={() => setDateRange("30d")} className="ml-1 hover:text-destructive">
                      <IconX className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium">Consumption Records</h2>
              <Badge variant="outline" className="px-2 py-0 h-6 bg-background/80 backdrop-blur-sm">
                {filteredRecords.length} {filteredRecords.length === 1 ? "record" : "records"}
              </Badge>
            </div>
          </div>

          {/* Main Content - Using the new EnergyConsumptionTable */}
          <Card className="bg-background/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Energy Consumption Records</CardTitle>
              <CardDescription>
                Track and manage all energy consumption entries. Drag to reorder, select rows, and use the dropdown menu for actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnergyConsumptionTable 
                data={filteredRecords} 
                onUpdate={handleUpdateRecord}
                onDelete={handleDeleteRecord}
              />
            </CardContent>
          </Card>
        </div>

        <AddRecordDialog 
          open={addDialogOpen} 
          onOpenChange={setAddDialogOpen} 
          onSave={handleAddRecord}
          user={user}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}