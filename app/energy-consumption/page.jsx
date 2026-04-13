// components/energy-consumption-table.jsx
"use client";

import * as React from "react";
import {
  IconBolt,
  IconGasStation,
  IconFlame,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconGripVertical,
  IconTrash,
  IconCurrencyDollar,
  IconCalendar,
  IconMapPin,
  IconUser,
  IconNotes,
  IconTrendingUp,
  IconTrendingDown,
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
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

// Energy type configuration
const energyTypeConfig = {
  electricity: { 
    icon: IconBolt, 
    color: "text-yellow-500", 
    bg: "bg-yellow-500/10", 
    label: "Electricity",
    unit: "kWh"
  },
  fuel: { 
    icon: IconGasStation, 
    color: "text-orange-500", 
    bg: "bg-orange-500/10", 
    label: "Fuel",
    unit: "liters"
  },
  gas: { 
    icon: IconFlame, 
    color: "text-blue-500", 
    bg: "bg-blue-500/10", 
    label: "Natural Gas",
    unit: "m³"
  },
  diesel: { 
    icon: IconGasStation, 
    color: "text-purple-500", 
    bg: "bg-purple-500/10", 
    label: "Diesel",
    unit: "liters"
  },
};

const fuelTypes = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "cng", label: "CNG" },
  { value: "lpg", label: "LPG" },
];

// Cost trend indicator
const getCostTrend = (costPerUnit) => {
  if (costPerUnit > 1.0) return { label: "High", color: "text-red-500", icon: IconTrendingUp };
  if (costPerUnit > 0.5) return { label: "Medium", color: "text-yellow-500", icon: IconTrendingUp };
  return { label: "Low", color: "text-green-500", icon: IconTrendingDown };
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

// View Record Dialog
function RecordViewerDialog({ record, open, onOpenChange, onEdit, onDelete }) {
  if (!record) return null;

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const energyConfig = energyTypeConfig[record.energyType] || energyTypeConfig.electricity;
  const EnergyIcon = energyConfig.icon;
  const costTrend = getCostTrend(record.costPerUnit);
  const TrendIcon = costTrend.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] md:w-[85vw] md:max-w-[85vw] lg:w-[80vw] lg:max-w-[80vw] xl:w-[70vw] xl:max-w-[70vw] max-h-[90vh] p-4 sm:p-6 gap-4 bg-background/95 backdrop-blur-md border-border/50 overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <EnergyIcon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: energyConfig.color.replace('text-', '') }} />
            Energy Consumption Details
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <IconCalendar className="h-3 w-3" />
              Recorded on {formatDate(record.date)}
            </span>
            {record.recordedBy && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <IconUser className="h-3 w-3" />
                  By: {record.recordedBy}
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Energy Type & Basic Info */}
          <div className="space-y-4">
            <div className={cn("p-3 sm:p-4 rounded-lg border", energyConfig.bg, "border-border/50")}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <Badge className={cn("text-[10px] sm:text-xs", energyConfig.bg, energyConfig.color)}>
                  <EnergyIcon className="h-3 w-3 mr-1" />
                  {energyConfig.label}
                </Badge>
                <Badge className={cn("text-[10px] sm:text-xs", costTrend.color, "bg-muted/30")}>
                  <TrendIcon className="h-3 w-3 mr-1" />
                  {costTrend.label} Cost
                </Badge>
                {record.fuelType && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {record.fuelType}
                  </Badge>
                )}
              </div>
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">Energy Type</p>
                <h3 className="font-semibold text-base sm:text-lg capitalize">{record.energyType}</h3>
              </div>
            </div>

            {record.notes && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                  <IconNotes className="h-3.5 w-3.5" />
                  Notes
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground">{record.notes}</p>
              </div>
            )}
          </div>

          {/* Consumption and Cost */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-[10px] text-muted-foreground">Consumption</p>
                <p className="text-lg sm:text-xl font-semibold">
                  {record.consumption.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{record.unit}</span>
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-[10px] text-muted-foreground">Total Cost</p>
                <p className="text-lg sm:text-xl font-bold text-primary">
                  ${record.cost.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-[10px] text-muted-foreground">Rate</p>
                <p className="text-sm font-medium">${record.costPerUnit}/{record.unit}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-[10px] text-muted-foreground">Daily Average</p>
                <p className="text-sm font-medium">${(record.cost / 30).toFixed(2)}/day</p>
              </div>
            </div>
          </div>
        </div>

        {/* Location Information */}
        {(record.machine || record.area) && (
          <div className="mt-6 pt-6 border-t border-border/50 space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <IconMapPin className="h-4 w-4 text-primary" />
              Location Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {record.machine && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">Machine/Equipment</p>
                  <p className="text-sm font-medium">{record.machine}</p>
                </div>
              )}
              {record.area && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">Area/Department</p>
                  <p className="text-sm font-medium">{record.area}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onOpenChange(false);
              onEdit(record);
            }}
          >
            <IconEdit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              onDelete(record.id);
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

// Edit Record Dialog
function RecordEditor({ record, open, onOpenChange, onSave }) {
  const [formData, setFormData] = React.useState(null);

  React.useEffect(() => {
    if (record) {
      setFormData({
        ...record,
        date: record.date instanceof Date ? record.date.toISOString().split("T")[0] : new Date(record.date).toISOString().split("T")[0],
      });
    }
  }, [record]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (formData) {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (name === "consumption" || name === "costPerUnit") {
        const consumption = name === "consumption" ? parseFloat(value) : parseFloat(formData.consumption);
        const costPerUnit = name === "costPerUnit" ? parseFloat(value) : parseFloat(formData.costPerUnit);
        if (!isNaN(consumption) && !isNaN(costPerUnit)) {
          setFormData((prev) => ({ ...prev, cost: consumption * costPerUnit }));
        }
      }
    }
  };

  const handleSelectChange = (name, value) => {
    if (formData) {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (name === "energyType") {
        const unitConfig = energyTypeConfig[value];
        setFormData((prev) => ({ 
          ...prev, 
          unit: unitConfig?.unit || "kWh",
          fuelType: value === "fuel" || value === "diesel" ? "diesel" : "",
        }));
      }
    }
  };

  const handleSubmit = () => {
    if (!formData) return;
    if (!formData.date || !formData.energyType || !formData.consumption) {
      toast.error("Please fill all required fields");
      return;
    }
    onSave(formData);
    onOpenChange(false);
  };

  if (!record || !formData) return null;

  const energyTypesList = [
    { value: "electricity", label: "Electricity" },
    { value: "fuel", label: "Fuel" },
    { value: "gas", label: "Natural Gas" },
    { value: "diesel", label: "Diesel" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] md:w-[85vw] md:max-w-[85vw] lg:w-[80vw] lg:max-w-[80vw] xl:w-[75vw] xl:max-w-[75vw] max-h-[90vh] p-4 sm:p-6 gap-4 bg-background/95 backdrop-blur-md border-border/50 overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <IconEdit className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Edit Energy Record
          </DialogTitle>
          <DialogDescription>Update the energy consumption details below.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-4">
          {/* Basic Information */}
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
                  value={formData.date || ""}
                  onChange={handleChange}
                  className="h-11 bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Energy Type *</Label>
                <Select
                  value={formData.energyType || "electricity"}
                  onValueChange={(value) => handleSelectChange("energyType", value)}
                >
                  <SelectTrigger className="h-11 bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {energyTypesList.map((t) => (
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
                    value={formData.fuelType || ""}
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

          {/* Consumption & Cost */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
              <IconCurrencyDollar className="h-4 w-4 text-primary" />
              Consumption & Cost
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Consumption ({formData.unit}) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  name="consumption"
                  value={formData.consumption || ""}
                  onChange={handleChange}
                  className="h-11 bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Cost per Unit ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  name="costPerUnit"
                  value={formData.costPerUnit || ""}
                  onChange={handleChange}
                  className="h-11 bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Total Cost</Label>
                <Input
                  type="text"
                  value={`$${formData.cost?.toFixed(2) || "0.00"}`}
                  readOnly
                  className="h-11 bg-primary/10 font-semibold text-primary border-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Location Details */}
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
                  value={formData.machine || ""}
                  onChange={handleChange}
                  className="h-11 bg-background/50"
                  placeholder="e.g., Production Line A, Boiler #2"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Area/Department</Label>
                <Input
                  name="area"
                  value={formData.area || ""}
                  onChange={handleChange}
                  className="h-11 bg-background/50"
                  placeholder="e.g., Manufacturing, Warehouse"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
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
                  value={formData.recordedBy || ""}
                  onChange={handleChange}
                  className="h-11 bg-background/50"
                  placeholder="Name of person recording this entry"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Notes</Label>
                <Textarea
                  name="notes"
                  value={formData.notes || ""}
                  onChange={handleChange}
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
            <IconEdit className="mr-2 h-4 w-4" />
            Update Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main DataTable component for Energy Consumption
export function EnergyConsumptionTable({
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
  const [viewingRecord, setViewingRecord] = React.useState(null);
  const [editingRecord, setEditingRecord] = React.useState(null);
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

  const handleView = (record) => {
    setViewingRecord(record);
    setViewDialogOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedRecord) => {
    onUpdate(updatedRecord);
    setEditingRecord(null);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this record?")) {
      onDelete(id);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
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
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
          <Button
            variant="link"
            className="font-mono text-left hover:underline p-0 h-auto text-sm"
            onClick={() => handleView(row.original)}
          >
            <IconCalendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
            <span className="truncate max-w-[100px]">{formatDate(row.original.date)}</span>
          </Button>
        ),
        size: isMobile ? 100 : 120,
      },
      {
        accessorKey: "energyType",
        header: "Type",
        cell: ({ row }) => {
          const type = row.original.energyType;
          const config = energyTypeConfig[type] || energyTypeConfig.electricity;
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
        accessorKey: "consumption",
        header: "Consumption",
        cell: ({ row }) => {
          const record = row.original;
          const config = energyTypeConfig[record.energyType] || energyTypeConfig.electricity;
          return (
            <div className="flex items-center gap-1 whitespace-nowrap">
              <IconBolt className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium">{record.consumption?.toLocaleString()}</span>
              <span className="text-muted-foreground text-[11px]">{record.unit || config.unit}</span>
            </div>
          );
        },
        size: 100,
      },
      {
        accessorKey: "cost",
        header: "Cost",
        cell: ({ row }) => (
          <div className="text-sm font-medium flex items-center gap-1 whitespace-nowrap">
            <IconCurrencyDollar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>${row.original.cost?.toLocaleString()}</span>
            <span className="text-muted-foreground text-[10px] ml-1">
              @ ${row.original.costPerUnit}/{row.original.unit}
            </span>
          </div>
        ),
        size: 130,
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => {
          const record = row.original;
          const location = record.machine || record.area;
          return (
            <div className="flex items-center gap-1 whitespace-nowrap">
              <IconMapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm truncate max-w-[120px]">{location || "—"}</span>
            </div>
          );
        },
        size: 120,
      },
      {
        accessorKey: "recordedBy",
        header: "Recorded By",
        cell: ({ row }) => (
          <div className="flex items-center gap-1 whitespace-nowrap">
            <IconUser className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm truncate max-w-[100px]">{row.original.recordedBy || "—"}</span>
          </div>
        ),
        size: 120,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const record = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-7 w-7 p-0">
                  <span className="sr-only">Open menu</span>
                  <IconDotsVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => handleView(record)} className="text-sm">
                  <IconEye className="mr-2 h-3.5 w-3.5" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(record)} className="text-sm">
                  <IconEdit className="mr-2 h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(record.id)}
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
                      No energy consumption records found. Click "Add Record" to get started.
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
              <SelectTrigger className="h-7 w-16 text-sm bg-background/40 backdrop-blur-sm border-border/50" id="rows-per-page">
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
              className="h-7 w-7 p-0 bg-background/40 backdrop-blur-sm border-border/50"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              className="h-7 w-7 p-0 bg-background/40 backdrop-blur-sm border-border/50"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              className="h-7 w-7 p-0 bg-background/40 backdrop-blur-sm border-border/50"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              className="h-7 w-7 p-0 bg-background/40 backdrop-blur-sm border-border/50"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* View Dialog */}
      <RecordViewerDialog
        record={viewingRecord}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Edit Dialog */}
      <RecordEditor
        record={editingRecord}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
      />
    </>
  );
}

// Main Page Component
export default function EnergyConsumptionPage() {
  const [energyData, setEnergyData] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { user } = useContext(AuthContext);

  React.useEffect(() => {
    if (!user?.uid) return;

    const loadEnergyData = async () => {
      try {
        setIsLoading(true);
        // Placeholder: Replace with actual Firestore data loading
        setEnergyData([]);
      } catch (error) {
        console.error("Error loading energy data:", error);
        toast.error("Failed to load energy consumption data");
      } finally {
        setIsLoading(false);
      }
    };

    loadEnergyData();
  }, [user]);

  const handleUpdate = (id, updatedData) => {
    setEnergyData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedData } : item))
    );
    toast.success("Energy record updated successfully");
  };

  const handleDelete = (id) => {
    setEnergyData((prev) => prev.filter((item) => item.id !== id));
    toast.success("Energy record deleted successfully");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <IconBolt className="h-12 w-12 text-yellow-500 mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading energy data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <EnergyConsumptionTable
        data={energyData}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
}