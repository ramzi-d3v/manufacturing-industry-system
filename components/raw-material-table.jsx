// components/raw-material-table.jsx
"use client";

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

// Categories from your popup
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

// Material types
const materialTypes = [
  "raw",
  "packaging",
  "chemical",
  "hardware",
  "electronics",
  "other",
];

const statuses = [
  "In Stock",
  "Low Stock",
  "Out of Stock",
];

// Status icon mapping
const getStatusIcon = (status) => {
  switch (status) {
    case "In Stock":
      return <IconCircleCheck className="h-4 w-4 text-green-500" />;
    case "Low Stock":
      return <IconAlertTriangle className="h-4 w-4 text-yellow-500" />;
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
    case "Low Stock":
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
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

// View Material Dialog
function MaterialViewerDialog({ material, open, onOpenChange, onEdit, onDelete }) {
  if (!material) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[90vw] max-w-[90vw] sm:w-[85vw] sm:max-w-[85vw] md:w-[80vw] md:max-w-[80vw] lg:w-[75vw] lg:max-w-[75vw] xl:w-[70vw] xl:max-w-[70vw] p-6 gap-4 bg-background max-h-[90vh] overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <IconPackage className="h-6 w-6 text-primary" />
            Material Details
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-xs">
            <IconBarcode className="h-3 w-3" />
            Batch: {material.batchNumber || material.sku || "N/A"}
            <span>•</span>
            <span>Added: {formatDate(material.createdAt)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge className={getStatusColor(material.status)}>
                  {material.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg mt-2">{material.name}</h3>
              <p className="text-sm text-muted-foreground">{material.type} • {material.category}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <IconBuildingStore className="h-4 w-4" />
                Supplier
              </h4>
              <p className="text-sm">{material.supplierName || "N/A"}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <IconLocation className="h-4 w-4" />
                Storage Location
              </h4>
              <p className="text-sm">{material.location || "Not specified"}</p>
            </div>

            {material.description && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <IconClipboard className="h-4 w-4" />
                  Description
                </h4>
                <p className="text-sm text-muted-foreground">{material.description}</p>
              </div>
            )}
          </div>

          {/* Stock and Pricing */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Current Stock</p>
                <p className="text-xl font-semibold">
                  {material.currentStock} <span className="text-sm font-normal text-muted-foreground">{material.unit}</span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Unit Price</p>
                <p className="text-xl font-semibold">
                  ${material.unitPrice} <span className="text-sm font-normal text-muted-foreground">per {material.unit}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Minimum Stock</p>
                <p className="text-sm font-medium">{material.minimumStock} {material.unit}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Maximum Stock</p>
                <p className="text-sm font-medium">{material.maximumStock} {material.unit}</p>
              </div>
            </div>

            <div className="p-3 bg-primary/5 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Inventory Value</p>
              <p className="text-lg font-bold text-primary">
                ${(material.currentStock * material.unitPrice).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onOpenChange(false);
              onEdit(material);
            }}
          >
            <IconEdit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              onDelete(material.id);
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

// Edit Material Component
function MaterialEditor({ material, open, onOpenChange, onSave, categories }) {
  const [formData, setFormData] = React.useState(null);

  React.useEffect(() => {
    if (material) {
      setFormData({ ...material });
    }
  }, [material]);

  const handleChange = (e) => {
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
  };

  const handleSubmit = () => {
    if (!formData) return;
    
    if (!formData.name || !formData.batchNumber || !formData.supplierId || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }
    onSave(formData);
    onOpenChange(false);
  };

  if (!material || !formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[90vw] max-w-[90vw] sm:w-[85vw] sm:max-w-[85vw] md:w-[80vw] md:max-w-[80vw] lg:w-[75vw] lg:max-w-[75vw] xl:w-[70vw] xl:max-w-[70vw] h-[93vh] max-h-[93vh] p-6 gap-4 bg-background overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <IconEdit className="h-5 w-5" />
            Edit Raw Material
          </DialogTitle>
          <DialogDescription>Update the material details below.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Material Name *</Label>
              <Input
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label>Batch Number *</Label>
              <Input
                name="batchNumber"
                value={formData.batchNumber || formData.sku || ""}
                onChange={handleChange}
                placeholder="e.g., BATCH-2024-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Material Type</Label>
              <Select
                value={formData.type || "raw"}
                onValueChange={(value) => handleSelectChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {materialTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={formData.category || ""}
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id || cat} value={cat.id || cat}>
                      {cat.name || cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stock Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input
                name="unit"
                value={formData.unit || "kg"}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label>Current Stock</Label>
              <Input
                name="currentStock"
                type="number"
                step="0.01"
                value={formData.currentStock || 0}
                onChange={(e) => handleNumberChange("currentStock", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Min Stock</Label>
              <Input
                name="minimumStock"
                type="number"
                step="0.01"
                value={formData.minimumStock || 0}
                onChange={(e) => handleNumberChange("minimumStock", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Stock</Label>
              <Input
                name="maximumStock"
                type="number"
                step="0.01"
                value={formData.maximumStock || 0}
                onChange={(e) => handleNumberChange("maximumStock", e.target.value)}
              />
            </div>
          </div>

          {/* Pricing and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit Price ($)</Label>
              <Input
                name="unitPrice"
                type="number"
                step="0.01"
                value={formData.unitPrice || 0}
                onChange={(e) => handleNumberChange("unitPrice", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Storage Location</Label>
              <Input
                name="location"
                value={formData.location || ""}
                onChange={handleChange}
                placeholder="e.g., Warehouse A, Rack 5"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <IconEdit className="mr-2 h-4 w-4" />
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
        accessorKey: "currentStock",
        header: "Stock",
        cell: ({ row }) => (
          <div className="text-sm flex items-center gap-1 whitespace-nowrap">
            <IconScale className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>{row.original.currentStock}</span>
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
            <span>${row.original.unitPrice}</span>
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
      />
    </>
  );
}

// Missing icon imports (add these at the top with other imports)
