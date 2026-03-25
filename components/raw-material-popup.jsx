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
} from "@tabler/icons-react";

// Unit options
const unitOptions = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "lb", label: "Pounds (lb)" },
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "roll", label: "Rolls" },
  { value: "sheet", label: "Sheets" },
  { value: "meter", label: "Meters (m)" },
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
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [selectedSupplierDetails, setSelectedSupplierDetails] = useState(null);
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
    unitPrice: "",
    description: "",
    location: "",
    status: "In Stock",
  });

  // Fetch suppliers from the correct subcollection structure
  useEffect(() => {
    const fetchSuppliers = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setLoadingSuppliers(true);
      try {
        // Fetch suppliers from suppliers/{userId}/list
        const suppliersRef = collection(db, "suppliers", user.uid, "list");
        const suppliersSnapshot = await getDocs(suppliersRef);
        const suppliersData = suppliersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSuppliers(suppliersData);
        console.log("Suppliers loaded:", suppliersData.length);
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
        unitPrice: material.unitPrice?.toString() || "",
        description: material.description || "",
        location: material.location || "",
        status: material.status || "In Stock",
      });
      
      // Set selected supplier details if supplierId exists
      if (material.supplierId) {
        const supplier = suppliers.find(s => s.id === material.supplierId);
        if (supplier) {
          setSelectedSupplierDetails(supplier);
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
        unitPrice: "",
        description: "",
        location: "",
        status: "In Stock",
      });
      setSelectedSupplierDetails(null);
    }
  }, [material, open, suppliers]);

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
    if (formData.unitPrice && formData.unitPrice < 0) {
      toast.error("Unit price cannot be negative");
      return false;
    }
    return true;
  };

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
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : 0,
        updatedAt: Timestamp.now(),
        userId: user.uid,
      };

      console.log("Saving material data:", materialData);

      if (material?.id) {
        // Update existing material in user's subcollection
        const materialRef = doc(db, "rawMaterials", user.uid, "materials", material.id);
        await updateDoc(materialRef, materialData);
        toast.success("Material updated successfully!");
      } else {
        // Add new material to user's subcollection
        materialData.createdAt = Timestamp.now();
        materialData.createdBy = user.uid;
        const userMaterialsRef = collection(db, "rawMaterials", user.uid, "materials");
        const docRef = await addDoc(userMaterialsRef, materialData);
        console.log("Material saved with ID:", docRef.id);
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

  const getStatusColor = (status) => {
    return status === "In Stock" ? "text-green-600 bg-green-500/10" : "text-red-600 bg-red-500/10";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[90vw] max-w-[90vw] sm:w-[85vw] sm:max-w-[85vw] md:w-[80vw] md:max-w-[80vw] lg:w-[75vw] lg:max-w-[75vw] xl:w-[70vw] xl:max-w-[70vw] h-[90vh] max-h-[90vh] p-6 gap-4 bg-background overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <IconPackage className="h-6 w-6 text-primary" />
            {material ? "Edit Raw Material" : "Add New Raw Material"}
          </DialogTitle>
          <DialogDescription>
            {material 
              ? "Update the material details below." 
              : "Enter the details of the new raw material. Batch number is required for tracking."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <IconInfoCircle className="h-4 w-4" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Material Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Stainless Steel Sheet"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="batchNumber" className="flex items-center gap-2">
                  <IconBarcode className="h-4 w-4" />
                  Batch Number *
                </Label>
                <Input
                  id="batchNumber"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., BATCH-2024-001, LOT-12345"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a unique batch number for this material
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Material Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange("type", value)}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id || category} value={category.id || category} className="cursor-pointer">
                        {category.name || category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger className="cursor-pointer">
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
                <p className="text-xs text-muted-foreground">
                  Current availability status of this material
                </p>
              </div>
            </div>
          </div>

          {/* Supplier Information Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <IconBuildingStore className="h-4 w-4" />
              Supplier Information
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supplierId">Supplier *</Label>
                <Select
                  value={formData.supplierId}
                  onValueChange={(value) => handleSelectChange("supplierId", value)}
                  disabled={loadingSuppliers}
                >
                  <SelectTrigger className="cursor-pointer">
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

              {/* Display Supplier Contact Information */}
              {selectedSupplierDetails && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Supplier Contact Information</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedSupplierDetails.contact && (
                      <div className="flex items-center gap-2 text-sm">
                        <IconUser className="h-4 w-4 text-muted-foreground" />
                        <span>Contact: {selectedSupplierDetails.contact}</span>
                      </div>
                    )}
                    {selectedSupplierDetails.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <IconPhone className="h-4 w-4 text-muted-foreground" />
                        <span>Phone: {selectedSupplierDetails.phone}</span>
                      </div>
                    )}
                    {selectedSupplierDetails.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <IconMail className="h-4 w-4 text-muted-foreground" />
                        <span>Email: {selectedSupplierDetails.email}</span>
                      </div>
                    )}
                    {selectedSupplierDetails.address && (
                      <div className="flex items-center gap-2 text-sm col-span-2">
                        <IconMapPin className="h-4 w-4 text-muted-foreground" />
                        <span>Address: {selectedSupplierDetails.address}</span>
                      </div>
                    )}
                  </div>
                  {!selectedSupplierDetails.contact && !selectedSupplierDetails.phone && !selectedSupplierDetails.email && (
                    <p className="text-xs text-muted-foreground">No additional contact information available for this supplier.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Unit and Pricing Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <IconScale className="h-4 w-4" />
              Unit & Pricing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit of Measure</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => handleSelectChange("unit", value)}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price ($)</Label>
                <Input
                  id="unitPrice"
                  name="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => handleNumberChange("unitPrice", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Storage Information Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <IconLocation className="h-4 w-4" />
              Storage Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Storage Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Warehouse A, Rack 5, Shelf 2"
                />
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <IconClipboard className="h-4 w-4" />
              Description
            </h3>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the material..."
                rows={3}
              />
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <IconAlertCircle className="h-4 w-4" />
              Quick Tips
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Use unique batch numbers for better traceability</li>
              <li>• Update status to track material availability (In Stock/Out of Stock)</li>
              <li>• Add storage location for easier inventory management</li>
              <li>• Unit price helps track inventory value</li>
              <li>• Supplier contact information is displayed for reference</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={loading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="cursor-pointer"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {material ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>
                <IconPackage className="mr-2 h-4 w-4" />
                {material ? "Update Material" : "Add Material"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

