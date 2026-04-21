// components/raw-material-popup.jsx
"use client";

import { useState, useEffect } from "react";
import { IconUser } from "@tabler/icons-react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import {
  IconPackage,
  IconBuildingStore,
  IconScale,
  IconCurrencyDollar,
  IconClipboard,
  IconInfoCircle,
  IconLocation,
  IconAlertCircle,
  IconBarcode,
  IconPhone,
  IconMail,
  IconMapPin,
  IconBuildingWarehouse,
  IconBox,
} from "@tabler/icons-react";

// Unit options - including square meters (m²)
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

// Material type options
const materialTypeOptions = [
  { value: "raw", label: "Raw Material" },
  { value: "packaging", label: "Packaging Material" },
  { value: "chemical", label: "Chemical" },
  { value: "hardware", label: "Hardware" },
  { value: "electronics", label: "Electronics" },
  { value: "other", label: "Other" },
];

// Status options - only In Stock and Out of Stock
const statusOptions = [
  { value: "In Stock", label: "In Stock", color: "text-green-600", bg: "bg-green-500/10" },
  { value: "Out of Stock", label: "Out of Stock", color: "text-red-600", bg: "bg-red-500/10" },
];

export function RawMaterialPopup({ 
  open, 
  onOpenChange, 
  onMaterialAdded,
  material = null,
  categories = []
}) {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [selectedSupplierDetails, setSelectedSupplierDetails] = useState(null);
  const [selectedWarehouseDetails, setSelectedWarehouseDetails] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    batchNumber: "",
    supplierId: "",
    supplierName: "",
    supplierContact: "",
    supplierPhone: "",
    supplierEmail: "",
    category: "",
    type: "raw",
    unit: "kg",
    quantity: "",
    unitPrice: "",
    description: "",
    location: "",
    warehouseId: "",
    warehouseName: "",
    status: "In Stock",
  });

  // Fetch suppliers from suppliers/{userId}/list subcollection
  useEffect(() => {
    const fetchSuppliers = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setLoadingSuppliers(true);
      try {
        // Fetch suppliers from user-specific subcollection: suppliers/{userId}/list
        const suppliersRef = collection(db, "suppliers", user.uid, "list");
        const suppliersSnapshot = await getDocs(suppliersRef);
        const suppliersData = suppliersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSuppliers(suppliersData);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        toast.error("Failed to load suppliers");
      } finally {
        setLoadingSuppliers(false);
      }
    };

    if (open) {
      fetchSuppliers();
    }
  }, [open]);

  // Fetch warehouses from warehouses/{userId}/list
  useEffect(() => {
    const fetchWarehouses = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setLoadingWarehouses(true);
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
        toast.error("Failed to load warehouses");
      } finally {
        setLoadingWarehouses(false);
      }
    };

    if (open) {
      fetchWarehouses();
    }
  }, [open]);

  useEffect(() => {
    if (material) {
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
      
      // Set selected supplier details if supplierId exists
      if (material.supplierId) {
        const supplier = suppliers.find(s => s.id === material.supplierId);
        if (supplier) {
          setSelectedSupplierDetails(supplier);
        }
      }

      // Set selected warehouse details if warehouseId exists
      if (material.warehouseId) {
        const warehouse = warehouses.find(w => w.id === material.warehouseId);
        if (warehouse) {
          setSelectedWarehouseDetails(warehouse);
        }
      }
    } else {
      setFormData({
        name: "",
        batchNumber: "",
        supplierId: "",
        supplierName: "",
        supplierContact: "",
        supplierPhone: "",
        supplierEmail: "",
        category: "",
        type: "raw",
        unit: "kg",
        quantity: "",
        unitPrice: "",
        description: "",
        location: "",
        warehouseId: "",
        warehouseName: "",
        status: "In Stock",
      });
      setSelectedSupplierDetails(null);
      setSelectedWarehouseDetails(null);
    }
  }, [material, open, suppliers, warehouses]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
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

  const handleNumberChange = (name, value) => {
    const numValue = value === "" ? "" : parseFloat(value);
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Material name is required");
      return false;
    }
    if (!formData.batchNumber.trim()) {
      toast.error("Batch number is required");
      return false;
    }
    if (!formData.supplierId) {
      toast.error("Please select a supplier");
      return false;
    }
    if (!formData.category) {
      toast.error("Please select a category");
      return false;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return false;
    }
    if (formData.unitPrice && formData.unitPrice < 0) {
      toast.error("Unit price cannot be negative");
      return false;
    }
    return true;
  };

  // Calculate total value
  const totalValue = (formData.quantity && formData.unitPrice) 
    ? (parseFloat(formData.quantity) * parseFloat(formData.unitPrice)).toFixed(2) 
    : 0;

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const user = auth.currentUser;

    if (!user) {
      toast.error("You must be logged in to add materials");
      setLoading(false);
      return;
    }

    try {
      const materialData = {
        ...formData,
        quantity: parseFloat(formData.quantity) || 0,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : 0,
        totalValue: parseFloat(totalValue),
        updatedAt: Timestamp.now(),
        userId: user.uid,
      };

      if (material?.id) {
        const materialRef = doc(db, "rawMaterials", user.uid, "materials", material.id);
        await updateDoc(materialRef, materialData);
        toast.success("Material updated successfully!");
      } else {
        materialData.createdAt = Timestamp.now();
        materialData.createdBy = user.uid;
        const userMaterialsRef = collection(db, "rawMaterials", user.uid, "materials");
        await addDoc(userMaterialsRef, materialData);
        toast.success("Material added successfully!");
      }

      onMaterialAdded?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving material:", error);
      toast.error("Failed to save material. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] md:w-[85vw] md:max-w-[85vw] lg:w-[80vw] lg:max-w-[80vw] xl:w-[75vw] xl:max-w-[75vw] h-[90vh] max-h-[90vh] p-4 sm:p-6 gap-4 bg-background overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <IconPackage className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            {material ? "Edit Raw Material" : "Add New Raw Material"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {material 
              ? "Update the material details below." 
              : "Enter the details of the new raw material."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          {/* Basic Information Section */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <IconInfoCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="name" className="text-xs sm:text-sm">Material Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Stainless Steel Sheet"
                  autoFocus
                  className="text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="batchNumber" className="flex items-center gap-2 text-xs sm:text-sm">
                  <IconBarcode className="h-3 w-3 sm:h-4 sm:w-4" />
                  Batch Number *
                </Label>
                <Input
                  id="batchNumber"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., BATCH-2024-001"
                  className="text-sm"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Unique batch number for tracking
                </p>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="type" className="text-xs sm:text-sm">Material Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange("type", value)}
                >
                  <SelectTrigger className="cursor-pointer text-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="cursor-pointer text-sm">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="category" className="text-xs sm:text-sm">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger className="cursor-pointer text-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id || category} value={category.id || category} className="cursor-pointer text-sm">
                        {category.name || category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="status" className="text-xs sm:text-sm">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger className="cursor-pointer text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${option.value === "In Stock" ? "bg-green-500" : "bg-red-500"}`} />
                          {option.label}
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
                <Label htmlFor="quantity" className="text-xs sm:text-sm">Quantity *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => handleNumberChange("quantity", e.target.value)}
                  placeholder="0.00"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="unit" className="text-xs sm:text-sm">Unit of Measure</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => handleSelectChange("unit", value)}
                >
                  <SelectTrigger className="cursor-pointer text-sm">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="cursor-pointer text-sm">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="unitPrice" className="text-xs sm:text-sm">Unit Price ($)</Label>
                <Input
                  id="unitPrice"
                  name="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
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
                <Label htmlFor="warehouseId" className="text-xs sm:text-sm">Select Warehouse</Label>
                <Select
                  value={formData.warehouseId}
                  onValueChange={(value) => handleSelectChange("warehouseId", value)}
                  disabled={loadingWarehouses}
                >
                  <SelectTrigger className="cursor-pointer text-sm">
                    <SelectValue placeholder={loadingWarehouses ? "Loading warehouses..." : "Select warehouse"} />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id} className="cursor-pointer">
                        <div className="flex flex-col">
                          <span>{warehouse.name}</span>
                          <span className="text-xs text-muted-foreground">{warehouse.location}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {warehouses.length === 0 && !loadingWarehouses && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No warehouses found. Please add warehouses first.
                  </p>
                )}
              </div>

              {/* Display Warehouse Details when selected - Responsive for sm/xs */}
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
                    {selectedWarehouseDetails.capacity && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <IconScale className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span>Capacity: {selectedWarehouseDetails.capacity} sq ft</span>
                      </div>
                    )}
                    {selectedWarehouseDetails.type && (
                      <Badge variant="outline" className="w-fit text-[10px] sm:text-xs">
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
                <Label htmlFor="supplierId" className="text-xs sm:text-sm">Supplier *</Label>
                <Select
                  value={formData.supplierId}
                  onValueChange={(value) => handleSelectChange("supplierId", value)}
                  disabled={loadingSuppliers}
                >
                  <SelectTrigger className="cursor-pointer text-sm">
                    <SelectValue placeholder={loadingSuppliers ? "Loading suppliers..." : "Select supplier"} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id} className="cursor-pointer">
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {suppliers.length === 0 && !loadingSuppliers && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No suppliers found. Please add suppliers first.
                  </p>
                )}
              </div>

              {/* Display Supplier Contact Information - Responsive for sm/xs */}
              {selectedSupplierDetails && (
                <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-2">
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Supplier Contact Information
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    {selectedSupplierDetails.contact && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <IconUser className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span className="break-all">{selectedSupplierDetails.contact}</span>
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
              <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the material..."
                rows={3}
                className="text-sm"
              />
            </div>
          </div>

          {/* Quick Tips - Responsive */}
          <div className="bg-muted p-3 sm:p-4 rounded-lg">
            <h4 className="text-xs sm:text-sm font-medium mb-2 flex items-center gap-2">
              <IconAlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              Quick Tips
            </h4>
            <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-1">
              <li>• Use unique batch numbers for better traceability</li>
              <li>• Quantity and unit price will automatically calculate total value</li>
              <li>• Select warehouse to track material storage location</li>
              <li>• Update status to track material availability</li>
              <li>• Supplier contact information is displayed for reference</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={loading}
            className="cursor-pointer text-sm"
            size="sm"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="cursor-pointer text-sm"
            size="sm"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                {material ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>
                <IconPackage className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {material ? "Update Material" : "Add Material"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}