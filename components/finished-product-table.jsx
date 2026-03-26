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
  IconCalendar,
  IconClock,
  IconRefresh,
  IconStar,
  IconAward,
  IconFlag,
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

// Quality grade mapping
const qualityGradeConfig = {
  premium: { icon: IconAward, color: "text-purple-500", bg: "bg-purple-500/10", label: "Premium" },
  flagship: { icon: IconStar, color: "text-amber-500", bg: "bg-amber-500/10", label: "Flagship" },
  standard: { icon: IconPackage, color: "text-blue-500", bg: "bg-blue-500/10", label: "Standard" },
  economy: { icon: IconFlag, color: "text-green-500", bg: "bg-green-500/10", label: "Economy" },
};

// Testing status mapping
const testingStatusConfig = {
  not_tested: { icon: IconClock, color: "text-gray-500", bg: "bg-gray-500/10", label: "Not Tested" },
  in_progress: { icon: IconRefresh, color: "text-blue-500", bg: "bg-blue-500/10", label: "In Progress" },
  passed: { icon: IconCircleCheck, color: "text-green-500", bg: "bg-green-500/10", label: "Passed" },
  failed: { icon: IconAlertTriangle, color: "text-red-500", bg: "bg-red-500/10", label: "Failed" },
  rework: { icon: IconRefresh, color: "text-orange-500", bg: "bg-orange-500/10", label: "Rework" },
};

// Stock status mapping based on quantity
const getStockStatus = (quantity) => {
  if (quantity === 0) return { label: "Out of Stock", color: "text-red-500", bg: "bg-red-500/10", icon: IconX };
  if (quantity <= 5) return { label: "Low Stock", color: "text-yellow-500", bg: "bg-yellow-500/10", icon: IconAlertTriangle };
  return { label: "In Stock", color: "text-green-500", bg: "bg-green-500/10", icon: IconCircleCheck };
};

// Check if product is expired
const isExpired = (expiryDate) => {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
};

// Check if product is nearing expiry (within 30 days)
const isNearExpiry = (expiryDate) => {
  if (!expiryDate) return false;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
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

// View Product Dialog with Glassmorphism
function ProductViewerDialog({ product, open, onOpenChange, onEdit, onDelete }) {
  if (!product) return null;

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const qualityConfig = qualityGradeConfig[product.qualityGrade] || qualityGradeConfig.standard;
  const QualityIcon = qualityConfig.icon;
  const testingConfig = testingStatusConfig[product.testingStatus] || testingStatusConfig.not_tested;
  const TestingIcon = testingConfig.icon;
  const stockStatus = getStockStatus(product.quantity);
  const StockIcon = stockStatus.icon;
  const expired = isExpired(product.expiryDate);
  const nearExpiry = isNearExpiry(product.expiryDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[90vw] max-w-[90vw] sm:w-[85vw] sm:max-w-[85vw] md:w-[80vw] md:max-w-[80vw] lg:w-[75vw] lg:max-w-[75vw] xl:w-[70vw] xl:max-w-[70vw] p-6 gap-4 bg-background/80 backdrop-blur-sm border-border/50 max-h-[90vh] overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <IconPackage className="h-6 w-6 text-primary" />
            Product Details
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-xs">
            <IconBarcode className="h-3 w-3" />
            Batch: {product.batchNumber || "N/A"}
            {product.productionDate && (
              <>
                <span>•</span>
                <IconCalendar className="h-3 w-3" />
                <span>Prod: {formatDate(product.productionDate)}</span>
              </>
            )}
            {product.expiryDate && !product.noExpiry && (
              <>
                <span>•</span>
                <IconCalendar className="h-3 w-3" />
                <span>Exp: {formatDate(product.expiryDate)}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="p-4 bg-background/40 backdrop-blur-sm rounded-lg border border-border/50">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <Badge className={cn(qualityConfig.bg, qualityConfig.color)}>
                  <QualityIcon className="h-3 w-3 mr-1" />
                  {qualityConfig.label}
                </Badge>
                <Badge className={cn(testingConfig.bg, testingConfig.color)}>
                  <TestingIcon className="h-3 w-3 mr-1" />
                  {testingConfig.label}
                </Badge>
                <Badge className={cn(stockStatus.bg, stockStatus.color)}>
                  <StockIcon className="h-3 w-3 mr-1" />
                  {stockStatus.label}
                </Badge>
                {expired && !product.noExpiry && (
                  <Badge className="bg-red-500/10 text-red-500">
                    <IconAlertCircle className="h-3 w-3 mr-1" />
                    Expired
                  </Badge>
                )}
                {nearExpiry && !expired && !product.noExpiry && (
                  <Badge className="bg-orange-500/10 text-orange-500">
                    <IconAlertCircle className="h-3 w-3 mr-1" />
                    Expiring Soon
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-lg mt-2">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.category}</p>
            </div>

            {product.description && (
              <div className="p-3 bg-background/40 backdrop-blur-sm rounded-lg border border-border/50">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <IconPackage className="h-4 w-4" />
                  Description
                </h4>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>
            )}
          </div>

          {/* Stock and Pricing */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-background/40 backdrop-blur-sm rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground">Quantity</p>
                <p className="text-xl font-semibold">
                  {product.quantity} <span className="text-sm font-normal text-muted-foreground">{product.unit}</span>
                </p>
              </div>
              <div className="p-3 bg-background/40 backdrop-blur-sm rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground">Selling Price</p>
                <p className="text-xl font-semibold">
                  ${product.sellingPrice?.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  per {product.unit}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-background/40 backdrop-blur-sm rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground">Cost Price</p>
                <p className="text-sm font-medium">${product.costPrice?.toLocaleString() || "N/A"}</p>
              </div>
              <div className="p-3 bg-background/40 backdrop-blur-sm rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground">Profit Margin</p>
                <p className="text-sm font-medium">
                  {product.costPrice && product.sellingPrice 
                    ? `${Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100)}%`
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="p-3 bg-primary/10 backdrop-blur-sm rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground">Total Inventory Value</p>
              <p className="text-lg font-bold text-primary">
                ${((product.quantity || 0) * (product.sellingPrice || 0)).toLocaleString()}
              </p>
            </div>

            {product.productionDate && (
              <div className="p-3 bg-background/40 backdrop-blur-sm rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground">Production Date</p>
                <p className="text-sm font-medium">{formatDate(product.productionDate)}</p>
              </div>
            )}

            {product.expiryDate && !product.noExpiry && (
              <div className={cn(
                "p-3 rounded-lg border",
                expired ? "bg-red-500/10 border-red-500/20" : 
                nearExpiry ? "bg-orange-500/10 border-orange-500/20" : 
                "bg-background/40 backdrop-blur-sm border-border/50"
              )}>
                <p className="text-xs text-muted-foreground">Expiry Date</p>
                <p className={cn(
                  "text-sm font-medium",
                  expired ? "text-red-500" : nearExpiry ? "text-orange-500" : ""
                )}>
                  {formatDate(product.expiryDate)}
                  {expired && " (Expired)"}
                  {nearExpiry && !expired && " (Expiring Soon)"}
                </p>
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
              onEdit(product);
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
              onDelete(product.id);
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

// Edit Product Dialog with Glassmorphism
function ProductEditor({ product, open, onOpenChange, onSave, categories }) {
  const [formData, setFormData] = React.useState(null);

  React.useEffect(() => {
    if (product) {
      setFormData({ ...product });
    }
  }, [product]);

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
    
    if (!formData.name || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }
    onSave(formData);
    onOpenChange(false);
  };

  if (!product || !formData) return null;

  const qualityGradeOptions = [
    { value: "premium", label: "Premium" },
    { value: "flagship", label: "Flagship" },
    { value: "standard", label: "Standard" },
    { value: "economy", label: "Economy" },
  ];

  const testingStatusOptions = [
    { value: "not_tested", label: "Not Tested Yet" },
    { value: "in_progress", label: "In Progress" },
    { value: "passed", label: "Passed" },
    { value: "failed", label: "Failed" },
    { value: "rework", label: "Needs Rework" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[90vw] max-w-[90vw] sm:w-[85vw] sm:max-w-[85vw] md:w-[80vw] md:max-w-[80vw] lg:w-[75vw] lg:max-w-[75vw] xl:w-[70vw] xl:max-w-[70vw] h-[93vh] max-h-[93vh] p-6 gap-4 bg-background/80 backdrop-blur-sm border-border/50 overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <IconEdit className="h-5 w-5" />
            Edit Finished Product
          </DialogTitle>
          <DialogDescription>Update the product details below.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input
                name="name"
                value={formData.name || ""}
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
                placeholder="e.g., BATCH-2024-001"
                className="bg-background/40 backdrop-blur-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={formData.category || ""}
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger className="bg-background/40 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id || cat} value={cat.name || cat}>
                      {cat.name || cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>

          {/* Quantity and Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label>Cost Price (USD)</Label>
              <Input
                name="costPrice"
                type="number"
                step="0.01"
                value={formData.costPrice || 0}
                onChange={(e) => handleNumberChange("costPrice", e.target.value)}
                className="bg-background/40 backdrop-blur-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Selling Price (USD)</Label>
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

          {/* Quality Grade and Testing Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quality Grade</Label>
              <Select
                value={formData.qualityGrade || "standard"}
                onValueChange={(value) => handleSelectChange("qualityGrade", value)}
              >
                <SelectTrigger className="bg-background/40 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {qualityGradeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Testing Status</Label>
              <Select
                value={formData.testingStatus || "not_tested"}
                onValueChange={(value) => handleSelectChange("testingStatus", value)}
              >
                <SelectTrigger className="bg-background/40 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {testingStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Production and Expiry Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Production Date</Label>
              <Input
                name="productionDate"
                type="date"
                value={formData.productionDate || ""}
                onChange={handleChange}
                className="bg-background/40 backdrop-blur-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                name="expiryDate"
                type="date"
                value={formData.expiryDate || ""}
                onChange={handleChange}
                className="bg-background/40 backdrop-blur-sm"
                disabled={formData.noExpiry}
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="noExpiry"
                  checked={formData.noExpiry || false}
                  onChange={(e) => handleSelectChange("noExpiry", e.target.checked)}
                  className="rounded border-border"
                />
                <Label htmlFor="noExpiry" className="text-xs cursor-pointer text-muted-foreground">
                  This product doesn't expire
                </Label>
              </div>
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
            Update Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main DataTable component for Finished Products
export function FinishedProductTable({
  data,
  onUpdate,
  onDelete,
  categories,
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
  const [viewingProduct, setViewingProduct] = React.useState(null);
  const [editingProduct, setEditingProduct] = React.useState(null);
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

  const handleView = (product) => {
    setViewingProduct(product);
    setViewDialogOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedProduct) => {
    onUpdate(updatedProduct);
    setEditingProduct(null);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
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
        header: "Batch",
        cell: ({ row }) => (
          <Button
            variant="link"
            className="font-mono text-left hover:underline p-0 h-auto text-sm"
            onClick={() => handleView(row.original)}
          >
            <IconBarcode className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
            <span className="truncate max-w-[100px]">{row.original.batchNumber || "N/A"}</span>
          </Button>
        ),
        size: isMobile ? 100 : 120,
      },
      {
        accessorKey: "name",
        header: "Product Name",
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
        accessorKey: "qualityGrade",
        header: "Grade",
        cell: ({ row }) => {
          const grade = row.original.qualityGrade;
          const config = qualityGradeConfig[grade] || qualityGradeConfig.standard;
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
        accessorKey: "testingStatus",
        header: "Testing",
        cell: ({ row }) => {
          const status = row.original.testingStatus;
          const config = testingStatusConfig[status] || testingStatusConfig.not_tested;
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
        cell: ({ row }) => {
          const product = row.original;
          const stockStatus = getStockStatus(product.quantity);
          const Icon = stockStatus.icon;
          return (
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Icon className={cn("h-3.5 w-3.5 shrink-0", stockStatus.color)} />
              <span className="text-sm">{product.quantity}</span>
              <span className="text-muted-foreground text-[11px]">{product.unit}</span>
            </div>
          );
        },
        size: 80,
      },
      {
        accessorKey: "sellingPrice",
        header: "Price",
        cell: ({ row }) => (
          <div className="text-sm font-medium flex items-center gap-1 whitespace-nowrap">
            <IconCurrencyDollar className="h-3.5 w-3.5 shrink-0" />
            <span>${row.original.sellingPrice?.toLocaleString()}</span>
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: "expiryDate",
        header: "Expiry",
        cell: ({ row }) => {
          const product = row.original;
          if (product.noExpiry) return <span className="text-xs text-muted-foreground">Never</span>;
          if (!product.expiryDate) return <span className="text-xs text-muted-foreground">N/A</span>;
          
          const expired = isExpired(product.expiryDate);
          const nearExpiry = isNearExpiry(product.expiryDate);
          const formattedDate = new Date(product.expiryDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          });
          
          return (
            <span className={cn(
              "text-xs",
              expired ? "text-red-500 font-medium" : nearExpiry ? "text-orange-500" : ""
            )}>
              {formattedDate}
              {expired && " (Expired)"}
            </span>
          );
        },
        size: 100,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const product = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-7 w-7 p-0">
                  <span className="sr-only">Open menu</span>
                  <IconDotsVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => handleView(product)} className="text-sm">
                  <IconEye className="mr-2 h-3.5 w-3.5" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(product)} className="text-sm">
                  <IconEdit className="mr-2 h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(product.id)}
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
        <div className="min-w-[1050px] md:min-w-full">
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
                      No finished products found. Click "Add Product" to get started.
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
      <ProductViewerDialog
        product={viewingProduct}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Edit Dialog */}
      <ProductEditor
        product={editingProduct}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
        categories={categories}
      />
    </>
  );
}