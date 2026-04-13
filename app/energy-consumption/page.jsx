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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  IconBolt,
  IconGasStation,
  IconChartBar,
  IconCalendar,
  IconFilter,
  IconDownload,
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconCurrencyDollar,
  IconBuildingFactory,
  IconFileReport,
  IconFlame,
  IconMapPin,
  IconUser,
  IconNotes,
  IconX,
  IconLoader,
  IconZzz,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react";
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

// Energy types
const energyTypes = [
  { value: "electricity", label: "Electricity", icon: IconBolt, color: "#eab308", bgLight: "bg-yellow-500/10", borderLight: "border-yellow-500/20" },
  { value: "fuel", label: "Fuel", icon: IconGasStation, color: "#f97316", bgLight: "bg-orange-500/10", borderLight: "border-orange-500/20" },
  { value: "gas", label: "Natural Gas", icon: IconFlame, color: "#3b82f6", bgLight: "bg-blue-500/10", borderLight: "border-blue-500/20" },
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

// Stat Card Component
const StatCard = ({ title, value, unit, subtitle, footerTitle, footerSubtitle, icon: Icon, color, trend }) => (
  <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
    <div className={`absolute top-0 right-0 h-20 w-20 rounded-full blur-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100`} style={{ backgroundColor: `${color}20` }} />
    <CardHeader className="pb-2 pt-4">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`rounded-lg p-2 transition-transform duration-300 group-hover:scale-110`} style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </CardHeader>
    <CardContent className="pb-3">
      <div className="text-2xl font-bold tracking-tight text-foreground">
        {value} <span className="text-xs font-mono text-muted-foreground">{unit}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </CardContent>
    <CardFooter className="border-t border-white/5 pt-2 pb-3">
      <div className="flex w-full justify-between text-xs">
        <span className="text-muted-foreground">{footerTitle}</span>
        <span className="font-mono text-xs text-foreground/80">{footerSubtitle}</span>
      </div>
    </CardFooter>
  </Card>
);

// Data Table Component
const EnergyTable = ({ data, onView, onEdit, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = data.slice(startIndex, startIndex + itemsPerPage);

  const getEnergyTypeStyle = (type) => energyTypes.find(t => t.value === type) || energyTypes[0];

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted/30 p-3 mb-3"><IconZzz className="h-6 w-6 text-muted-foreground" /></div>
        <h3 className="text-base font-semibold text-foreground">No records yet</h3>
        <p className="text-sm text-muted-foreground mt-1">Add your first energy consumption record</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border/50 bg-muted/20">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">DATE</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">TYPE</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">CONSUMPTION</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">COST</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">LOCATION</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {currentData.map((record) => {
              const style = getEnergyTypeStyle(record.energyType);
              const Icon = style.icon;
              return (
                <tr key={record.id} className="group transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3 text-sm">{record.dateDisplay}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`rounded p-1 ${style.bgLight}`}><Icon className="h-4 w-4" style={{ color: style.color }} /></div>
                      <span className="text-sm capitalize font-medium">{record.energyType}</span>
                      {record.fuelType && <Badge variant="outline" className="text-xs">{record.fuelType}</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-sm font-medium">{record.consumption.toLocaleString()} <span className="font-mono text-muted-foreground text-xs">{record.unit}</span></span></td>
                  <td className="px-4 py-3"><span className="text-sm font-semibold text-amber-500">${record.cost.toLocaleString()}</span><span className="ml-1 text-xs text-muted-foreground">@ ${record.costPerUnit}/{record.unit}</span></td>
                  <td className="px-4 py-3 text-sm">{record.machine || record.area || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onView(record)} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-blue-500" title="View"><IconFileReport className="h-4 w-4" /></button>
                      <button onClick={() => onEdit(record)} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-blue-500" title="Edit"><IconEdit className="h-4 w-4" /></button>
                      <button onClick={() => onDelete(record.id)} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-red-500" title="Delete"><IconTrash className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
          <div className="text-sm text-muted-foreground">Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, data.length)} of {data.length}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="cursor-pointer">Previous</Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              return (
                <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(pageNum)} className={`cursor-pointer ${currentPage === pageNum ? "bg-gradient-to-r from-yellow-500 to-amber-500" : ""}`}>{pageNum}</Button>
              );
            })}
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="cursor-pointer">Next</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Dialog
const Dialog = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-gradient-to-br from-background to-muted/20 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 flex items-center justify-between border-b border-border/50 bg-background/80 px-6 py-4 backdrop-blur-sm">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted"><IconX className="h-5 w-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default function EnergyConsumptionPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("30d");
  const [energyTypeFilter, setEnergyTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Form state
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
    recordedBy: "",
    notes: "",
  });

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
    }, (err) => {
      console.error(err);
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
      filtered = filtered.filter(r => r.energyType?.toLowerCase().includes(q) || r.machine?.toLowerCase().includes(q) || r.area?.toLowerCase().includes(q) || r.recordedBy?.toLowerCase().includes(q));
    }
    if (energyTypeFilter !== "all") filtered = filtered.filter(r => r.energyType === energyTypeFilter);
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
    });
  }, [records, searchQuery, dateRange, energyTypeFilter, sortOrder]);

  // Handlers (unchanged)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "consumption" || name === "costPerUnit") {
      const consumption = name === "consumption" ? parseFloat(value) : parseFloat(formData.consumption);
      const costPerUnit = name === "costPerUnit" ? parseFloat(value) : parseFloat(formData.costPerUnit);
      if (!isNaN(consumption) && !isNaN(costPerUnit)) setFormData(prev => ({ ...prev, cost: (consumption * costPerUnit).toFixed(2) }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "energyType") {
      const unit = units[value] || "kWh";
      const defaultCost = defaultCosts[value] || 0;
      setFormData(prev => ({ ...prev, unit, costPerUnit: defaultCost.toString(), fuelType: value === "fuel" || value === "diesel" ? "diesel" : "" }));
      if (formData.consumption) setFormData(prev => ({ ...prev, cost: (parseFloat(formData.consumption) * defaultCost).toFixed(2) }));
    }
  };

  const handleSubmit = async () => {
    if (!user || !formData.date || !formData.energyType || !formData.consumption) {
      toast.error("Please fill all required fields");
      return;
    }
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
      toast.success("Record added");
      setDialogOpen(false);
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
        recordedBy: "",
        notes: "",
      });
    } catch (error) {
      toast.error("Failed to add record");
    }
  };

  const handleUpdate = async () => {
    if (!selectedRecord || !user) return;
    const consumption = parseFloat(selectedRecord.consumption);
    const costPerUnit = parseFloat(selectedRecord.costPerUnit);
    const updated = { ...selectedRecord, date: Timestamp.fromDate(new Date(selectedRecord.date)), consumption, costPerUnit, cost: consumption * costPerUnit, updatedAt: Timestamp.now() };
    delete updated.id; delete updated.dateDisplay;
    try {
      await updateDoc(doc(db, "energy", user.uid, "records", selectedRecord.id), updated);
      toast.success("Record updated");
      setEditDialogOpen(false);
      setViewDialogOpen(false);
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!user || !id) return;
    if (confirm("Delete this record?")) {
      try {
        await deleteDoc(doc(db, "energy", user.uid, "records", id));
        toast.success("Deleted");
        setViewDialogOpen(false);
      } catch (error) {
        toast.error("Delete failed");
      }
    }
  };

  const handleExport = () => {
    const headers = ["Date", "Energy Type", "Fuel Type", "Consumption", "Unit", "Cost", "Rate", "Machine/Area", "Recorded By", "Notes"];
    const rows = filteredRecords.map(r => [r.dateDisplay, r.energyType, r.fuelType || "", r.consumption, r.unit, r.cost, r.costPerUnit, r.machine || r.area || "", r.recordedBy, r.notes || ""]);
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

  // Loading state with sidebar and header visible
  if (loadingAuth || loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
          <div className="flex flex-1 items-center justify-center">
            <IconLoader className="h-8 w-8 animate-spin text-slate-700" />
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
          <div className="flex flex-1 items-center justify-center">
            <Card className="max-w-md border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-indigo-500/10">
              <CardHeader><CardTitle>Sign In Required</CardTitle><CardDescription>Please log in to continue</CardDescription></CardHeader>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Main authenticated view
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader className="relative overflow-hidden bg-zinc-950" />
        
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
            <div className="absolute top-[30%] -right-[10%] h-[400px] w-[400px] rounded-full bg-yellow-500/15 blur-[120px]" />
            <div className="absolute bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-amber-600/10 blur-[100px]" />
          </div>
          
          {/* Header */}
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
              <Button onClick={handleExport} className="cursor-pointer" variant="outline">
                <IconDownload className="mr-2 h-4 w-4" />
                Download Report
              </Button>
              <Button onClick={() => setDialogOpen(true)} className="cursor-pointer bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600">
                <IconPlus className="mr-2 h-4 w-4" />
                Add Record
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Consumption" value={stats.totalConsumption.toLocaleString()} unit="units" subtitle="Combined all types" footerTitle="Avg per day" footerSubtitle={(stats.totalConsumption / 30).toFixed(1)} icon={IconChartBar} color="#eab308" trend={(stats.totalConsumption / 30).toFixed(1)} />
            <StatCard title="Total Cost" value={`$${stats.totalCost.toLocaleString()}`} unit="" subtitle={`Avg $${stats.avgCostPerUnit.toFixed(2)}/unit`} footerTitle="Cost per unit" footerSubtitle={`$${stats.avgCostPerUnit.toFixed(2)}`} icon={IconCurrencyDollar} color="#ef4444" />
            <StatCard title="Electricity" value={stats.electricityConsumption.toLocaleString()} unit="kWh" subtitle={`$${stats.electricityCost.toLocaleString()}`} footerTitle="Rate" footerSubtitle={`$${defaultCosts.electricity}/kWh`} icon={IconBolt} color="#eab308" />
            <StatCard title="Fuel & Gas" value={(stats.fuelConsumption + stats.gasConsumption).toLocaleString()} unit="L/m³" subtitle={`$${(stats.fuelCost + stats.gasCost).toLocaleString()}`} footerTitle="Avg rate" footerSubtitle={`$${((stats.fuelCost + stats.gasCost) / (stats.fuelConsumption + stats.gasConsumption || 1)).toFixed(2)}/unit`} icon={IconGasStation} color="#f97316" />
          </div>

          {/* Filters Section */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  placeholder="Search by keywords or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 w-full bg-background/80 backdrop-blur-sm"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Select value={energyTypeFilter} onValueChange={setEnergyTypeFilter}>
                  <SelectTrigger className="w-[140px] h-10 cursor-pointer bg-background/80 backdrop-blur-sm">
                    <IconBolt className="mr-2 h-4 w-4" />
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
                    <SelectItem value="7d" className="cursor-pointer">Last 7 days</SelectItem>
                    <SelectItem value="30d" className="cursor-pointer">Last 30 days</SelectItem>
                    <SelectItem value="90d" className="cursor-pointer">Last 90 days</SelectItem>
                    <SelectItem value="all" className="cursor-pointer">All time</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[140px] h-10 cursor-pointer bg-background/80 backdrop-blur-sm">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc" className="cursor-pointer">Newest first</SelectItem>
                    <SelectItem value="asc" className="cursor-pointer">Oldest first</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => { 
                    setDateRange("30d"); 
                    setEnergyTypeFilter("all"); 
                    setSearchQuery(""); 
                    setSortOrder("desc"); 
                  }} 
                  className="cursor-pointer h-10"
                >
                  <IconRefresh className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Records Table */}
          <Card className="overflow-hidden border-border/50">
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IconFileReport className="h-5 w-5 text-yellow-500" />
                    Consumption Records
                  </CardTitle>
                  <CardDescription>
                    {filteredRecords.length} record(s) found
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <EnergyTable data={filteredRecords} onView={(r) => { setSelectedRecord(r); setViewDialogOpen(true); }} onEdit={(r) => { setSelectedRecord(r); setEditDialogOpen(true); }} onDelete={handleDelete} />
            </CardContent>
          </Card>
        </div>

        {/* Dialogs */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add Energy Record">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Date *</label>
              <Input type="date" name="date" value={formData.date} onChange={handleInputChange} className="mt-2 h-10" />
            </div>
            <div>
              <label className="text-sm font-medium">Energy Type *</label>
              <Select value={formData.energyType} onValueChange={(v) => handleSelectChange("energyType", v)}>
                <SelectTrigger className="mt-2 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {energyTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {(formData.energyType === "fuel" || formData.energyType === "diesel") && (
              <div>
                <label className="text-sm font-medium">Fuel Type</label>
                <Select value={formData.fuelType} onValueChange={(v) => handleSelectChange("fuelType", v)}>
                  <SelectTrigger className="mt-2 h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {fuelTypes.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Consumption ({formData.unit}) *</label>
              <Input type="number" step="0.01" name="consumption" value={formData.consumption} onChange={handleInputChange} className="mt-2 h-10" />
            </div>
            <div>
              <label className="text-sm font-medium">Cost per Unit ($)</label>
              <Input type="number" step="0.01" name="costPerUnit" value={formData.costPerUnit} onChange={handleInputChange} className="mt-2 h-10" />
            </div>
            <div>
              <label className="text-sm font-medium">Total Cost</label>
              <Input type="text" name="cost" value={formData.cost} readOnly className="mt-2 h-10 bg-muted/50 font-mono font-semibold text-amber-500" />
            </div>
            <div>
              <label className="text-sm font-medium">Machine/Equipment</label>
              <Input name="machine" value={formData.machine} onChange={handleInputChange} className="mt-2 h-10" />
            </div>
            <div>
              <label className="text-sm font-medium">Area/Department</label>
              <Input name="area" value={formData.area} onChange={handleInputChange} className="mt-2 h-10" />
            </div>
            <div>
              <label className="text-sm font-medium">Recorded By</label>
              <Input name="recordedBy" value={formData.recordedBy} onChange={handleInputChange} className="mt-2 h-10" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={2} className="mt-2" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-border/50 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSubmit} className="cursor-pointer bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600">Add Record</Button>
          </div>
        </Dialog>

        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} title="Record Details">
          {selectedRecord && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground font-medium">Date</p>
                <p className="text-sm font-semibold mt-1">{selectedRecord.dateDisplay}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground font-medium">Type</p>
                <p className="text-sm font-semibold mt-1 capitalize">{selectedRecord.energyType} {selectedRecord.fuelType && <Badge className="ml-2 text-xs">{selectedRecord.fuelType}</Badge>}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground font-medium">Consumption</p>
                <p className="text-sm font-semibold mt-1">{selectedRecord.consumption} <span className="font-mono text-muted-foreground">{selectedRecord.unit}</span></p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground font-medium">Rate</p>
                <p className="text-sm font-semibold mt-1">${selectedRecord.costPerUnit}/{selectedRecord.unit}</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-3">
                <p className="text-xs text-muted-foreground font-medium">Total Cost</p>
                <p className="text-lg font-bold text-amber-500 mt-1">${selectedRecord.cost.toLocaleString()}</p>
              </div>
              {selectedRecord.machine && (
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground font-medium">Machine</p>
                  <p className="text-sm font-semibold mt-1">{selectedRecord.machine}</p>
                </div>
              )}
              {selectedRecord.area && (
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground font-medium">Area</p>
                  <p className="text-sm font-semibold mt-1">{selectedRecord.area}</p>
                </div>
              )}
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground font-medium">Recorded By</p>
                <p className="text-sm font-semibold mt-1">{selectedRecord.recordedBy}</p>
              </div>
              {selectedRecord.notes && (
                <div className="sm:col-span-2 rounded-lg bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground font-medium">Notes</p>
                  <p className="text-sm mt-1">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          )}
          <div className="mt-6 flex justify-end gap-3 border-t border-border/50 pt-4">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)} className="cursor-pointer">Close</Button>
            <Button variant="secondary" onClick={() => { setViewDialogOpen(false); setEditDialogOpen(true); }} className="cursor-pointer">Edit</Button>
            <Button variant="destructive" onClick={() => handleDelete(selectedRecord?.id)} className="cursor-pointer">Delete</Button>
          </div>
        </Dialog>

        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} title="Edit Record">
          {selectedRecord && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={selectedRecord.date.toISOString().split("T")[0]} onChange={(e) => setSelectedRecord({ ...selectedRecord, date: new Date(e.target.value), dateDisplay: new Date(e.target.value).toLocaleDateString() })} className="mt-2 h-10" />
              </div>
              <div>
                <label className="text-sm font-medium">Energy Type</label>
                <Select value={selectedRecord.energyType} onValueChange={(v) => setSelectedRecord({ ...selectedRecord, energyType: v })}>
                  <SelectTrigger className="mt-2 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {energyTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Consumption ({selectedRecord.unit})</label>
                <Input type="number" step="0.01" value={selectedRecord.consumption} onChange={(e) => { const val = parseFloat(e.target.value); setSelectedRecord({ ...selectedRecord, consumption: val, cost: val * selectedRecord.costPerUnit }); }} className="mt-2 h-10" />
              </div>
              <div>
                <label className="text-sm font-medium">Cost per Unit ($)</label>
                <Input type="number" step="0.01" value={selectedRecord.costPerUnit} onChange={(e) => { const val = parseFloat(e.target.value); setSelectedRecord({ ...selectedRecord, costPerUnit: val, cost: selectedRecord.consumption * val }); }} className="mt-2 h-10" />
              </div>
              <div>
                <label className="text-sm font-medium">Machine</label>
                <Input value={selectedRecord.machine || ""} onChange={(e) => setSelectedRecord({ ...selectedRecord, machine: e.target.value })} className="mt-2 h-10" />
              </div>
              <div>
                <label className="text-sm font-medium">Area</label>
                <Input value={selectedRecord.area || ""} onChange={(e) => setSelectedRecord({ ...selectedRecord, area: e.target.value })} className="mt-2 h-10" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea value={selectedRecord.notes || ""} onChange={(e) => setSelectedRecord({ ...selectedRecord, notes: e.target.value })} rows={2} className="mt-2" />
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-end gap-3 border-t border-border/50 pt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleUpdate} className="cursor-pointer bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600">Update</Button>
          </div>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}