// app/storage/warehouses/page.jsx
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconBuildingWarehouse,
  IconLocation,
  IconPackage,
  IconBox,
  IconRefresh,
  IconLoader,
  IconSearch,
  IconChevronLeft,
  IconChevronsLeft,
  IconChevronsRight,
  IconChevronRight,
  IconBug,
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
import { cn } from "@/lib/utils";

// Warehouse type options for display
const warehouseTypes = [
  { value: "main", label: "Main Warehouse", color: "primary" },
  { value: "cold", label: "Cold Storage", color: "cyan" },
  { value: "hazardous", label: "Hazardous Materials", color: "destructive" },
  { value: "bulk", label: "Bulk Storage", color: "amber" },
  { value: "distribution", label: "Distribution Center", color: "purple" },
  { value: "temporary", label: "Temporary Storage", color: "muted" },
];

export default function WarehousesPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [warehouses, setWarehouses] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [defectReports, setDefectReports] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState({});
  const [currentPage, setCurrentPage] = useState({});
  const [itemsPerPage] = useState(5);

  // Initialize active tab and current page for each warehouse
  useEffect(() => {
    const newActiveTab = {};
    const newCurrentPage = {};
    warehouses.forEach(warehouse => {
      newActiveTab[warehouse.id] = activeTab[warehouse.id] || "raw";
      newCurrentPage[warehouse.id] = currentPage[warehouse.id] || 1;
    });
    setActiveTab(prev => ({ ...prev, ...newActiveTab }));
    setCurrentPage(prev => ({ ...prev, ...newCurrentPage }));
  }, [warehouses]);

  // Fetch warehouses from subcollection: warehouses/{uid}/list
  useEffect(() => {
    if (!user) return;

    // Correct path: warehouses/{userId}/list
    const warehousesRef = collection(db, "warehouses", user.uid, "list");
    const q = query(warehousesRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const warehousesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setWarehouses(warehousesData);
        setLoadingData(false);
      },
      (err) => {
        console.error("Error fetching warehouses:", err);
        toast.error("Failed to load warehouses");
        setLoadingData(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Fetch raw materials
  useEffect(() => {
    if (!user) return;

    const materialsRef = collection(db, "rawMaterials", user.uid, "materials");
    const unsubscribe = onSnapshot(materialsRef, (snapshot) => {
      const materialsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRawMaterials(materialsData);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch finished products
  useEffect(() => {
    if (!user) return;

    const productsRef = collection(db, "finishedProducts", user.uid, "products");
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFinishedProducts(productsData);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch defect reports
  useEffect(() => {
    if (!user) return;

    const defectsRef = collection(db, "defectReports", user.uid, "reports");
    const unsubscribe = onSnapshot(defectsRef, (snapshot) => {
      const defectsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDefectReports(defectsData);
    });

    return () => unsubscribe();
  }, [user]);

  // Get items in warehouse
  const getItemsInWarehouse = (warehouseId, warehouseName) => {
    const materials = rawMaterials.filter(m => 
      m.warehouseId === warehouseId || 
      m.warehouseName === warehouseName ||
      m.location === warehouseName || 
      m.location === warehouseId
    );
    const products = finishedProducts.filter(p => 
      p.warehouseId === warehouseId || 
      p.warehouseName === warehouseName ||
      p.location === warehouseName || 
      p.location === warehouseId
    );
    const defects = defectReports.filter(d => 
      d.warehouseId === warehouseId || 
      d.warehouseName === warehouseName ||
      d.location === warehouseName || 
      d.location === warehouseId
    );
    return { materials, products, defects, total: materials.length + products.length + defects.length };
  };

  // Get warehouse stats
  const getWarehouseStats = (warehouse) => {
    const items = getItemsInWarehouse(warehouse.id, warehouse.name);
    const totalValue = [...items.materials, ...items.products].reduce((sum, item) => {
      if (item.unitPrice) return sum + (item.unitPrice * (item.quantity || 0));
      if (item.sellingPrice) return sum + (item.sellingPrice * (item.quantity || 0));
      return sum;
    }, 0);
    return { ...items, totalValue };
  };

  // Get paginated items for a specific warehouse
  const getPaginatedItems = (warehouseId, items) => {
    const page = currentPage[warehouseId] || 1;
    const startIndex = (page - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  // Filter and sort warehouses by total items (highest first)
  const filteredWarehouses = warehouses
    .filter(warehouse => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return warehouse.name?.toLowerCase().includes(searchLower) ||
               warehouse.location?.toLowerCase().includes(searchLower) ||
               warehouse.manager?.toLowerCase().includes(searchLower);
      }
      if (filterType !== "all") {
        return warehouse.type === filterType;
      }
      return true;
    })
    .sort((a, b) => {
      const statsA = getItemsInWarehouse(a.id, a.name);
      const statsB = getItemsInWarehouse(b.id, b.name);
      return statsB.total - statsA.total;
    });

  // Pagination Component for each warehouse
  const Pagination = ({ warehouseId, currentPage, totalPages }) => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-end gap-1 mt-2">
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">     
            <div className="absolute top-[30%] -right-[10%] h-[400px] w-[400px] rounded-full bg-indigo-500/15 blur-[120px] " />
            <div className="absolute bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-fuchsia-600/10 blur-[100px] " />
          </div>
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setCurrentPage(prev => ({ ...prev, [warehouseId]: 1 }))}
          disabled={currentPage === 1}
        >
          <IconChevronsLeft className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setCurrentPage(prev => ({ ...prev, [warehouseId]: currentPage - 1 }))}
          disabled={currentPage === 1}
        >
          <IconChevronLeft className="h-3 w-3" />
        </Button>
        <span className="text-[10px] text-muted-foreground px-1">
          {currentPage}/{totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setCurrentPage(prev => ({ ...prev, [warehouseId]: currentPage + 1 }))}
          disabled={currentPage === totalPages}
        >
          <IconChevronRight className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setCurrentPage(prev => ({ ...prev, [warehouseId]: totalPages }))}
          disabled={currentPage === totalPages}
        >
          <IconChevronsRight className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  // Get color scheme for warehouse type
  const getTypeColor = (type) => {
    const typeConfig = warehouseTypes.find(t => t.value === type);
    switch(typeConfig?.color) {
      case "primary": return "bg-primary/10 text-primary border-primary/20";
      case "cyan": return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
      case "destructive": return "bg-destructive/10 text-destructive border-destructive/20";
      case "amber": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "purple": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default: return "bg-muted text-muted-foreground border-border";
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
            <div className="text-center">
              <IconLoader className="animate-spin text-primary" size={32} />
              <p className="mt-2 text-muted-foreground">Loading warehouses...</p>
            </div>
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
                <CardDescription>Please log in to view warehouse management.</CardDescription>
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
        <SiteHeader />
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
            
            <div className="absolute top-[30%] -right-[10%] h-[400px] w-[400px] rounded-full bg-indigo-500/15 blur-[120px] animate-pulse delay-1000" />
            <div className="absolute bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-fuchsia-600/10 blur-[100px] animate-pulse delay-2000" />
          </div>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <IconBuildingWarehouse className="h-8 w-8 text-primary" />
                Warehouse Management
              </h2>
              <p className="text-muted-foreground">
                View warehouses, track inventory locations, and monitor storage
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Warehouses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{warehouses.length}</div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Active storage facilities
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {rawMaterials.length + finishedProducts.length + defectReports.length}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Materials & Products & Defects
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Storage Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {warehouses.length > 0 
                    ? Math.round((rawMaterials.filter(m => m.location).length + finishedProducts.filter(p => p.location).length) / (rawMaterials.length + finishedProducts.length || 1) * 100)
                    : 0}%
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Items with assigned locations
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Avg Items per Warehouse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {warehouses.length > 0 ? Math.round((rawMaterials.length + finishedProducts.length + defectReports.length) / warehouses.length) : 0}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Items per facility
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search warehouses by name, location, manager..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px] h-10">
                <IconBuildingWarehouse className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {warehouseTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSearchQuery(""); setFilterType("all"); }}
              className="h-10 px-3"
            >
              <IconRefresh className="h-4 w-4" />
            </Button>
          </div>

          {/* Warehouses Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredWarehouses.map((warehouse) => {
              const stats = getWarehouseStats(warehouse);
              const currentTab = activeTab[warehouse.id] || "raw";
              const currentItems = currentTab === "raw" ? stats.materials : currentTab === "finished" ? stats.products : stats.defects;
              const totalPages = Math.ceil(currentItems.length / itemsPerPage);
              const paginatedItems = getPaginatedItems(warehouse.id, currentItems);
              const typeColorClass = getTypeColor(warehouse.type);
              
              return (
                <Card key={warehouse.id} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                  <div className="h-1 bg-primary" />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <IconBuildingWarehouse className="h-5 w-5 text-primary mt-1" />
                        <div>
                          <CardTitle className="text-base font-semibold text-foreground">{warehouse.name}</CardTitle>
                          <div className="flex items-center gap-1 mt-1">
                            <IconLocation className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{warehouse.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Capacity and Type */}
                    <div className="flex items-center justify-between text-xs">
                      <Badge className={cn("text-[10px] font-normal", typeColorClass)}>
                        {warehouseTypes.find(t => t.value === warehouse.type)?.label || warehouse.type}
                      </Badge>
                      {warehouse.capacity && (
                        <span className="text-muted-foreground text-[10px]">Capacity: {warehouse.capacity} sq ft</span>
                      )}
                    </div>

                    {/* Manager Info if exists */}
                    {(warehouse.manager || warehouse.phone) && (
                      <div className="text-[10px] text-muted-foreground border-t border-border/50 pt-2">
                        {warehouse.manager && <div>Manager: {warehouse.manager}</div>}
                        {warehouse.phone && <div>Contact: {warehouse.phone}</div>}
                      </div>
                    )}

                    {/* Items Count Summary */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <button
                        onClick={() => setActiveTab(prev => ({ ...prev, [warehouse.id]: "raw" }))}
                        className={cn(
                          "text-center p-2 rounded-lg transition-all",
                          currentTab === "raw" 
                            ? "bg-primary/10 border border-primary/20" 
                            : "bg-muted/50 border border-border hover:bg-muted"
                        )}
                      >
                        <IconPackage className={cn("h-4 w-4 mx-auto mb-1", currentTab === "raw" ? "text-primary" : "text-muted-foreground")} />
                        <p className="text-lg font-semibold text-foreground">{stats.materials.length}</p>
                        <p className="text-[10px] text-muted-foreground">Raw Materials</p>
                      </button>
                      <button
                        onClick={() => setActiveTab(prev => ({ ...prev, [warehouse.id]: "finished" }))}
                        className={cn(
                          "text-center p-2 rounded-lg transition-all",
                          currentTab === "finished" 
                            ? "bg-primary/10 border border-primary/20" 
                            : "bg-muted/50 border border-border hover:bg-muted"
                        )}
                      >
                        <IconBox className={cn("h-4 w-4 mx-auto mb-1", currentTab === "finished" ? "text-primary" : "text-muted-foreground")} />
                        <p className="text-lg font-semibold text-foreground">{stats.products.length}</p>
                        <p className="text-[10px] text-muted-foreground">Finished Goods</p>
                      </button>
                      <button
                        onClick={() => setActiveTab(prev => ({ ...prev, [warehouse.id]: "defect" }))}
                        className={cn(
                          "text-center p-2 rounded-lg transition-all",
                          currentTab === "defect" 
                            ? "bg-destructive/10 border border-destructive/20" 
                            : "bg-muted/50 border border-border hover:bg-muted"
                        )}
                      >
                        <IconBug className={cn("h-4 w-4 mx-auto mb-1", currentTab === "defect" ? "text-destructive" : "text-muted-foreground")} />
                        <p className="text-lg font-semibold text-foreground">{stats.defects.length}</p>
                        <p className="text-[10px] text-muted-foreground">Defect Reports</p>
                      </button>
                    </div>

                    {/* Items Table */}
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {currentTab === "raw" ? "Raw Materials" : currentTab === "finished" ? "Finished Products" : "Defect Reports"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {currentItems.length} total
                        </span>
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {paginatedItems.length > 0 ? (
                          paginatedItems.map((item, idx) => (
                            <div key={item.id} className="flex items-center justify-between text-[10px] py-2 border-b border-border/30">
                              <div className="flex items-center gap-2 flex-1">
                                {currentTab === "raw" && <IconPackage className="h-3 w-3 text-primary" />}
                                {currentTab === "finished" && <IconBox className="h-3 w-3 text-primary" />}
                                {currentTab === "defect" && <IconBug className="h-3 w-3 text-destructive" />}
                                <span className="font-mono text-foreground">{item.batchNumber || item.sku || `#${idx + 1}`}</span>
                                <span className="text-muted-foreground truncate">{item.name || item.productName || "Unknown"}</span>
                              </div>
                              <div className="flex items-center gap-3 ml-2">
                                {currentTab === "defect" ? (
                                  <>
                                    <span className="text-muted-foreground whitespace-nowrap">{item.quantity} {item.unit}</span>
                                    <span className="text-destructive whitespace-nowrap">${item.totalLoss?.toLocaleString()}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-muted-foreground whitespace-nowrap">{item.quantity} {item.unit}</span>
                                    <span className="text-foreground whitespace-nowrap">${(item.unitPrice || item.sellingPrice)?.toLocaleString()}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-[10px] text-muted-foreground py-4">
                            No {currentTab === "raw" ? "raw materials" : currentTab === "finished" ? "finished products" : "defect reports"} found
                          </p>
                        )}
                      </div>
                      
                      {/* Pagination */}
                      <Pagination 
                        warehouseId={warehouse.id}
                        currentPage={currentPage[warehouse.id] || 1}
                        totalPages={totalPages}
                      />
                    </div>

                    {/* Total Value */}
                    {stats.totalValue > 0 && (
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Total Inventory Value</span>
                          <span className="font-semibold text-foreground">${stats.totalValue.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredWarehouses.length === 0 && (
            <div className="text-center py-12">
              <IconBuildingWarehouse className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No warehouses found</p>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}