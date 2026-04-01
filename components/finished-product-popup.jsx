// components/finished-product-popup.jsx
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  IconPackage,
  IconCurrencyDollar,
  IconCalendar,
  IconAlertCircle,
  IconStar,
  IconAward,
  IconFlag,
  IconPlus,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Quality grade options
const qualityGradeOptions = [
  { value: "premium", label: "Premium", icon: IconAward, color: "text-purple-500" },
  { value: "flagship", label: "Flagship", icon: IconStar, color: "text-amber-500" },
  { value: "standard", label: "Standard", icon: IconPackage, color: "text-blue-500" },
  { value: "economy", label: "Economy", icon: IconFlag, color: "text-green-500" },
];

// Testing status options
const testingStatusOptions = [
  { value: "not_tested", label: "Not Tested Yet", color: "text-gray-500", bg: "bg-gray-500/10" },
  { value: "in_progress", label: "In Progress", color: "text-blue-500", bg: "bg-blue-500/10" },
  { value: "passed", label: "Passed", color: "text-green-500", bg: "bg-green-500/10" },
  { value: "failed", label: "Failed", color: "text-red-500", bg: "bg-red-500/10" },
  { value: "rework", label: "Needs Rework", color: "text-orange-500", bg: "bg-orange-500/10" },
];

export function FinishedProductPopup({
  open,
  onOpenChange,
  onProductAdded,
  product,
  categories,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    batchNumber: "",
    category: "",
    unit: "pcs",
    quantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    qualityGrade: "standard",
    testingStatus: "not_tested",
    description: "",
    productionDate: null,
    expiryDate: null,
    noExpiry: false,
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        batchNumber: product.batchNumber || "",
        category: product.category || "",
        unit: product.unit || "pcs",
        quantity: product.quantity || 0,
        costPrice: product.costPrice || 0,
        sellingPrice: product.sellingPrice || 0,
        qualityGrade: product.qualityGrade || "standard",
        testingStatus: product.testingStatus || "not_tested",
        description: product.description || "",
        productionDate: product.productionDate ? new Date(product.productionDate) : null,
        expiryDate: product.expiryDate ? new Date(product.expiryDate) : null,
        noExpiry: product.noExpiry || false,
      });
      setIsEditing(true);
    } else {
      resetForm();
      setIsEditing(false);
    }
  }, [product]);

  const resetForm = () => {
    setFormData({
      name: "",
      batchNumber: "",
      category: "",
      unit: "pcs",
      quantity: 0,
      costPrice: 0,
      sellingPrice: 0,
      qualityGrade: "standard",
      testingStatus: "not_tested",
      description: "",
      productionDate: null,
      expiryDate: null,
      noExpiry: false,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({ ...prev, noExpiry: checked }));
    if (checked) {
      setFormData((prev) => ({ ...prev, expiryDate: null }));
    }
  };

  const handleDateChange = (name, date) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    const submitData = {
      name: formData.name,
      batchNumber: formData.batchNumber,
      category: formData.category,
      unit: formData.unit,
      quantity: formData.quantity,
      costPrice: formData.costPrice,
      sellingPrice: formData.sellingPrice,
      qualityGrade: formData.qualityGrade,
      testingStatus: formData.testingStatus,
      description: formData.description,
      productionDate: formData.productionDate ? format(formData.productionDate, "yyyy-MM-dd") : null,
      expiryDate: formData.expiryDate ? format(formData.expiryDate, "yyyy-MM-dd") : null,
      noExpiry: formData.noExpiry,
    };

    await onProductAdded(submitData);
    resetForm();
    onOpenChange(false);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // Get the selected quality grade icon
  const getQualityIcon = (grade) => {
    const found = qualityGradeOptions.find(g => g.value === grade);
    if (found) {
      const Icon = found.icon;
      return <Icon className={`h-4 w-4 ${found.color}`} />;
    }
    return <IconPackage className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] md:w-[85vw] md:max-w-[85vw] lg:w-[80vw] lg:max-w-[80vw] xl:w-[75vw] xl:max-w-[75vw] h-[90vh] max-h-[90vh] p-4 sm:p-6 gap-4 bg-background/95 backdrop-blur-md border-border/50 overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <IconPackage className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            {isEditing ? "Edit Finished Product" : "Add New Finished Product"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {isEditing 
              ? "Update the product details below." 
              : "Enter the details of your finished product. Click save when you're done."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <IconPackage className="h-3 w-3 sm:h-4 sm:w-4" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Product Name *</Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Premium Headphones"
                  className="h-10 sm:h-11 bg-background/50"
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Batch Number</Label>
                <Input
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., BATCH-2024-001"
                  className="h-10 sm:h-11 bg-background/50"
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger className="h-10 sm:h-11 bg-background/50">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id || cat} value={cat.name || cat}>
                        {cat.name || cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Unit</Label>
                <Input
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  placeholder="pcs, kg, etc."
                  className="h-10 sm:h-11 bg-background/50"
                />
              </div>
            </div>
          </div>

          {/* Quantity and Pricing */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <IconCurrencyDollar className="h-3 w-3 sm:h-4 sm:w-4" />
              Quantity & Pricing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Quantity</Label>
                <Input
                  name="quantity"
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => handleNumberChange("quantity", e.target.value)}
                  className="h-10 sm:h-11 bg-background/50"
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Cost Price (USD)</Label>
                <Input
                  name="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => handleNumberChange("costPrice", e.target.value)}
                  className="h-10 sm:h-11 bg-background/50"
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Selling Price (USD)</Label>
                <Input
                  name="sellingPrice"
                  type="number"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => handleNumberChange("sellingPrice", e.target.value)}
                  className="h-10 sm:h-11 bg-background/50"
                />
              </div>
            </div>
          </div>

          {/* Quality Grade and Testing Status */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <IconAward className="h-3 w-3 sm:h-4 sm:w-4" />
              Quality & Testing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Quality Grade</Label>
                <Select
                  value={formData.qualityGrade}
                  onValueChange={(value) => handleSelectChange("qualityGrade", value)}
                >
                  <SelectTrigger className="h-10 sm:h-11 bg-background/50">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {getQualityIcon(formData.qualityGrade)}
                        <span>{qualityGradeOptions.find(g => g.value === formData.qualityGrade)?.label || formData.qualityGrade}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {qualityGradeOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${option.color}`} />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Testing Status</Label>
                <Select
                  value={formData.testingStatus}
                  onValueChange={(value) => handleSelectChange("testingStatus", value)}
                >
                  <SelectTrigger className="h-10 sm:h-11 bg-background/50">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          formData.testingStatus === "not_tested" ? "bg-gray-500" :
                          formData.testingStatus === "in_progress" ? "bg-blue-500" :
                          formData.testingStatus === "passed" ? "bg-green-500" :
                          formData.testingStatus === "failed" ? "bg-red-500" :
                          "bg-orange-500"
                        }`} />
                        <span>{testingStatusOptions.find(t => t.value === formData.testingStatus)?.label || "Select status"}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {testingStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            option.value === "not_tested" ? "bg-gray-500" :
                            option.value === "in_progress" ? "bg-blue-500" :
                            option.value === "passed" ? "bg-green-500" :
                            option.value === "failed" ? "bg-red-500" :
                            "bg-orange-500"
                          }`} />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Production Date and Expiry Date */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <IconCalendar className="h-3 w-3 sm:h-4 sm:w-4" />
              Dates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label className="flex items-center gap-2 text-xs sm:text-sm">
                  <IconCalendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  Production Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10 sm:h-11 bg-background/50",
                        !formData.productionDate && "text-muted-foreground"
                      )}
                    >
                      <IconCalendar className="mr-2 h-4 w-4" />
                      {formData.productionDate ? (
                        format(formData.productionDate, "dd/MM/yyyy")
                      ) : (
                        <span>DD/MM/YYYY</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.productionDate}
                      onSelect={(date) => handleDateChange("productionDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="flex items-center gap-2 text-xs sm:text-sm">
                  <IconCalendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  Expiry Date
                </Label>
                <div className="space-y-2">
                  {!formData.noExpiry ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10 sm:h-11 bg-background/50",
                            !formData.expiryDate && "text-muted-foreground"
                          )}
                          disabled={formData.noExpiry}
                        >
                          <IconCalendar className="mr-2 h-4 w-4" />
                          {formData.expiryDate ? (
                            format(formData.expiryDate, "dd/MM/yyyy")
                          ) : (
                            <span>DD/MM/YYYY</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.expiryDate}
                          onSelect={(date) => handleDateChange("expiryDate", date)}
                          initialFocus
                          disabled={(date) => formData.productionDate ? date < formData.productionDate : false}
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal text-muted-foreground h-10 sm:h-11 bg-background/50"
                      disabled
                    >
                      <IconCalendar className="mr-2 h-4 w-4" />
                      <span>No expiry</span>
                    </Button>
                  )}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="noExpiry"
                      checked={formData.noExpiry}
                      onCheckedChange={handleCheckboxChange}
                    />
                    <Label htmlFor="noExpiry" className="text-[10px] sm:text-xs cursor-pointer text-muted-foreground">
                      This product doesn't expire
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <IconAlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              Description
            </h3>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Product description, features, benefits..."
              className="bg-background/50 resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={handleClose} className="cursor-pointer" disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="cursor-pointer">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? "Updating..." : "Saving..."}
              </>
            ) : (
              <>
                <IconPackage className="mr-2 h-4 w-4" />
                {isEditing ? "Update Product" : "Save Product"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}