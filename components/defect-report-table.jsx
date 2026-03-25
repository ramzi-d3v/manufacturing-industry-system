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
import { Separator } from "@/components/ui/separator";
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

// Defect source options
const defectSourceOptions = [
  { value: "supplier", label: "Supplier Defect" },
  { value: "warehouse", label: "Warehouse Damage" },
  { value: "handling", label: "Handling Damage" },
  { value: "storage", label: "Storage Issue" },
];

// Status icon mapping
const getStatusIcon = (status) => {
  switch (status) {
    case "Resolved":
      return <IconCheck className="h-4 w-4 text-green-500" />;
    case "Under Investigation":
      return <IconClock className="h-4 w-4 text-yellow-500" />;
    case "Reported to Supplier":
      return <IconTruck className="h-4 w-4 text-blue-500" />;
    case "Credit Note Issued":
      return <IconCurrencyDollar className="h-4 w-4 text-purple-500" />;
    case "Written Off":
      return <IconX className="h-4 w-4 text-red-500" />;
    default:
      return null;
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


function ReportViewerDialog({ report, open, onOpenChange, onEdit, onDelete }) {
  const getrisk_levelColor = (risk_level) => {
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

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[90vw] max-w-[90vw] sm:w-[85vw] sm:max-w-[85vw] md:w-[80vw] md:max-w-[80vw] lg:w-[75vw] lg:max-w-[75vw] xl:w-[70vw] xl:max-w-[70vw] p-6 gap-4 bg-background"
        showCloseButton={true}
      >
        {/* Header - Minimal */}
        <div className=" mt-5 flex items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-semibold">
              Defect Report Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <span>#{report.id?.slice(0, 8)}</span>
              <span>•</span>
              <span>{report.reportDate}</span>
            </DialogDescription>
          </div>
        
        </div>

        {/* Content - Compact Grid Layout */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Material Info */}
            <div className="flex items-start gap-3 pb-3 border-b">
              <div className="p-2 bg-primary/5 rounded-lg">
                <IconPackage className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Material</p>
                <p className="text-base font-medium mt-0.5">{report.materialName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{report.supplier}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Loss</p>
                <p className="text-lg font-bold text-destructive">${report.totalLoss.toLocaleString()}</p>
              </div>
            </div>

            {/* Defect Information */}
            <div className="">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <IconFileReport className="h-3.5 w-3.5" />
                Defect Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Defect Date</p>
                  <p className="text-sm mt-0.5">{report.defectDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Defect Type</p>
                  <p className="text-sm mt-0.5">{report.defectType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Batch Number</p>
                  <p className="text-sm mt-0.5">{report.batchNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm mt-0.5">{report.location || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <IconAlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Risk Level</p>
                </div>
                <Badge className={cn("text-xs px-2 py-0.5", getrisk_levelColor(report.risk_level))}>
                  {report.risk_level}
                </Badge>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-1.5 mb-1">
                  {report.defectSource === "supplier" ? (
                    <IconTruck className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <IconBuildingWarehouse className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <p className="text-xs text-muted-foreground">Damage Source</p>
                </div>
                <p className="text-sm">{report.defectSource === "supplier" ? "Supplier" : "Warehouse"}</p>
              </div>
            </div>

           {/* Financial & Reporting Details */}
<div>
  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
    <IconCurrencyDollar className="h-3.5 w-3.5" />
    Financial & Reporting Details
  </h3>
  <div className="grid grid-cols-2 gap-3">
    
    <div>
      <p className="text-xs text-muted-foreground">Quantity</p>
      <p className="text-sm mt-0.5">{report.quantity} {report.unit}</p>
    </div>
    <div>
      <p className="text-xs text-muted-foreground">Cost per Unit</p>
      <p className="text-sm mt-0.5">${report.costPerUnit}</p>
    </div>
    <div>
      <p className="text-xs text-muted-foreground">Status</p>
      <Badge className={cn("text-xs px-2 py-0.5 mt-0.5", getStatusColor(report.status))}>
        {report.status}
      </Badge>
    </div>
    <div>
      <p className="text-xs text-muted-foreground">Reported By</p>
      <p className="text-sm mt-0.5">{report.reportedBy}</p>
    </div>
  </div>
</div>

           
          </div>
        </div>

        {/* Description Section - Full Width */}
        {report.description && (
          <div className="mt-2 pt-3 border-t">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <IconNotes className="h-3.5 w-3.5" />
              Description
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
          </div>
        )}

        {/* Action Taken - Full Width */}
        {report.actionTaken && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <IconFileReport className="h-3.5 w-3.5" />
              Action Taken
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{report.actionTaken}</p>
          </div>
        )}

        {/* Footer Actions */}
        <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
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
// Edit report component - Fixed null error
function ReportEditor({ report, open, onOpenChange, onSave }) {
  const [formData, setFormData] = React.useState(null);

  React.useEffect(() => {
    if (report) {
      setFormData(report);
    }
  }, [report]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (formData) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name, value) => {
    if (formData) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = () => {
    if (!formData) return;
    
    if (!formData.materialName || !formData.quantity || !formData.costPerUnit || !formData.supplier) {
      toast.error("Please fill in all required fields");
      return;
    }
    onSave(formData);
    onOpenChange(false);
  };

  // Don't render if no report or formData is null
  if (!report || !formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
<DialogContent 
  className=" w-[90vw] max-w-[90vw] sm:w-[85vw] sm:max-w-[85vw] md:w-[80vw] md:max-w-[80vw] lg:w-[75vw] lg:max-w-[75vw] xl:w-[70vw] xl:max-w-[70vw] h-[93vh] max-h-[93vh] p-6 gap-4 bg-background overflow-y-auto"
  showCloseButton={true}
>          <DialogHeader>
          <DialogTitle className="text-xl">Edit Defect Report</DialogTitle>
          <DialogDescription className="text-sm">Update the details below.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Material Information */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Material Name *</Label>
              <Input
                name="materialName"
                value={formData.materialName || ""}
                onChange={handleChange}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Supplier *</Label>
              <Input
                name="supplier"
                value={formData.supplier || ""}
                onChange={handleChange}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Defect Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Defect Date</Label>
              <Input
                name="defectDate"
                type="date"
                value={formData.defectDate || ""}
                onChange={handleChange}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Defect Type</Label>
              <Input
                name="defectType"
                value={formData.defectType || ""}
                onChange={handleChange}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Defect Source</Label>
              <Select
                value={formData.defectSource}
                onValueChange={(value) => handleSelectChange("defectSource", value)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {defectSourceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-sm">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">risk_level</Label>
              <Select
                value={formData.risk_level}
                onValueChange={(value) => handleSelectChange("risk_level", value)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {risk_levelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-sm">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantity and Cost */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Quantity *</Label>
              <Input
                name="quantity"
                type="number"
                step="0.01"
                value={formData.quantity || ""}
                onChange={handleChange}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Unit</Label>
              <Input
                name="unit"
                value={formData.unit || "kg"}
                onChange={handleChange}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Cost/Unit *</Label>
              <Input
                name="costPerUnit"
                type="number"
                step="0.01"
                value={formData.costPerUnit || ""}
                onChange={handleChange}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Location & Batch */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Location</Label>
              <Input
                name="location"
                value={formData.location || ""}
                onChange={handleChange}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Batch Number</Label>
              <Input
                name="batchNumber"
                value={formData.batchNumber || ""}
                onChange={handleChange}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-sm">Description</Label>
            <Textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              className="text-sm"
              rows={2}
            />
          </div>

          {/* Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-sm">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Reported By</Label>
              <Input
                name="reportedBy"
                value={formData.reportedBy || ""}
                onChange={handleChange}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Action Taken */}
          <div className="space-y-1.5">
            <Label className="text-sm">Action Taken</Label>
            <Textarea
              name="actionTaken"
              value={formData.actionTaken || ""}
              onChange={handleChange}
              className="text-sm"
              rows={2}
            />
          </div>

          
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <IconEdit className="mr-2 h-4 w-4" />
            Update
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
        accessorKey: "defectType",
        header: "Type",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground truncate max-w-[120px]">
            {row.original.defectType}
          </div>
        ),
        size: 120,
      },
      {
        accessorKey: "risk_level",
        header: "risk_level",
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
        size: 80,
      },
      {
        accessorKey: "defectSource",
        header: "Source",
        cell: ({ row }) => {
          const source = row.original.defectSource;
          return (
            <Badge
              variant={source === "supplier" ? "outline" : "destructive"}
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
        cell: ({ row }) => (
          <div className="text-sm font-medium text-destructive flex items-center gap-1 whitespace-nowrap">
            <IconCurrencyDollar className="h-3.5 w-3.5 shrink-0" />
            <span>${row.original.totalLoss.toLocaleString()}</span>
          </div>
        ),
        size: 110,
      },
      {
        accessorKey: "supplier",
        header: "Supplier",
        cell: ({ row }) => (
          <div className="text-sm flex items-center gap-1">
            <IconBuildingStore className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden sm:inline" />
            <span className="truncate max-w-[120px] md:max-w-[150px]">{row.original.supplier}</span>
          </div>
        ),
        size: isMobile ? 130 : 160,
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
        accessorKey: "reportedBy",
        header: "Reported",
        cell: ({ row }) => (
          <div className="text-sm flex items-center gap-1">
            <IconUser className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden sm:inline" />
            <span className="truncate max-w-[100px] md:max-w-[120px]">{row.original.reportedBy}</span>
          </div>
        ),
        size: isMobile ? 110 : 130,
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
      <div className="overflow-x-auto rounded-lg border">
        <div className="min-w-[1050px] md:min-w-full">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
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

      {/* Beautiful View Dialog - Wider with Blur */}
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