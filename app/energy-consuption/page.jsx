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
            IconTrendingUp,
            IconTrendingDown,
            IconCurrencyDollar,
            IconBuildingFactory,
            IconFileReport,
            IconFlame,
            IconInfoCircle,
            IconBuildingStore,
            IconMapPin,
            IconUser,
            IconNotes,
            IconX,
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
            where,
            onSnapshot,
            Timestamp,
            } from "firebase/firestore";

            // Energy types with icons and colors
            const energyTypes = [
            { value: "electricity", label: "Electricity", icon: IconBolt, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
            { value: "fuel", label: "Fuel", icon: IconGasStation, color: "text-orange-500", bgColor: "bg-orange-500/10" },
            { value: "gas", label: "Natural Gas", icon: IconFlame, color: "text-blue-500", bgColor: "bg-blue-500/10" },
            { value: "diesel", label: "Diesel", icon: IconGasStation, color: "text-purple-500", bgColor: "bg-purple-500/10" },
            ];

            // Fuel types
            const fuelTypes = [
            { value: "petrol", label: "Petrol" },
            { value: "diesel", label: "Diesel" },
            { value: "cng", label: "CNG" },
            { value: "lpg", label: "LPG" },
            { value: "heavy_fuel_oil", label: "Heavy Fuel Oil" },
            ];

            // Units for each energy type
            const units = {
            electricity: "kWh",
            fuel: "liters",
            gas: "m³",
            diesel: "liters",
            };

            // Default cost per unit (USD)
            const defaultCosts = {
            electricity: 0.15,
            fuel: 1.20,
            gas: 0.50,
            diesel: 1.10,
            };

            // Custom Dialog Component
            const CustomDialog = ({ isOpen, onClose, title, children, maxWidth = "4xl" }) => {
            if (!isOpen) return null;

            const maxWidthClass = {
                sm: "max-w-sm",
                md: "max-w-md",
                lg: "max-w-lg",
                xl: "max-w-xl",
                "2xl": "max-w-2xl",
                "3xl": "max-w-3xl",
                "4xl": "max-w-4xl",
                "5xl": "max-w-5xl",
                "6xl": "max-w-6xl",
                "7xl": "max-w-7xl",
            }[maxWidth] || "max-w-4xl";

            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
                <div className={`relative bg-background rounded-lg shadow-xl ${maxWidthClass} w-full mx-4 max-h-[90vh] overflow-y-auto`}>
                    <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-muted rounded-lg transition-colors"
                    >
                        <IconX className="h-5 w-5 text-muted-foreground" />
                    </button>
                    </div>
                    <div className="p-6">
                    {children}
                    </div>
                </div>
                </div>
            );
            };

            // Custom Table with Pagination
            const EnergyTable = ({ data, onView, onEdit, onDelete }) => {
            const [currentPage, setCurrentPage] = useState(1);
            const itemsPerPage = 5;

            const totalPages = Math.ceil(data.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const currentData = data.slice(startIndex, endIndex);

            const getEnergyTypeIcon = (type) => {
                const typeInfo = energyTypes.find(t => t.value === type);
                const Icon = typeInfo?.icon || IconBolt;
                return <Icon className={`h-4 w-4 ${typeInfo?.color || "text-muted-foreground"}`} />;
            };

            const getEnergyTypeColor = (type) => {
                const typeInfo = energyTypes.find(t => t.value === type);
                return typeInfo?.bgColor || "bg-muted";
            };

            if (data.length === 0) {
                return (
                <div className="text-center py-12">
                    <IconChartBar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No energy consumption records found</p>
                    <p className="text-sm text-muted-foreground mt-1">Click "Add Record" to get started</p>
                </div>
                );
            }

            return (
                <div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                    <thead className="border-b border-border bg-muted/50">
                        <tr>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Energy Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Consumption</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cost</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Machine/Area</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Recorded By</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.map((record) => (
                        <tr key={record.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{record.dateDisplay}</span>
                            </div>
                            </td>
                            <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                                <div className={`p-1 rounded ${getEnergyTypeColor(record.energyType)}`}>
                                {getEnergyTypeIcon(record.energyType)}
                                </div>
                                <span className="text-sm capitalize">{record.energyType}</span>
                                {record.fuelType && (
                                <Badge variant="outline" className="text-xs">
                                    {record.fuelType}
                                </Badge>
                                )}
                            </div>
                            </td>
                            <td className="py-3 px-4">
                            <span className="text-sm font-medium">
                                {record.consumption.toLocaleString()} {record.unit}
                            </span>
                            </td>
                            <td className="py-3 px-4">
                            <span className="text-sm font-medium text-red-500">
                                ${record.cost.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">
                                @ ${record.costPerUnit}/{record.unit}
                            </span>
                            </td>
                            <td className="py-3 px-4">
                            <span className="text-sm">{record.machine || record.area || "—"}</span>
                            </td>
                            <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                                <IconUser className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{record.recordedBy}</span>
                            </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <button
                                onClick={() => onView(record)}
                                className="p-1 hover:bg-muted rounded transition-colors"
                                title="View Details"
                                >
                                <IconFileReport className="h-4 w-4 text-muted-foreground" />
                                </button>
                                <button
                                onClick={() => onEdit(record)}
                                className="p-1 hover:bg-muted rounded transition-colors"
                                title="Edit"
                                >
                                <IconEdit className="h-4 w-4 text-blue-500" />
                                </button>
                                <button
                                onClick={() => onDelete(record.id)}
                                className="p-1 hover:bg-muted rounded transition-colors"
                                title="Delete"
                                >
                                <IconTrash className="h-4 w-4 text-red-500" />
                                </button>
                            </div>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border pt-4 mt-4 px-4">
                    <div className="text-sm text-muted-foreground">
                        Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} records
                    </div>
                    <div className="flex gap-2">
                        <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                        Previous
                        </button>
                        <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                                currentPage === page
                                ? "bg-primary text-primary-foreground"
                                : "border border-border hover:bg-muted"
                            }`}
                            >
                            {page}
                            </button>
                        ))}
                        </div>
                        <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                        Next
                        </button>
                    </div>
                    </div>
                )}
                </div>
            );
            };

            export default function EnergyConsumptionPage() {
            const [user, loadingAuth] = useAuthState(auth);
            const [records, setRecords] = useState([]);
            const [filteredRecords, setFilteredRecords] = useState([]);
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState(null);
            const [dialogOpen, setDialogOpen] = useState(false);
            const [viewDialogOpen, setViewDialogOpen] = useState(false);
            const [editDialogOpen, setEditDialogOpen] = useState(false);
            const [selectedRecord, setSelectedRecord] = useState(null);
            const [searchQuery, setSearchQuery] = useState("");
            const [dateRange, setDateRange] = useState("30d");
            const [energyTypeFilter, setEnergyTypeFilter] = useState("all");
            const [sortOrder, setSortOrder] = useState("desc");
            const [showFilters, setShowFilters] = useState(false);
            
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

            // Stats state
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
                highestDay: null,
                lowestDay: null,
            });

            // Fetch energy consumption records
            useEffect(() => {
                if (!user) {
                setLoading(false);
                setRecords([]);
                return;
                }

                setLoading(true);
                const q = query(
                collection(db, "energyConsumption"),
                where("userId", "==", user.uid)
                );

                const unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const recordsData = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    const dateValue = data.date?.toDate ? data.date.toDate() : new Date(data.date);
                    return {
                        id: doc.id,
                        ...data,
                        date: dateValue,
                        dateDisplay: dateValue.toLocaleDateString(),
                    };
                    });
                    
                    recordsData.sort((a, b) => {
                    if (sortOrder === "desc") {
                        return b.date - a.date;
                    } else {
                        return a.date - b.date;
                    }
                    });
                    
                    setRecords(recordsData);
                    setLoading(false);
                    setError(null);
                },
                (err) => {
                    console.error("Firestore error:", err);
                    setError("Failed to load energy consumption data");
                    setLoading(false);
                    toast.error("Error loading data");
                }
                );

                return () => unsubscribe();
            }, [user, sortOrder]);

            // Filter records
            useEffect(() => {
                let filtered = [...records];

                if (searchQuery) {
                filtered = filtered.filter(
                    (r) =>
                    r.energyType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.machine?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.recordedBy?.toLowerCase().includes(searchQuery.toLowerCase())
                );
                }

                if (energyTypeFilter !== "all") {
                filtered = filtered.filter((r) => r.energyType === energyTypeFilter);
                }

                const now = new Date();
                if (dateRange === "7d") {
                const cutoff = new Date(now.setDate(now.getDate() - 7));
                filtered = filtered.filter((r) => r.date >= cutoff);
                } else if (dateRange === "30d") {
                const cutoff = new Date(now.setDate(now.getDate() - 30));
                filtered = filtered.filter((r) => r.date >= cutoff);
                } else if (dateRange === "90d") {
                const cutoff = new Date(now.setDate(now.getDate() - 90));
                filtered = filtered.filter((r) => r.date >= cutoff);
                }

                setFilteredRecords(filtered);

                // Calculate statistics
                if (filtered.length > 0) {
                const totalConsumption = filtered.reduce((sum, r) => sum + (r.consumption || 0), 0);
                const totalCost = filtered.reduce((sum, r) => sum + (r.cost || 0), 0);
                
                const electricityRecords = filtered.filter(r => r.energyType === "electricity");
                const fuelRecords = filtered.filter(r => r.energyType === "fuel" || r.energyType === "diesel");
                const gasRecords = filtered.filter(r => r.energyType === "gas");
                
                const electricityConsumption = electricityRecords.reduce((sum, r) => sum + (r.consumption || 0), 0);
                const electricityCost = electricityRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
                const fuelConsumption = fuelRecords.reduce((sum, r) => sum + (r.consumption || 0), 0);
                const fuelCost = fuelRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
                const gasConsumption = gasRecords.reduce((sum, r) => sum + (r.consumption || 0), 0);
                const gasCost = gasRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
                
                const avgCostPerUnit = totalConsumption > 0 ? totalCost / totalConsumption : 0;
                
                const sortedByConsumption = [...filtered].sort((a, b) => b.consumption - a.consumption);
                const highestDay = sortedByConsumption[0];
                const lowestDay = sortedByConsumption[sortedByConsumption.length - 1];
                
                setStats({
                    totalConsumption,
                    totalCost,
                    electricityConsumption,
                    electricityCost,
                    fuelConsumption,
                    fuelCost,
                    gasConsumption,
                    gasCost,
                    avgCostPerUnit,
                    highestDay,
                    lowestDay,
                });
                } else {
                setStats({
                    totalConsumption: 0,
                    totalCost: 0,
                    electricityConsumption: 0,
                    electricityCost: 0,
                    fuelConsumption: 0,
                    fuelCost: 0,
                    gasConsumption: 0,
                    gasCost: 0,
                    avgCostPerUnit: 0,
                    highestDay: null,
                    lowestDay: null,
                });
                }
            }, [records, searchQuery, dateRange, energyTypeFilter]);

            const handleInputChange = (e) => {
                const { name, value } = e.target;
                setFormData(prev => ({ ...prev, [name]: value }));
                
                if (name === "consumption" || name === "costPerUnit") {
                const consumption = name === "consumption" ? parseFloat(value) : parseFloat(formData.consumption);
                const costPerUnit = name === "costPerUnit" ? parseFloat(value) : parseFloat(formData.costPerUnit);
                
                if (!isNaN(consumption) && !isNaN(costPerUnit)) {
                    const cost = consumption * costPerUnit;
                    setFormData(prev => ({ ...prev, cost: cost.toFixed(2) }));
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
                }));
                
                if (formData.consumption) {
                    const cost = parseFloat(formData.consumption) * defaultCost;
                    setFormData(prev => ({ ...prev, cost: cost.toFixed(2) }));
                }
                }
            };

            const handleSubmit = async () => {
                if (!user) {
                toast.error("You must be logged in");
                return;
                }

                if (!formData.date || !formData.energyType || !formData.consumption) {
                toast.error("Please fill in all required fields");
                return;
                }

                const consumption = parseFloat(formData.consumption);
                const costPerUnit = parseFloat(formData.costPerUnit);
                const cost = consumption * costPerUnit;

                const recordData = {
                date: Timestamp.fromDate(new Date(formData.date)),
                energyType: formData.energyType,
                fuelType: formData.fuelType || null,
                consumption: consumption,
                unit: formData.unit,
                costPerUnit: costPerUnit,
                cost: cost,
                machine: formData.machine || null,
                area: formData.area || null,
                recordedBy: formData.recordedBy || user.displayName || "System",
                notes: formData.notes || null,
                createdAt: Timestamp.now(),
                userId: user.uid,
                };

                try {
                await addDoc(collection(db, "energyConsumption"), recordData);
                toast.success("Energy consumption record added successfully!");
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
                console.error("Error adding record:", error);
                toast.error("Failed to add record");
                }
            };

            const handleUpdate = async () => {
                if (!selectedRecord) return;

                const consumption = parseFloat(selectedRecord.consumption);
                const costPerUnit = parseFloat(selectedRecord.costPerUnit);
                const cost = consumption * costPerUnit;

                const updatedData = {
                ...selectedRecord,
                date: Timestamp.fromDate(new Date(selectedRecord.date)),
                consumption: consumption,
                cost: cost,
                updatedAt: Timestamp.now(),
                };
                delete updatedData.id;
                delete updatedData.dateDisplay;

                try {
                const recordRef = doc(db, "energyConsumption", selectedRecord.id);
                await updateDoc(recordRef, updatedData);
                toast.success("Record updated successfully!");
                setEditDialogOpen(false);
                setViewDialogOpen(false);
                } catch (error) {
                console.error("Error updating record:", error);
                toast.error("Failed to update record");
                }
            };

            const handleDelete = async (id) => {
                if (!id) return;
                if (confirm("Are you sure you want to delete this record?")) {
                try {
                    await deleteDoc(doc(db, "energyConsumption", id));
                    toast.success("Record deleted successfully!");
                    setViewDialogOpen(false);
                } catch (error) {
                    console.error("Error deleting record:", error);
                    toast.error("Failed to delete record");
                }
                }
            };

            const handleExport = () => {
                const headers = ["Date", "Energy Type", "Fuel Type", "Consumption", "Unit", "Cost", "Rate", "Machine/Area", "Recorded By", "Notes"];
                const csvData = filteredRecords.map(r => [
                r.dateDisplay,
                r.energyType,
                r.fuelType || "",
                r.consumption,
                r.unit,
                r.cost,
                r.costPerUnit,
                r.machine || r.area || "",
                r.recordedBy,
                r.notes || "",
                ]);

                const csv = [headers, ...csvData].map(row => row.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `energy-consumption-${new Date().toISOString().split("T")[0]}.csv`;
                a.click();
                toast.success("Report exported successfully!");
            };

            const handleView = (record) => {
                setSelectedRecord(record);
                setViewDialogOpen(true);
            };

            const handleEdit = (record) => {
                setSelectedRecord(record);
                setEditDialogOpen(true);
            };

            if (loadingAuth || loading) {
                return (
                <SidebarProvider>
                    <AppSidebar variant="inset" />
                    <SidebarInset>
                    <SiteHeader />
                    <div className="flex-1 p-8 flex items-center justify-center">
                        <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading energy data...</p>
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
                            <Button onClick={() => window.location.reload()}>
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
                    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <IconBolt className="h-8 w-8 text-yellow-500" />
                            Energy Consumption
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Track and analyze electricity, fuel, and gas consumption
                        </p>
                        </div>
                        
                        <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExport}>
                            <IconDownload className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button onClick={() => setDialogOpen(true)}>
                            <IconPlus className="mr-2 h-4 w-4" />
                            Add Record
                        </Button>
                        </div>
                    </div>

                    {/* Stats Cards - 4 cards only */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Consumption</CardTitle>
                            <IconChartBar className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                            {stats.totalConsumption.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Combined units across all types</p>
                        </CardContent>
                        </Card>

                        <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
                            <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">
                            ${stats.totalCost.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                            Avg ${stats.avgCostPerUnit.toFixed(2)} per unit
                            </p>
                        </CardContent>
                        </Card>

                        <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Electricity</CardTitle>
                            <IconBolt className="h-4 w-4 text-yellow-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                            {stats.electricityConsumption.toLocaleString()} kWh
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                            Cost: ${stats.electricityCost.toLocaleString()}
                            </p>
                        </CardContent>
                        </Card>

                        <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Fuel & Gas</CardTitle>
                            <IconGasStation className="h-4 w-4 text-orange-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                            {(stats.fuelConsumption + stats.gasConsumption).toLocaleString()} L/m³
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                            Cost: ${(stats.fuelCost + stats.gasCost).toLocaleString()}
                            </p>
                        </CardContent>
                        </Card>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by energy type, machine, area..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                        </div>
                        
                        <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                            <IconFilter className="mr-2 h-4 w-4" />
                            Filters
                            {(energyTypeFilter !== "all" || dateRange !== "30d") && (
                            <span className="ml-2 w-2 h-2 rounded-full bg-primary"></span>
                            )}
                        </Button>
                        
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-[140px]">
                            <IconCalendar className="mr-2 h-4 w-4" />
                            <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sortOrder} onValueChange={setSortOrder}>
                            <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Sort by date" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="desc">Newest first</SelectItem>
                            <SelectItem value="asc">Oldest first</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="ghost" size="sm" onClick={() => {
                            setDateRange("30d");
                            setEnergyTypeFilter("all");
                            setSearchQuery("");
                            setSortOrder("desc");
                        }}>
                            <IconRefresh className="mr-2 h-4 w-4" />
                            Reset
                        </Button>
                        </div>
                    </div>

                    {/* Expandable Filters */}
                    {showFilters && (
                        <Card className="border-dashed">
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Energy Type</label>
                                <Select value={energyTypeFilter} onValueChange={setEnergyTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {energyTypes.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                            </div>
                            </div>
                        </CardContent>
                        </Card>
                    )}

                    {/* Data Table */}
                    <Card>
                        <CardHeader>
                        <CardTitle>Consumption Records</CardTitle>
                        <CardDescription>
                            {filteredRecords.length} record(s) found
                        </CardDescription>
                        </CardHeader>
                        <CardContent>
                        <EnergyTable
                            data={filteredRecords}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                        </CardContent>
                    </Card>
                    </div>

                    {/* Add Record Dialog */}
                    <CustomDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} title="Add Energy Consumption Record" maxWidth="4xl">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                            <IconCalendar className="h-4 w-4 text-muted-foreground" />
                            <label>Date *</label>
                            </div>
                            <Input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                            <IconBolt className="h-4 w-4 text-muted-foreground" />
                            <label>Energy Type *</label>
                            </div>
                            <Select
                            value={formData.energyType}
                            onValueChange={(value) => handleSelectChange("energyType", value)}
                            >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {energyTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center gap-2">
                                    <type.icon className={`h-4 w-4 ${type.color}`} />
                                    {type.label}
                                    </div>
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>

                        {(formData.energyType === "fuel" || formData.energyType === "diesel") && (
                            <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <IconGasStation className="h-4 w-4 text-muted-foreground" />
                                <label>Fuel Type</label>
                            </div>
                            <Select
                                value={formData.fuelType}
                                onValueChange={(value) => handleSelectChange("fuelType", value)}
                            >
                                <SelectTrigger>
                                <SelectValue placeholder="Select fuel type" />
                                </SelectTrigger>
                                <SelectContent>
                                {fuelTypes.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                            <IconChartBar className="h-4 w-4 text-muted-foreground" />
                            <label>Consumption *</label>
                            </div>
                            <Input
                            type="number"
                            step="0.01"
                            name="consumption"
                            value={formData.consumption}
                            onChange={handleInputChange}
                            placeholder={`Amount in ${formData.unit}`}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                            <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
                            <label>Cost per Unit ($)</label>
                            </div>
                            <Input
                            type="number"
                            step="0.01"
                            name="costPerUnit"
                            value={formData.costPerUnit}
                            onChange={handleInputChange}
                            placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                            <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
                            <label>Total Cost</label>
                            </div>
                            <Input
                            type="number"
                            step="0.01"
                            name="cost"
                            value={formData.cost}
                            readOnly
                            className="bg-muted"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                            <IconBuildingFactory className="h-4 w-4 text-muted-foreground" />
                            <label>Machine/Equipment</label>
                            </div>
                            <Input
                            name="machine"
                            value={formData.machine}
                            onChange={handleInputChange}
                            placeholder="e.g., Production Line 1"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                            <IconMapPin className="h-4 w-4 text-muted-foreground" />
                            <label>Area/Department</label>
                            </div>
                            <Input
                            name="area"
                            value={formData.area}
                            onChange={handleInputChange}
                            placeholder="e.g., Manufacturing"
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                            <IconUser className="h-4 w-4 text-muted-foreground" />
                            <label>Recorded By</label>
                            </div>
                            <Input
                            name="recordedBy"
                            value={formData.recordedBy}
                            onChange={handleInputChange}
                            placeholder="Your name"
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                            <IconNotes className="h-4 w-4 text-muted-foreground" />
                            <label>Notes</label>
                            </div>
                            <Textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            placeholder="Any additional notes..."
                            rows={3}
                            />
                        </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit}>
                            <IconPlus className="mr-2 h-4 w-4" />
                            Add Record
                        </Button>
                        </div>
                    </div>
                    </CustomDialog>

                    {/* View Record Dialog */}
                    <CustomDialog isOpen={viewDialogOpen} onClose={() => setViewDialogOpen(false)} title="Energy Consumption Details" maxWidth="2xl">
                    {selectedRecord && (
                        <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted/30 p-4 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Date</p>
                            <p className="font-medium flex items-center gap-2">
                                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                                {selectedRecord.dateDisplay}
                            </p>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Energy Type</p>
                            <p className="font-medium capitalize flex items-center gap-2">
                                {getEnergyTypeIcon(selectedRecord.energyType)}
                                {selectedRecord.energyType}
                                {selectedRecord.fuelType && (
                                <Badge variant="outline" className="text-xs">
                                    {selectedRecord.fuelType}
                                </Badge>
                                )}
                            </p>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Consumption</p>
                            <p className="font-medium">
                                {selectedRecord.consumption.toLocaleString()} {selectedRecord.unit}
                            </p>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Rate</p>
                            <p className="font-medium">${selectedRecord.costPerUnit}/{selectedRecord.unit}</p>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
                            <p className="font-medium text-red-500">${selectedRecord.cost.toLocaleString()}</p>
                            </div>
                            {selectedRecord.machine && (
                            <div className="bg-muted/30 p-4 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">Machine/Equipment</p>
                                <p className="font-medium flex items-center gap-2">
                                <IconBuildingFactory className="h-4 w-4 text-muted-foreground" />
                                {selectedRecord.machine}
                                </p>
                            </div>
                            )}
                            {selectedRecord.area && (
                            <div className="bg-muted/30 p-4 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">Area</p>
                                <p className="font-medium flex items-center gap-2">
                                <IconMapPin className="h-4 w-4 text-muted-foreground" />
                                {selectedRecord.area}
                                </p>
                            </div>
                            )}
                            <div className="bg-muted/30 p-4 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Recorded By</p>
                            <p className="font-medium flex items-center gap-2">
                                <IconUser className="h-4 w-4 text-muted-foreground" />
                                {selectedRecord.recordedBy}
                            </p>
                            </div>
                            {selectedRecord.notes && (
                            <div className="col-span-2 bg-muted/30 p-4 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                <p className="font-medium flex items-start gap-2">
                                <IconNotes className="h-4 w-4 text-muted-foreground mt-0.5" />
                                {selectedRecord.notes}
                                </p>
                            </div>
                            )}
                        </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
                        <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                        Close
                        </Button>
                        <Button variant="secondary" onClick={() => {
                        setViewDialogOpen(false);
                        setEditDialogOpen(true);
                        }}>
                        <IconEdit className="mr-2 h-4 w-4" />
                        Edit
                        </Button>
                        <Button variant="destructive" onClick={() => handleDelete(selectedRecord?.id)}>
                        <IconTrash className="mr-2 h-4 w-4" />
                        Delete
                        </Button>
                    </div>
                    </CustomDialog>

                    {/* Edit Record Dialog */}
                    <CustomDialog isOpen={editDialogOpen} onClose={() => setEditDialogOpen(false)} title="Edit Energy Consumption Record" maxWidth="4xl">
                    {selectedRecord && (
                        <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                                <label>Date *</label>
                            </div>
                            <Input
                                type="date"
                                value={selectedRecord.date.toISOString().split("T")[0]}
                                onChange={(e) => setSelectedRecord({ 
                                ...selectedRecord, 
                                date: new Date(e.target.value),
                                dateDisplay: new Date(e.target.value).toLocaleDateString()
                                })}
                            />
                            </div>
                            
                            <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <IconBolt className="h-4 w-4 text-muted-foreground" />
                                <label>Energy Type *</label>
                            </div>
                            <Select
                                value={selectedRecord.energyType}
                                onValueChange={(value) => setSelectedRecord({ ...selectedRecord, energyType: value })}
                            >
                                <SelectTrigger>
                                <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                {energyTypes.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            </div>

                            <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <IconChartBar className="h-4 w-4 text-muted-foreground" />
                                <label>Consumption *</label>
                            </div>
                            <Input
                                type="number"
                                step="0.01"
                                value={selectedRecord.consumption}
                                onChange={(e) => {
                                const consumption = parseFloat(e.target.value);
                                const cost = consumption * selectedRecord.costPerUnit;
                                setSelectedRecord({ ...selectedRecord, consumption, cost });
                                }}
                            />
                            </div>

                            <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
                                <label>Cost per Unit ($)</label>
                            </div>
                            <Input
                                type="number"
                                step="0.01"
                                value={selectedRecord.costPerUnit}
                                onChange={(e) => {
                                const costPerUnit = parseFloat(e.target.value);
                                const cost = selectedRecord.consumption * costPerUnit;
                                setSelectedRecord({ ...selectedRecord, costPerUnit, cost });
                                }}
                            />
                            </div>

                            <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <IconBuildingFactory className="h-4 w-4 text-muted-foreground" />
                                <label>Machine/Equipment</label>
                            </div>
                            <Input
                                value={selectedRecord.machine || ""}
                                onChange={(e) => setSelectedRecord({ ...selectedRecord, machine: e.target.value })}
                            />
                            </div>

                            <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <IconMapPin className="h-4 w-4 text-muted-foreground" />
                                <label>Area/Department</label>
                            </div>
                            <Input
                                value={selectedRecord.area || ""}
                                onChange={(e) => setSelectedRecord({ ...selectedRecord, area: e.target.value })}
                            />
                            </div>

                            <div className="space-y-2 col-span-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <IconNotes className="h-4 w-4 text-muted-foreground" />
                                <label>Notes</label>
                            </div>
                            <Textarea
                                value={selectedRecord.notes || ""}
                                onChange={(e) => setSelectedRecord({ ...selectedRecord, notes: e.target.value })}
                                rows={3}
                            />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Cancel
                            </Button>
                            <Button onClick={handleUpdate}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Update Record
                            </Button>
                        </div>
                        </div>
                    )}
                    </CustomDialog>
                </SidebarInset>
                </SidebarProvider>
            );
            }