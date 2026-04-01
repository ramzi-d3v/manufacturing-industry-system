// components/raw-material-table.jsx
"use client";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import * as React from "react";
import { IconCircleCheck, IconAlertTriangle, IconX } from "@tabler/icons-react";
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
  IconScale,
  IconCurrencyDollar,
  IconBuildingStore,
  IconAlertCircle,
  IconBarcode,
  IconLocation,
  IconClipboard,
  IconBuildingWarehouse,
  IconBox,
  IconUser,
  IconPhone,
  IconMail,
  IconMapPin,
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

// Unit options matching the popup
const unitOptions = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "lb", label: "Pounds (lb)" },
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "roll", label: "Rolls" },
  { value: "sheet", label: "Sheets" },
  { value: "meter", label: "Meters (m)" },
  { value: "m2", label: "Square Meters (m²)" },
  { value: "liter", label: "Liters (L)" },
];

// Material types
const materialTypes = [
  { value: "raw", label: "Raw Material" },
  { value: "packaging", label: "Packaging Material" },
  { value: "chemical", label: "Chemical" },
  { value: "hardware", label: "Hardware" },
  { value: "electronics", label: "Electronics" },
  { value: "other", label: "Other" },
];

// Status options
const statuses = [
  { value: "In Stock", label: "In Stock", color: "text-green-600", bg: "bg-green-500/10" },
  { value: "Out of Stock", label: "Out of Stock", color: "text-red-600", bg: "bg-red-500/10" },
];

// Status icon mapping
const getStatusIcon = (status) => {
  switch (status) {
    case "In Stock":
      return <IconCircleCheck className="h-4 w-4 text-green-500" />;
    case "Out of Stock":
      return <IconX className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
};

// Status color mapping
const getStatusColor = (status) => {
  switch (status) {
    case "In Stock":
      return "bg-green-500/10 text-green-600 dark:text-green-400";
    case "Out of Stock":
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

// View Material Dialog with glass effect
function MaterialViewerDialog({ material, open, onOpenChange, onEdit, onDelete }) {
  if (!material) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  const totalValue = (material.quantity || 0) * (material.unitPrice || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] md:w-[85vw] md:max-w-[85vw] lg:w-[80vw] lg:max-w-[80vw] xl:w-[70vw] xl:max-w-[70vw] p-4 sm:p-6 gap-4 bg-background/80 backdrop-blur-md border-border/50 max-h-[90vh] overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <IconPackage className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Material Details
          </DialogTitle>
          <DialogDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs">
            <span className="flex items-center gap-1">
              <IconBarcode className="h-3 w-3" />
              Batch: {material.batchNumber || material.sku || "N/A"}
            </span>
            <span className="hidden sm:inline">•</span>
            <span>Added: {formatDate(material.createdAt)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Basic Information */}
          <div className="space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge className={cn("text-[10px] sm:text-xs", getStatusColor(material.status))}>
                  {material.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-base sm:text-lg mt-2">{material.name}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {materialTypes.find(t => t.value === material.type)?.label || material.type} • {material.category}
              </p>
            </div>

            <div>
              <h4 className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-2">
                <IconBuildingStore className="h-3 w-3 sm:h-4 sm:w-4" />
                Supplier
              </h4>
              <p className="text-sm">{material.supplierName || "N/A"}</p>
              {material.supplierContact && (
                <p className="text-xs text-muted-foreground mt-1">Contact: {material.supplierContact}</p>
              )}
            </div>

            <div>
              <h4 className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-2">
                <IconBuildingWarehouse className="h-3 w-3 sm:h-4 sm:w-4" />
                Warehouse
              </h4>
              <p className="text-sm">{material.warehouseName || "Not assigned"}</p>
              {material.location && (
                <p className="text-xs text-muted-foreground mt-1">Location: {material.location}</p>
              )}
            </div>

            {material.description && (
              <div>
                <h4 className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-2">
                  <IconClipboard className="h-3 w-3 sm:h-4 sm:w-4" />
                  Description
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground">{material.description}</p>
              </div>
            )}
          </div>

          {/* Stock and Pricing */}
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-muted/30">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Quantity</p>
                <p className="text-lg sm:text-xl font-semibold">
                  {material.quantity || 0} <span className="text-xs sm:text-sm font-normal text-muted-foreground">{material.unit}</span>
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-muted/30">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Unit Price</p>
                <p className="text-lg sm:text-xl font-semibold">
                  ${material.unitPrice || 0} <span className="text-xs sm:text-sm font-normal text-muted-foreground">per {material.unit}</span>
                </p>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-primary/5 rounded-lg">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total Inventory Value</p>
              <p className="text-base sm:text-lg font-bold text-primary">
                ${totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
            Close
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onOpenChange(false);
              onEdit(material);
            }}
            size="sm"
          >
            <IconEdit className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              onDelete(material.id);
            }}
            size="sm"
          >
            <IconTrash className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Edit Material Dialog - Fetches suppliers and warehouses from Firestore, categories are static
function MaterialEditor({ material, open, onOpenChange, onSave }) {
  const [formData, setFormData] = React.useState(null);
  const [selectedSupplierDetails, setSelectedSupplierDetails] = React.useState(null);
  const [selectedWarehouseDetails, setSelectedWarehouseDetails] = React.useState(null);
  
  // Data from Firestore
  const [suppliers, setSuppliers] = React.useState([]);
  const [warehouses, setWarehouses] = React.useState([]);

  // Static categories (from frontend)
  const categories = [
    "Raw Material",
    "Component",
    "Packaging",
    "Hardware",
    "Chemicals",
    "Electronics",
    "Textiles",
    "Consumables",
  ];

  // Unit options
  const unitOptions = [
    { value: "kg", label: "Kilograms (kg)" },
    { value: "g", label: "Grams (g)" },
    { value: "lb", label: "Pounds (lb)" },
    { value: "pcs", label: "Pieces (pcs)" },
    { value: "roll", label: "Rolls" },
    { value: "sheet", label: "Sheets" },
    { value: "meter", label: "Meters (m)" },
    { value: "m2", label: "Square Meters (m²)" },
    { value: "liter", label: "Liters (L)" },
  ];

  // Material types
  const materialTypes = [
    { value: "raw", label: "Raw Material" },
    { value: "packaging", label: "Packaging Material" },
    { value: "chemical", label: "Chemical" },
    { value: "hardware", label: "Hardware" },
    { value: "electronics", label: "Electronics" },
    { value: "other", label: "Other" },
  ];

  // Status options
  const statusOptions = [
    { value: "In Stock", label: "In Stock" },
    { value: "Out of Stock", label: "Out of Stock" },
  ];

  // Fetch suppliers from Firestore
  React.useEffect(() => {
    const fetchSuppliers = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const suppliersRef = collection(db, "suppliers", user.uid, "list");
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

    if (open) {
      fetchSuppliers();
    }
  }, [open]);

  // Fetch warehouses from Firestore
  React.useEffect(() => {
    const fetchWarehouses = async () => {
      const user = auth.currentUser;
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

    if (open) {
      fetchWarehouses();
    }
  }, [open]);

  React.useEffect(() => {
    if (material && open) {
      setFormData({
        name: material.name || "",
        batchNumber: material.batchNumber || material.sku || "",
        supplierId: material.supplierId || "",
        supplierName: material.supplierName || "",
        supplierContact: material.supplierContact || "",
        supplierPhone: material.supplierPhone || "",
        supplierEmail: material.supplierEmail || "",
        category: material.category || "",
        type: material.type || "raw",
        unit: material.unit || "kg",
        quantity: material.quantity?.toString() || "",
        unitPrice: material.unitPrice?.toString() || "",
        description: material.description || "",
        location: material.location || "",
        warehouseId: material.warehouseId || "",
        warehouseName: material.warehouseName || "",
        status: material.status || "In Stock",
      });

      // Set selected supplier details
      if (material.supplierId) {
        const supplier = suppliers.find(s => s.id === material.supplierId);
        if (supplier) {
          setSelectedSupplierDetails(supplier);
        }
      }

      // Set selected warehouse details
      if (material.warehouseId) {
        const warehouse = warehouses.find(w => w.id === material.warehouseId);
        if (warehouse) {
          setSelectedWarehouseDetails(warehouse);
        }
      }
    }
  }, [material, open, suppliers, warehouses]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (formData) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNumberChange = (name, value) => {
    if (formData) {
      setFormData(prev => ({ ...prev, [name]: value === "" ? "" : parseFloat(value) }));
    }
  };

  const handleSelectChange = (name, value) => {
    if (formData) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (name === "supplierId") {
      const selectedSupplier = suppliers.find(s => s.id === value);
      if (selectedSupplier) {
        setFormData(prev => ({
          ...prev,
          supplierName: selectedSupplier.name,
          supplierContact: selectedSupplier.contact || "",
          supplierPhone: selectedSupplier.phone || "",
          supplierEmail: selectedSupplier.email || "",
        }));
        setSelectedSupplierDetails(selectedSupplier);
      } else {
        setSelectedSupplierDetails(null);
      }
    }

    if (name === "warehouseId") {
      const selectedWarehouse = warehouses.find(w => w.id === value);
      if (selectedWarehouse) {
        setFormData(prev => ({
          ...prev,
          warehouseName: selectedWarehouse.name,
          location: selectedWarehouse.location,
        }));
        setSelectedWarehouseDetails(selectedWarehouse);
      } else {
        setSelectedWarehouseDetails(null);
      }
    }
  };

  const totalValue = (formData?.quantity && formData?.unitPrice)
    ? (parseFloat(formData.quantity) * parseFloat(formData.unitPrice)).toFixed(2)
    : 0;

  const handleSubmit = () => {
    if (!formData) return;

    if (!formData.name.trim()) {
      toast.error("Material name is required");
      return;
    }
    if (!formData.batchNumber.trim()) {
      toast.error("Batch number is required");
      return;
    }
    if (!formData.supplierId) {
      toast.error("Please select a supplier");
      return;
    }
    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const updatedMaterial = {
      ...formData,
      quantity: parseFloat(formData.quantity) || 0,
      unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : 0,
      totalValue: parseFloat(totalValue),
    };
    onSave(updatedMaterial);
    onOpenChange(false);
  };

  if (!material || !formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] md:w-[85vw] md:max-w-[85vw] lg:w-[80vw] lg:max-w-[80vw] xl:w-[75vw] xl:max-w-[75vw] h-[90vh] max-h-[90vh] p-4 sm:p-6 gap-4 bg-background/80 backdrop-blur-md border-border/50 overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <IconEdit className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Edit Raw Material
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Update the material details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          {/* Basic Information Section */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <IconAlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Material Name *</Label>
                <Input
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., Stainless Steel Sheet"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="flex items-center gap-2 text-xs sm:text-sm">
                  <IconBarcode className="h-3 w-3 sm:h-4 sm:w-4" />
                  Batch Number *
                </Label>
                <Input
                  name="batchNumber"
                  value={formData.batchNumber || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., BATCH-2024-001"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Material Type</Label>
                <Select
                  value={formData.type || "raw"}
                  onValueChange={(value) => handleSelectChange("type", value)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {materialTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-sm">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Category *</Label>
                <Select
                  value={formData.category || ""}
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-sm">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Status</Label>
                <Select
                  value={formData.status || "In Stock"}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value} className="text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${status.value === "In Stock" ? "bg-green-500" : "bg-red-500"}`} />
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Quantity and Pricing Section */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <IconBox className="h-3 w-3 sm:h-4 sm:w-4" />
              Quantity & Pricing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Quantity *</Label>
                <Input
                  name="quantity"
                  type="number"
                  step="0.01"
                  value={formData.quantity || ""}
                  onChange={(e) => handleNumberChange("quantity", e.target.value)}
                  placeholder="0.00"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Unit of Measure</Label>
                <Select
                  value={formData.unit || "kg"}
                  onValueChange={(value) => handleSelectChange("unit", value)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-sm">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Unit Price ($)</Label>
                <Input
                  name="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice || ""}
                  onChange={(e) => handleNumberChange("unitPrice", e.target.value)}
                  placeholder="0.00"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Total Value</Label>
                <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center text-sm font-semibold">
                  ${totalValue.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Warehouse Selection Section */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <IconBuildingWarehouse className="h-3 w-3 sm:h-4 sm:w-4" />
              Warehouse Location
            </h3>
            <div className="space-y-3">
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Select Warehouse</Label>
                <Select
                  value={formData.warehouseId || ""}
                  onValueChange={(value) => handleSelectChange("warehouseId", value)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder={warehouses.length === 0 ? "No warehouses found" : "Select warehouse"} />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No warehouses available</div>
                    ) : (
                      warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id} className="text-sm">
                          <div className="flex flex-col">
                            <span>{warehouse.name}</span>
                            <span className="text-xs text-muted-foreground">{warehouse.location}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedWarehouseDetails && (
                <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-2">
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Warehouse Details
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    <div className="flex items-start gap-2 text-xs sm:text-sm">
                      <IconBuildingWarehouse className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{selectedWarehouseDetails.name}</p>
                        <p className="text-muted-foreground text-[10px] sm:text-xs">{selectedWarehouseDetails.location}</p>
                      </div>
                    </div>
                    {selectedWarehouseDetails.manager && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <IconUser className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span>Manager: {selectedWarehouseDetails.manager}</span>
                      </div>
                    )}
                    {selectedWarehouseDetails.phone && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <IconPhone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span>{selectedWarehouseDetails.phone}</span>
                      </div>
                    )}
                    {selectedWarehouseDetails.type && (
                      <Badge variant="outline" className="w-fit text-[10px]">
                        {selectedWarehouseDetails.type}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Supplier Information Section */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <IconBuildingStore className="h-3 w-3 sm:h-4 sm:w-4" />
              Supplier Information
            </h3>
            <div className="space-y-3">
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Supplier *</Label>
                <Select
                  value={formData.supplierId || ""}
                  onValueChange={(value) => handleSelectChange("supplierId", value)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder={suppliers.length === 0 ? "No suppliers found" : "Select supplier"} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No suppliers available</div>
                    ) : (
                      suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id} className="text-sm">
                          {supplier.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedSupplierDetails && (
                <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-2">
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Supplier Contact Information
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    {selectedSupplierDetails.contact && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <IconUser className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span className="break-all">Contact: {selectedSupplierDetails.contact}</span>
                      </div>
                    )}
                    {selectedSupplierDetails.phone && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <IconPhone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span className="break-all">{selectedSupplierDetails.phone}</span>
                      </div>
                    )}
                    {selectedSupplierDetails.email && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <IconMail className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span className="break-all">{selectedSupplierDetails.email}</span>
                      </div>
                    )}
                    {selectedSupplierDetails.address && (
                      <div className="flex items-start gap-2 text-xs sm:text-sm">
                        <IconMapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mt-0.5" />
                        <span className="break-all">{selectedSupplierDetails.address}</span>
                      </div>
                    )}
                  </div>
                  {!selectedSupplierDetails.contact && !selectedSupplierDetails.phone && !selectedSupplierDetails.email && (
                    <p className="text-xs text-muted-foreground">No additional contact information available.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <IconClipboard className="h-3 w-3 sm:h-4 sm:w-4" />
              Description
            </h3>
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Description</Label>
              <Textarea
                name="description"
                value={formData.description || ""}
                onChange={handleInputChange}
                placeholder="Describe the material..."
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
            Cancel
          </Button>
          <Button onClick={handleSubmit} size="sm">
            <IconEdit className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Update Material
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main DataTable component for Raw Materials
export function RawMaterialTable({
  data,
  onUpdate,
  onDelete,
  suppliers = [],
  warehouses = [],
  categories = [],
}) {
  const [tableData, setTableData] = React.useState(data);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [sorting, setSorting] = React.useState([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [viewingMaterial, setViewingMaterial] = React.useState(null);
  const [editingMaterial, setEditingMaterial] = React.useState(null);
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

  const handleView = (material) => {
    setViewingMaterial(material);
    setViewDialogOpen(true);
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedMaterial) => {
    onUpdate(updatedMaterial);
    setEditingMaterial(null);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this material?")) {
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
        accessorKey: "batchNumber",
        header: "Batch Number",
        cell: ({ row }) => (
          <Button
            variant="link"
            className="font-mono text-left hover:underline p-0 h-auto text-sm"
            onClick={() => handleView(row.original)}
          >
            <IconBarcode className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
            <span className="truncate max-w-[120px]">{row.original.batchNumber || row.original.sku || "N/A"}</span>
          </Button>
        ),
        size: isMobile ? 140 : 180,
      },
      {
        accessorKey: "name",
        header: "Material",
        cell: ({ row }) => (
          <div className="text-sm truncate max-w-[150px] md:max-w-[200px]">
            {row.original.name}
          </div>
        ),
        size: isMobile ? 140 : 180,
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground truncate max-w-[100px]">
            {row.original.category}
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge className={cn("text-[11px] px-1.5 py-0", getStatusColor(status))}>
              {status}
            </Badge>
          );
        },
        size: 100,
      },
      {
        accessorKey: "quantity",
        header: "Stock",
        cell: ({ row }) => (
          <div className="text-sm flex items-center gap-1 whitespace-nowrap">
            <IconScale className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>{row.original.quantity || 0}</span>
            <span className="text-muted-foreground text-[11px]">{row.original.unit}</span>
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: "unitPrice",
        header: "Unit Price",
        cell: ({ row }) => (
          <div className="text-sm font-medium flex items-center gap-1 whitespace-nowrap">
            <IconCurrencyDollar className="h-3.5 w-3.5 shrink-0" />
            <span>${row.original.unitPrice || 0}</span>
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: "supplierName",
        header: "Supplier",
        cell: ({ row }) => (
          <div className="text-sm flex items-center gap-1">
            <IconBuildingStore className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden sm:inline" />
            <span className="truncate max-w-[120px]">{row.original.supplierName || "N/A"}</span>
          </div>
        ),
        size: isMobile ? 130 : 160,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const material = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-7 w-7 p-0">
                  <span className="sr-only">Open menu</span>
                  <IconDotsVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => handleView(material)} className="text-sm">
                  <IconEye className="mr-2 h-3.5 w-3.5" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(material)} className="text-sm">
                  <IconEdit className="mr-2 h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(material.id)}
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
                      No raw materials found. Click "Add Material" to get started.
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
      <MaterialViewerDialog
        material={viewingMaterial}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Edit Dialog */}
      <MaterialEditor
        material={editingMaterial}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
        categories={categories}
        suppliers={suppliers}
        warehouses={warehouses}
      />
    </>
  );
}