// components/finished-product-defect-table.jsx
"use client";

import * as React from "react";
import {
  IconCircleCheck,
  IconAlertTriangle,
  IconX,
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
  IconCurrencyDollar,
  IconAlertCircle,
  IconBarcode,
  IconLocation,
  IconClipboard,
  IconScale,
  IconClock,
  IconRefresh,
  IconBug,
  IconTruck,
  IconBuildingWarehouse,
  IconCalendar,
} from "@tabler/icons-react";
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

// Severity config
const severityConfig = {
  Critical: { icon: IconAlertTriangle, color: "text-red-500", bg: "bg-red-500/10", label: "Critical" },
  High: { icon: IconAlertCircle, color: "text-orange-500", bg: "bg-orange-500/10", label: "High" },
  Medium: { icon: IconAlertCircle, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Medium" },
  Low: { icon: IconAlertCircle, color: "text-blue-500", bg: "bg-blue-500/10", label: "Low" },
  Minor: { icon: IconAlertCircle, color: "text-green-500", bg: "bg-green-500/10", label: "Minor" },
};

// Defect source config
const sourceConfig = {
  production: { icon: IconPackage, color: "text-purple-500", bg: "bg-purple-500/10", label: "Production" },
  qc: { icon: IconClipboard, color: "text-cyan-500", bg: "bg-cyan-500/10", label: "QC Missed" },
  handling: { icon: IconTruck, color: "text-amber-500", bg: "bg-amber-500/10", label: "Handling" },
  storage: { icon: IconBuildingWarehouse, color: "text-blue-500", bg: "bg-blue-500/10", label: "Storage" },
  transport: { icon: IconTruck, color: "text-indigo-500", bg: "bg-indigo-500/10", label: "Transport" },
  customer: { icon: IconBug, color: "text-pink-500", bg: "bg-pink-500/10", label: "Customer Return" },
};

// Status config
const statusConfig = {
  Reported: { icon: IconClock, color: "text-gray-500", bg: "bg-gray-500/10", label: "Reported" },
  "Under Investigation": { icon: IconRefresh, color: "text-blue-500", bg: "bg-blue-500/10", label: "Investigation" },
  "Rework Planned": { icon: IconRefresh, color: "text-purple-500", bg: "bg-purple-500/10", label: "Rework Planned" },
  "Rework Completed": { icon: IconCircleCheck, color: "text-green-500", bg: "bg-green-500/10", label: "Rework Done" },
  "Written Off": { icon: IconX, color: "text-red-500", bg: "bg-red-500/10", label: "Written Off" },
  Resolved: { icon: IconCircleCheck, color: "text-green-500", bg: "bg-green-500/10", label: "Resolved" },
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

// View Defect Dialog
function DefectViewerDialog({ defect, open, onOpenChange, onEdit, onDelete }) {
  if (!defect) return null;

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const severity = severityConfig[defect.severity] || severityConfig.Medium;
  const SeverityIcon = severity.icon;
  const source = sourceConfig[defect.defectSource] || sourceConfig.production;
  const SourceIcon = source.icon;
  const status = statusConfig[defect.status] || statusConfig.Reported;
  const StatusIcon = status.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[90vw] max-w-[90vw] sm:w-[85vw] sm:max-w-[85vw] md:w-[80vw] md:max-w-[80vw] lg:w-[75vw] lg:max-w-[75vw] xl:w-[70vw] xl:max-w-[70vw] p-6 gap-4 bg-background/80 backdrop-blur-sm border-border/50 max-h-[90vh] overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <IconBug className="h-6 w-6 text-destructive" />
            Defect Report Details
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-xs">
            <IconBarcode className="h-3 w-3" />
            Report ID: {defect.id?.slice(-8) || "N/A"}
            <span>•</span>
            <IconCalendar className="h-3 w-3" />
            <span>Date: {formatDate(defect.defectDate)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Information */}
          <div className="space-y-4">
            <div className="p-4 bg-background/40 backdrop-blur-sm rounded-lg border border-border/50">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <Badge className={cn(severity.bg, severity.color)}>
                  <SeverityIcon className="h-3 w-3 mr-1" />
                  {severity.label}
                </Badge>
                <Badge className={cn(source.bg, source.color)}>
                  <SourceIcon className="h-3 w-3 mr-1" />
                  {source.label}
                </Badge>
                <Badge className={cn(status.bg, status.color)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg mt-2">{defect.productName}</h3>
              <p className="text-sm text-muted-foreground">Batch: {defect.batchNumber || "N/A"}</p>
              {defect.supplierName && (
                <p className="text-sm text-muted-foreground">Supplier: {defect.supplierName}</p>
              )}
              {defect.qualityGrade && (
                <p className="text-sm text-muted-foreground">Grade: {defect.qualityGrade}</p>
              )}
            </div>

            <div className="p-3 bg-background/40 backdrop-blur-sm rounded-lg border border-border/50">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <IconClipboard className="h-4 w-4" />
                Defect Category
              </h4>
              <p className="text-sm">{defect.defectCategory || "N/A"}</p>
            </div>

            {defect.rootCause && (
              <div className="p-3 bg-background/40 backdrop-blur-sm rounded-lg border border-border/50">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <IconAlertCircle className="h-4 w-4" />
                  Root Cause
                </h4>
                <p className="text-sm text-muted-foreground">{defect.rootCause}</p>
              </div>
            )}
          </div>

          {/* Quantity and Financial Impact */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-background/40 backdrop-blur-sm rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground">Quantity Affected</p>
                <p className="text-xl font-semibold">
                  {defect.quantity} <span className="text-sm font-normal text-muted-foreground">{defect.unit}</span>
                </p>
              </div>
              <div className="p-3 bg-background/40 backdrop-blur-sm rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium">{defect.location || "Not specified"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-background/40 backdrop-blur-sm rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground">Cost per Unit</p>
                <p className="text-sm font-medium">${defect.costPerUnit?.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-background/40 backdrop-blur-sm rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground">Selling Price</p>
                <p className="text-sm font-medium">${defect.sellingPrice?.toLocaleString() || "N/A"}</p>
              </div>
            </div>

            <div className="p-3 bg-destructive/10 backdrop-blur-sm rounded-lg border border-destructive/20">
              <p className="text-xs text-muted-foreground">Total Financial Loss</p>
              <p className="text-lg font-bold text-destructive">
                ${defect.totalLoss?.toLocaleString() || "0"}
              </p>
            </div>

            {defect.reportedBy && (
              <div className="p-3 bg-background/40 backdrop-blur-sm rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground">Reported By</p>
                <p className="text-sm font-medium">{defect.reportedBy}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Reported on: {formatDate(defect.createdAt?.toDate?.() || defect.reportDate)}
                </p>
              </div>
            )}

            {defect.actionTaken && (
              <div className="p-3 bg-background/40 backdrop-blur-sm rounded-lg border border-border/50">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <IconRefresh className="h-4 w-4" />
                  Action Taken
                </h4>
                <p className="text-sm text-muted-foreground">{defect.actionTaken}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-background/80 backdrop-blur-sm">
            Close
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onOpenChange(false);
              onEdit(defect);
            }}
            className="bg-background/80 backdrop-blur-sm"
          >
            <IconEdit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              onDelete(defect.id);
            }}
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Edit Defect Dialog
function DefectEditor({ defect, open, onOpenChange, onSave, defectCategories, defectSources, severityLevels, statuses }) {
  const [formData, setFormData] = React.useState(null);

  React.useEffect(() => {
    if (defect) {
      setFormData({ ...defect });
    }
  }, [defect]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (formData) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNumberChange = (name, value) => {
    if (formData) {
      const numValue = parseFloat(value) || 0;
      setFormData((prev) => ({ ...prev, [name]: numValue }));
      
      // Recalculate total loss if quantity or cost changes
      if (name === "quantity" || name === "costPerUnit") {
        const quantity = name === "quantity" ? numValue : (formData.quantity || 0);
        const cost = name === "costPerUnit" ? numValue : (formData.costPerUnit || 0);
        setFormData((prev) => ({ ...prev, totalLoss: quantity * cost }));
      }
    }
  };

  const handleSelectChange = (name, value) => {
    if (formData) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = () => {
    if (!formData) return;
    
    if (!formData.productName || !formData.defectCategory) {
      toast.error("Please fill in all required fields");
      return;
    }
    onSave(formData);
    onOpenChange(false);
  };

  if (!defect || !formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[90vw] max-w-[90vw] sm:w-[85vw] sm:max-w-[85vw] md:w-[80vw] md:max-w-[80vw] lg:w-[75vw] lg:max-w-[75vw] xl:w-[70vw] xl:max-w-[70vw] h-[93vh] max-h-[93vh] p-6 gap-4 bg-background/80 backdrop-blur-sm border-border/50 overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <IconEdit className="h-5 w-5" />
            Edit Defect Report
          </DialogTitle>
          <DialogDescription>Update the defect report details below.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Product Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input
                name="productName"
                value={formData.productName || ""}
                onChange={handleChange}
                className="bg-background/40 backdrop-blur-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Batch Number</Label>
              <Input
                name="batchNumber"
                value={formData.batchNumber || ""}
                onChange={handleChange}
                className="bg-background/40 backdrop-blur-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Input
                name="supplierName"
                value={formData.supplierName || ""}
                onChange={handleChange}
                className="bg-background/40 backdrop-blur-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Quality Grade</Label>
              <Select
                value={formData.qualityGrade || ""}
                onValueChange={(value) => handleSelectChange("qualityGrade", value)}
              >
                <SelectTrigger className="bg-background/40 backdrop-blur-sm">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Flagship">Flagship</SelectItem>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Economy">Economy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                name="location"
                value={formData.location || ""}
                onChange={handleChange}
                className="bg-background/40 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Defect Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Defect Date</Label>
              <Input
                name="defectDate"
                type="date"
                value={formData.defectDate || ""}
                onChange={handleChange}
                className="bg-background/40 backdrop-blur-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Defect Category *</Label>
              <Select
                value={formData.defectCategory || ""}
                onValueChange={(value) => handleSelectChange("defectCategory", value)}
              >
                <SelectTrigger className="bg-background/40 backdrop-blur-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {defectCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Defect Source</Label>
              <Select
                value={formData.defectSource || "production"}
                onValueChange={(value) => handleSelectChange("defectSource", value)}
              >
                <SelectTrigger className="bg-background/40 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {defectSources.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select
                value={formData.severity || "Medium"}
                onValueChange={(value) => handleSelectChange("severity", value)}
              >
                <SelectTrigger className="bg-background/40 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {severityLevels.map((sev) => (
                    <SelectItem key={sev.value} value={sev.value}>
                      {sev.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantity and Cost */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                name="quantity"
                type="number"
                step="0.01"
                value={formData.quantity || 0}
                onChange={(e) => handleNumberChange("quantity", e.target.value)}
                className="bg-background/40 backdrop-blur-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input
                name="unit"
                value={formData.unit || "pcs"}
                onChange={handleChange}
                className="bg-background/40 backdrop-blur-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Cost per Unit ($)</Label>
              <Input
                name="costPerUnit"
                type="number"
                step="0.01"
                value={formData.costPerUnit || 0}
                onChange={(e) => handleNumberChange("costPerUnit", e.target.value)}
                className="bg-background/40 backdrop-blur-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Selling Price ($)</Label>
              <Input
                name="sellingPrice"
                type="number"
                step="0.01"
                value={formData.sellingPrice || 0}
                onChange={(e) => handleNumberChange("sellingPrice", e.target.value)}
                className="bg-background/40 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Total Loss Display */}
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-xs text-muted-foreground">Calculated Total Loss</p>
            <p className="text-lg font-bold text-destructive">
              ${((formData.quantity || 0) * (formData.costPerUnit || 0)).toLocaleString()}
            </p>
          </div>

          {/* Root Cause */}
          <div className="space-y-2">
            <Label>Root Cause</Label>
            <Textarea
              name="rootCause"
              value={formData.rootCause || ""}
              onChange={handleChange}
              rows={2}
              placeholder="What caused this defect?"
              className="bg-background/40 backdrop-blur-sm"
            />
          </div>

          {/* Action Taken */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status || "Reported"}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger className="bg-background/40 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((stat) => (
                    <SelectItem key={stat.value} value={stat.value}>
                      {stat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reported By</Label>
              <Input
                name="reportedBy"
                value={formData.reportedBy || ""}
                onChange={handleChange}
                className="bg-background/40 backdrop-blur-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Action Taken</Label>
            <Textarea
              name="actionTaken"
              value={formData.actionTaken || ""}
              onChange={handleChange}
              rows={2}
              placeholder="What action has been taken?"
              className="bg-background/40 backdrop-blur-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-background/80 backdrop-blur-sm">
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

// Main DataTable component for Finished Product Defects
export function FinishedProductDefectTable({
  data,
  onUpdate,
  onDelete,
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
  const [viewingDefect, setViewingDefect] = React.useState(null);
  const [editingDefect, setEditingDefect] = React.useState(null);
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  // Options for edit dialog
  const defectCategories = [
    { value: "cosmetic", label: "Cosmetic Defect" },
    { value: "functional", label: "Functional Defect" },
    { value: "packaging", label: "Packaging Issue" },
    { value: "labeling", label: "Labeling Error" },
    { value: "size", label: "Size/Fit Issue" },
    { value: "material", label: "Material Flaw" },
    { value: "assembly", label: "Assembly Issue" },
    { value: "finish", label: "Finish/Coating Defect" },
    { value: "performance", label: "Performance Issue" },
    { value: "safety", label: "Safety Concern" },
  ];

  const defectSources = [
    { value: "production", label: "Production Error" },
    { value: "qc", label: "QC Missed" },
    { value: "handling", label: "Handling Damage" },
    { value: "storage", label: "Storage Issue" },
    { value: "transport", label: "Transport Damage" },
    { value: "customer", label: "Customer Return" },
  ];

  const severityLevels = [
    { value: "Critical", label: "Critical" },
    { value: "High", label: "High" },
    { value: "Medium", label: "Medium" },
    { value: "Low", label: "Low" },
    { value: "Minor", label: "Minor" },
  ];

  const statuses = [
    { value: "Reported", label: "Reported" },
    { value: "Under Investigation", label: "Under Investigation" },
    { value: "Rework Planned", label: "Rework Planned" },
    { value: "Rework Completed", label: "Rework Completed" },
    { value: "Written Off", label: "Written Off" },
    { value: "Resolved", label: "Resolved" },
  ];

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

  const handleView = (defect) => {
    setViewingDefect(defect);
    setViewDialogOpen(true);
  };

  const handleEdit = (defect) => {
    setEditingDefect(defect);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedDefect) => {
    onUpdate(updatedDefect);
    setEditingDefect(null);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this defect report?")) {
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
        accessorKey: "productName",
        header: "Product",
        cell: ({ row }) => (
          <Button
            variant="link"
            className="text-left hover:underline p-0 h-auto text-sm"
            onClick={() => handleView(row.original)}
          >
            <IconPackage className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
            <span className="truncate max-w-[150px]">{row.original.productName}</span>
          </Button>
        ),
        size: isMobile ? 150 : 200,
      },
      {
        accessorKey: "batchNumber",
        header: "Batch",
        cell: ({ row }) => (
          <div className="text-xs font-mono truncate max-w-[100px]">
            {row.original.batchNumber || "N/A"}
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: "defectCategory",
        header: "Category",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground truncate max-w-[120px]">
            {row.original.defectCategory}
          </div>
        ),
        size: 120,
      },
      {
        accessorKey: "severity",
        header: "Severity",
        cell: ({ row }) => {
          const severity = row.original.severity;
          const config = severityConfig[severity] || severityConfig.Medium;
          const Icon = config.icon;
          return (
            <Badge className={cn("text-[11px] px-1.5 py-0", config.bg, config.color)}>
              <Icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          );
        },
        size: 90,
      },
      {
        accessorKey: "defectSource",
        header: "Source",
        cell: ({ row }) => {
          const source = row.original.defectSource;
          const config = sourceConfig[source] || sourceConfig.production;
          const Icon = config.icon;
          return (
            <Badge className={cn("text-[11px] px-1.5 py-0", config.bg, config.color)}>
              <Icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          );
        },
        size: 100,
      },
      {
        accessorKey: "quantity",
        header: "Qty",
        cell: ({ row }) => (
          <div className="text-sm whitespace-nowrap">
            {row.original.quantity} {row.original.unit}
          </div>
        ),
        size: 80,
      },
      {
        accessorKey: "totalLoss",
        header: "Loss",
        cell: ({ row }) => (
          <div className="text-sm font-medium text-destructive whitespace-nowrap">
            ${row.original.totalLoss?.toLocaleString()}
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const config = statusConfig[status] || statusConfig.Reported;
          const Icon = config.icon;
          return (
            <Badge className={cn("text-[11px] px-1.5 py-0", config.bg, config.color)}>
              <Icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          );
        },
        size: 110,
      },
      {
        accessorKey: "defectDate",
        header: "Date",
        cell: ({ row }) => (
          <div className="text-xs whitespace-nowrap">
            {new Date(row.original.defectDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            })}
          </div>
        ),
        size: 90,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const defect = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-7 w-7 p-0">
                  <span className="sr-only">Open menu</span>
                  <IconDotsVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => handleView(defect)} className="text-sm">
                  <IconEye className="mr-2 h-3.5 w-3.5" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(defect)} className="text-sm">
                  <IconEdit className="mr-2 h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(defect.id)}
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
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <div className="min-w-[1100px] md:min-w-full">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-background/40 backdrop-blur-sm sticky top-0 z-10">
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
                      No defect reports found. Click "New Report" to get started.
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
              <SelectTrigger className="h-7 w-16 text-sm bg-background/40 backdrop-blur-sm" id="rows-per-page">
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
              className="h-7 w-7 p-0 bg-background/40 backdrop-blur-sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              className="h-7 w-7 p-0 bg-background/40 backdrop-blur-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              className="h-7 w-7 p-0 bg-background/40 backdrop-blur-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              className="h-7 w-7 p-0 bg-background/40 backdrop-blur-sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* View Dialog */}
      <DefectViewerDialog
        defect={viewingDefect}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Edit Dialog */}
      <DefectEditor
        defect={editingDefect}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
        defectCategories={defectCategories}
        defectSources={defectSources}
        severityLevels={severityLevels}
        statuses={statuses}
      />
    </>
  );
}