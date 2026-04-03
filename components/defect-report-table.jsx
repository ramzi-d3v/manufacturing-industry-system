// components/defect-report-table.jsx
"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconGripVertical,
  IconPackage,
  IconTrash,
  IconTruck,
  IconBuildingWarehouse,
  IconScale,
  IconCurrencyDollar,
  IconBuildingStore,
  IconCalendarEvent,
  IconUser,
  IconAlertTriangle,
  IconHash,
  IconMapPin,
  IconNotes,
  IconFileReport,
  IconCalendar,
  IconCheck,
  IconClock,
  IconX,
  IconBarcode,
  IconPhone,
  IconMail,
  IconBug,
} from "@tabler/icons-react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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

// Defect source options
const defectSourceOptions = [
  { value: "supplier", label: "Supplier Defect", icon: IconBuildingStore },
  { value: "warehouse", label: "Warehouse Damage", icon: IconBuildingWarehouse },
  { value: "handling", label: "Handling Damage", icon: IconTruck },
  { value: "storage", label: "Storage Issue", icon: IconBuildingWarehouse },
];

// Status color mapping
const getStatusColor = (status) => {
  switch (status) {
    case "Resolved":
      return "bg-green-500/10 text-green-600 dark:text-green-400";
    case "Under Investigation":
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    case "Reported to Supplier":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "Credit Note Issued":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
    case "Written Off":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    default:
      return "bg-muted text-muted-foreground";
  }
};

// Drag handle component
function DragHandle({ id }) {
  const { attributes, listeners } = useSortable({ id });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="h-7 w-7 hover:bg-transparent cursor-grab active:cursor-grabbing"
    >
      <IconGripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

// Draggable row component
function DraggableRow({ row }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} className="py-2.5 text-sm">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

// Report Viewer Dialog
function ReportViewerDialog({ report, open, onOpenChange, onEdit, onDelete }) {
  const getRiskLevelColor = (risk_level) => {
    switch (risk_level) {
      case "High":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "Medium":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      case "Low":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (!report) return null;

  const totalLoss = (report.quantity || 0) * (report.costPerUnit || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] md:w-[85vw] md:max-w-[85vw] lg:w-[80vw] lg:max-w-[80vw] xl:w-[70vw] xl:max-w-[70vw] max-h-[90vh] p-4 sm:p-6 gap-4 bg-background/95 backdrop-blur-md border-border/50 overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <IconBug className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Defect Report Details
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1">
              <IconHash className="h-3 w-3" />
              Report ID: {report.id?.slice(0, 8)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <IconCalendar className="h-3 w-3" />
              Date: {report.defectDate}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <IconClock className="h-3 w-3" />
              Reported: {report.reportDate}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Material Info */}
            <div className="p-3 sm:p-4 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <IconPackage className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Material</p>
                    <p className="text-base font-medium mt-0.5">{report.materialName}</p>
                    {report.materialId && (
                      <p className="text-[10px] text-muted-foreground">ID: {report.materialId?.slice(0, 8)}</p>
                    )}
                  </div>
                </div>
                <Badge className={cn("text-[10px] sm:text-xs", getRiskLevelColor(report.risk_level))}>
                  Risk: {report.risk_level}
                </Badge>
              </div>
            </div>

            {/* Batch Information */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <IconBarcode className="h-3.5 w-3.5" />
                Batch Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Batch Number</p>
                  <p className="font-mono text-sm">{report.batchNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unit</p>
                  <p>{report.unit || "kg"}</p>
                </div>
              </div>
            </div>

            {/* Defect Information */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <IconBug className="h-3.5 w-3.5" />
                Defect Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Defect Type</p>
                  <p>{report.defectType || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Defect Source</p>
                  <Badge variant="outline" className="text-[10px] mt-1">
                    {defectSourceOptions.find(o => o.value === report.defectSource)?.label || report.defectSource}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Location */}
            {(report.location || report.warehouseName) && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <IconMapPin className="h-3.5 w-3.5" />
                  Location
                </h3>
                <p className="text-sm">{report.warehouseName || report.location || "N/A"}</p>
                {report.warehouseId && (
                  <p className="text-[10px] text-muted-foreground">ID: {report.warehouseId?.slice(0, 8)}</p>
                )}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Supplier Information */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <IconBuildingStore className="h-3.5 w-3.5" />
                Supplier Information
              </h3>
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <p className="font-medium text-sm">{report.supplierName || report.supplier || "N/A"}</p>
                {report.supplierId && (
                  <p className="text-[10px] text-muted-foreground">ID: {report.supplierId?.slice(0, 8)}</p>
                )}
                {report.supplierContact && (
                  <div className="flex items-center gap-2 text-xs">
                    <IconUser className="h-3 w-3 text-muted-foreground" />
                    <span>{report.supplierContact}</span>
                  </div>
                )}
                {report.supplierPhone && (
                  <div className="flex items-center gap-2 text-xs">
                    <IconPhone className="h-3 w-3 text-muted-foreground" />
                    <span>{report.supplierPhone}</span>
                  </div>
                )}
                {report.supplierEmail && (
                  <div className="flex items-center gap-2 text-xs">
                    <IconMail className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{report.supplierEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Details */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <IconCurrencyDollar className="h-3.5 w-3.5" />
                Financial Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-muted/30 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">Quantity</p>
                  <p className="text-sm font-medium">{report.quantity} {report.unit}</p>
                </div>
                <div className="p-2 bg-muted/30 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">Cost/Unit</p>
                  <p className="text-sm font-medium">${report.costPerUnit}</p>
                </div>
                <div className="p-2 bg-destructive/10 rounded-lg col-span-2">
                  <p className="text-[10px] text-muted-foreground">Total Loss</p>
                  <p className="text-lg font-bold text-destructive">${totalLoss.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Status & Reporting */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <IconClock className="h-3.5 w-3.5" />
                Status & Reporting
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={cn("text-[10px] mt-1", getStatusColor(report.status))}>
                    {report.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reported By</p>
                  <p className="text-sm">{report.reportedBy || "System"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description - Full Width */}
        {report.description && (
          <div className="pt-3 border-t border-border/50">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <IconNotes className="h-3.5 w-3.5" />
              Description
            </h3>
            <p className="text-sm text-muted-foreground">{report.description}</p>
          </div>
        )}

        {/* Action Taken - Full Width */}
        {report.actionTaken && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <IconFileReport className="h-3.5 w-3.5" />
              Action Taken
            </h3>
            <p className="text-sm text-muted-foreground">{report.actionTaken}</p>
          </div>
        )}

        <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onEdit(report);
            }}
          >
            <IconEdit className="mr-2 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onDelete(report.id);
            }}
          >
            <IconTrash className="mr-2 h-3.5 w-3.5" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Edit Report Component - Uses same data structure as add
function ReportEditor({ report, open, onOpenChange, onSave }) {
  const [formData, setFormData] = React.useState(null);
  const [suppliers, setSuppliers] = React.useState([]);
  const [warehouses, setWarehouses] = React.useState([]);
  const [rawMaterials, setRawMaterials] = React.useState([]);
  const [selectedSupplierDetails, setSelectedSupplierDetails] = React.useState(null);
  const [selectedWarehouseDetails, setSelectedWarehouseDetails] = React.useState(null);

  // Fetch data from Firestore
  React.useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Fetch suppliers from root suppliers collection
        const suppliersRef = collection(db, "suppliers");
        const suppliersSnap = await getDocs(suppliersRef);
        setSuppliers(suppliersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const warehousesRef = collection(db, "warehouses", user.uid, "list");
        const warehousesSnap = await getDocs(warehousesRef);
        setWarehouses(warehousesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const materialsRef = collection(db, "rawMaterials", user.uid, "materials");
        const materialsSnap = await getDocs(materialsRef);
        setRawMaterials(materialsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  React.useEffect(() => {
    if (report) {
      setFormData({ ...report });
      
      if (report.supplierId) {
        const supplier = suppliers.find(s => s.id === report.supplierId);
        if (supplier) setSelectedSupplierDetails(supplier);
      }
      
      if (report.warehouseId) {
        const warehouse = warehouses.find(w => w.id === report.warehouseId);
        if (warehouse) setSelectedWarehouseDetails(warehouse);
      }
    }
  }, [report, suppliers, warehouses]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (formData) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNumberChange = (name, value) => {
    if (formData) {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    }
  };

  const handleSelectChange = (name, value) => {
    if (formData) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (name === "supplierId") {
      const supplier = suppliers.find(s => s.id === value);
      if (supplier) {
        setFormData(prev => ({
          ...prev,
          supplierName: supplier.name,
          supplierContact: supplier.contact || "",
          supplierPhone: supplier.phone || "",
          supplierEmail: supplier.email || "",
        }));
        setSelectedSupplierDetails(supplier);
      }
    }

    if (name === "warehouseId") {
      const warehouse = warehouses.find(w => w.id === value);
      if (warehouse) {
        setFormData(prev => ({
          ...prev,
          warehouseName: warehouse.name,
          location: warehouse.location,
        }));
        setSelectedWarehouseDetails(warehouse);
      }
    }

    if (name === "materialId") {
      const material = rawMaterials.find(m => m.id === value);
      if (material) {
        setFormData(prev => ({
          ...prev,
          materialName: material.name,
          materialId: material.id,
          unit: material.unit || "kg",
          costPerUnit: material.unitPrice?.toString() || "",
          batchNumber: material.batchNumber || "",
          supplierId: material.supplierId || "",
          supplierName: material.supplierName || "",
          warehouseId: material.warehouseId || "",
          warehouseName: material.warehouseName || "",
          location: material.location || "",
        }));
        
        if (material.supplierId) {
          const supplier = suppliers.find(s => s.id === material.supplierId);
          if (supplier) setSelectedSupplierDetails(supplier);
        }
        if (material.warehouseId) {
          const warehouse = warehouses.find(w => w.id === material.warehouseId);
          if (warehouse) setSelectedWarehouseDetails(warehouse);
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData) return;
    
    if (!formData.materialName || !formData.quantity || !formData.costPerUnit) {
      toast.error("Please fill in all required fields");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast.error("You must be logged in to update reports");
      return;
    }

    try {
      const reportRef = doc(db, "defectReports", user.uid, "reports", formData.id);
      const totalLoss = (formData.quantity || 0) * (formData.costPerUnit || 0);
      
      const updatedData = {
        ...formData,
        totalLoss,
        updatedAt: new Date().toISOString(),
      };
      delete updatedData.id;
      
      await updateDoc(reportRef, updatedData);
      toast.success("Report updated successfully!");
      onSave(formData);
      onOpenChange(false);
    } catch (err) {
      console.error("Error updating report:", err);
      toast.error("Failed to update report: " + err.message);
    }
  };

  if (!report || !formData) return null;

  const totalLoss = (formData.quantity || 0) * (formData.costPerUnit || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] md:w-[85vw] md:max-w-[85vw] lg:w-[80vw] lg:max-w-[80vw] xl:w-[75vw] xl:max-w-[75vw] max-h-[90vh] p-4 sm:p-6 gap-4 bg-background/95 backdrop-blur-md border-border/50 overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <IconEdit className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Edit Defect Report
          </DialogTitle>
          <DialogDescription>
            Update the defect report details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-4">
          {/* Material Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
              <IconPackage className="h-4 w-4 text-primary" />
              Material Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Material</label>
                <Select value={formData.materialId || ""} onValueChange={(value) => handleSelectChange("materialId", value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a material" />
                  </SelectTrigger>
                  <SelectContent>
                    {rawMaterials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        <div className="flex flex-col">
                          <span>{material.name}</span>
                          <span className="text-xs text-muted-foreground">Batch: {material.batchNumber}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Material Name *</label>
                  <Input
                    name="materialName"
                    value={formData.materialName || ""}
                    onChange={handleInputChange}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Batch Number</label>
                  <Input
                    name="batchNumber"
                    value={formData.batchNumber || ""}
                    onChange={handleInputChange}
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
              <IconBuildingStore className="h-4 w-4 text-primary" />
              Supplier Information
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Supplier</label>
                <Select value={formData.supplierId || ""} onValueChange={(value) => handleSelectChange("supplierId", value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedSupplierDetails && (
                <div className="bg-muted/30 p-3 rounded-lg space-y-1">
                  <p className="text-xs text-muted-foreground">Contact: {selectedSupplierDetails.contact || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">Phone: {selectedSupplierDetails.phone || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">Email: {selectedSupplierDetails.email || "N/A"}</p>
                </div>
              )}
            </div>
          </div>

          {/* Warehouse Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
              <IconBuildingWarehouse className="h-4 w-4 text-primary" />
              Warehouse Location
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Warehouse</label>
                <Select value={formData.warehouseId || ""} onValueChange={(value) => handleSelectChange("warehouseId", value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedWarehouseDetails && (
                <div className="bg-muted/30 p-3 rounded-lg space-y-1">
                  <p className="text-xs text-muted-foreground">Location: {selectedWarehouseDetails.location || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">Manager: {selectedWarehouseDetails.manager || "N/A"}</p>
                </div>
              )}
            </div>
          </div>

          {/* Defect Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
              <IconBug className="h-4 w-4 text-primary" />
              Defect Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Defect Date</label>
                <Input
                  name="defectDate"
                  type="date"
                  value={formData.defectDate || ""}
                  onChange={handleInputChange}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Defect Type</label>
                <Input
                  name="defectType"
                  value={formData.defectType || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., Quality Issue"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Defect Source</label>
                <Select value={formData.defectSource || "supplier"} onValueChange={(value) => handleSelectChange("defectSource", value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {defectSourceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Risk Level</label>
                <Select value={formData.risk_level || "Medium"} onValueChange={(value) => handleSelectChange("risk_level", value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
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

          {/* Quantity and Cost */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
              <IconCurrencyDollar className="h-4 w-4 text-primary" />
              Quantity & Cost
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity *</label>
                <Input
                  name="quantity"
                  type="number"
                  step="0.01"
                  value={formData.quantity || ""}
                  onChange={(e) => handleNumberChange("quantity", e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit</label>
                <Input
                  name="unit"
                  value={formData.unit || "kg"}
                  onChange={handleInputChange}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cost/Unit *</label>
                <Input
                  name="costPerUnit"
                  type="number"
                  step="0.01"
                  value={formData.costPerUnit || ""}
                  onChange={(e) => handleNumberChange("costPerUnit", e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
            <div className="p-3 bg-destructive/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Loss</p>
              <p className="text-xl font-bold text-destructive">${totalLoss.toLocaleString()}</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              name="description"
              value={formData.description || ""}
              onChange={handleInputChange}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Status & Action */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
              <IconClock className="h-4 w-4 text-primary" />
              Status & Action
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={formData.status || "Reported to Supplier"} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
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
                  value={formData.reportedBy || ""}
                  onChange={handleInputChange}
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Action Taken</label>
              <Textarea
                name="actionTaken"
                value={formData.actionTaken || ""}
                onChange={handleInputChange}
                rows={2}
                placeholder="What action has been taken?"
                className="resize-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <IconEdit className="mr-2 h-4 w-4" />
            Update Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main DataTable component
export function DefectReportTable({
  data,
  onUpdate,
  onDelete,
}) {
  const [tableData, setTableData] = React.useState(data);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState({
    defectType: false,
  });
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [sorting, setSorting] = React.useState([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [viewingReport, setViewingReport] = React.useState(null);
  const [editingReport, setEditingReport] = React.useState(null);
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  React.useEffect(() => {
    setTableData(data);
  }, [data]);

  const dataIds = React.useMemo(
    () => tableData?.map(({ id }) => id) || [],
    [tableData]
  );

  const handleView = (report) => {
    setViewingReport(report);
    setViewDialogOpen(true);
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedReport) => {
    onUpdate(updatedReport);
    setEditingReport(null);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this report?")) {
      onDelete(id);
    }
  };

  const columns = React.useMemo(
    () => [
      {
        id: "drag",
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
        size: 45,
      },
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
              className="h-3.5 w-3.5"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              className="h-3.5 w-3.5"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 45,
      },
      {
        accessorKey: "materialName",
        header: "Material",
        cell: ({ row }) => {
          const report = row.original;
          return (
            <Button
              variant="link"
              className="font-medium text-left hover:underline p-0 h-auto text-sm"
              onClick={() => handleView(report)}
            >
              <IconPackage className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <span className="truncate max-w-[120px] md:max-w-[180px]">{report.materialName}</span>
            </Button>
          );
        },
        size: isMobile ? 160 : 200,
      },
      {
        accessorKey: "supplierName",
        header: "Supplier",
        cell: ({ row }) => (
          <div className="text-sm flex items-center gap-1">
            <IconBuildingStore className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden sm:inline" />
            <span className="truncate max-w-[120px]">{row.original.supplierName || row.original.supplier || "N/A"}</span>
          </div>
        ),
        size: isMobile ? 130 : 160,
      },
      {
        accessorKey: "defectType",
        header: "Type",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground truncate max-w-[100px]">
            {row.original.defectType || "N/A"}
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: "risk_level",
        header: "Risk",
        cell: ({ row }) => {
          const risk_level = row.original.risk_level;
          let colorClass = "";
          switch (risk_level) {
            case "High":
              colorClass = "bg-red-500/10 text-red-600 dark:text-red-400";
              break;
            case "Medium":
              colorClass = "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
              break;
            case "Low":
              colorClass = "bg-green-500/10 text-green-600 dark:text-green-400";
              break;
            default:
              colorClass = "bg-muted text-muted-foreground";
          }
          return (
            <Badge className={`${colorClass} text-[11px] px-1.5 py-0`}>
              {risk_level}
            </Badge>
          );
        },
        size: 70,
      },
      {
        accessorKey: "defectSource",
        header: "Source",
        cell: ({ row }) => {
          const source = row.original.defectSource;
          return (
            <Badge
              variant="outline"
              className="flex items-center gap-1 text-[11px] px-1.5 py-0"
            >
              {source === "supplier" ? (
                <IconTruck className="h-2.5 w-2.5" />
              ) : (
                <IconBuildingWarehouse className="h-2.5 w-2.5" />
              )}
              <span className="hidden sm:inline">
                {source === "supplier" ? "Supplier" : "Warehouse"}
              </span>
            </Badge>
          );
        },
        size: 100,
      },
      {
        accessorKey: "quantity",
        header: "Qty",
        cell: ({ row }) => (
          <div className="text-sm flex items-center gap-1 whitespace-nowrap">
            <IconScale className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>{row.original.quantity}</span>
            <span className="text-muted-foreground text-[11px]">{row.original.unit}</span>
          </div>
        ),
        size: 90,
      },
      {
        accessorKey: "totalLoss",
        header: "Loss",
        cell: ({ row }) => {
          const totalLoss = (row.original.quantity || 0) * (row.original.costPerUnit || 0);
          return (
            <div className="text-sm font-medium text-destructive flex items-center gap-1 whitespace-nowrap">
              <IconCurrencyDollar className="h-3.5 w-3.5 shrink-0" />
              <span>${totalLoss.toLocaleString()}</span>
            </div>
          );
        },
        size: 110,
      },
      {
        accessorKey: "defectDate",
        header: "Date",
        cell: ({ row }) => (
          <div className="text-sm flex items-center gap-1 whitespace-nowrap">
            <IconCalendarEvent className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>{row.original.defectDate}</span>
          </div>
        ),
        size: 100,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const report = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-7 w-7 p-0">
                  <span className="sr-only">Open menu</span>
                  <IconDotsVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => handleView(report)} className="text-sm">
                  <IconEye className="mr-2 h-3.5 w-3.5" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(report)} className="text-sm">
                  <IconEdit className="mr-2 h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(report.id)}
                  className="text-destructive text-sm"
                >
                  <IconTrash className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 50,
      },
    ],
    [isMobile]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setTableData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border/50 bg-background/40 backdrop-blur-sm">
        <div className="min-w-[1050px] md:min-w-full">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead 
                        key={header.id} 
                        colSpan={header.colSpan}
                        className="text-sm font-medium py-2.5"
                        style={{ width: header.column.columnDef.size }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                      No defect reports found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3">
        <div className="text-sm text-muted-foreground hidden sm:block">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} selected
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <Label htmlFor="rows-per-page" className="text-sm hidden sm:block">
              Rows
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-7 w-16 text-sm" id="rows-per-page">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`} className="text-sm">
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* View Dialog */}
      <ReportViewerDialog
        report={viewingReport}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Edit Dialog */}
      <ReportEditor
        report={editingReport}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
      />
    </>
  );
}