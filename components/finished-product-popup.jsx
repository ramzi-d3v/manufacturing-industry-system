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
  IconBuildingWarehouse,
  IconTruck,
  IconMapPin,
  IconLoader,
  IconLocation,
  IconLayoutGrid,
  IconEdit,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, getDocs, query, limit, doc, updateDoc } from "firebase/firestore";

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
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(false);
  const [customWarehouse, setCustomWarehouse] = useState({
    name: "",
    location: "",
  });
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
    location: "",
    warehouseId: "",
    warehouseName: "",
    storageLocationId: "",
    storageLocationName: "",
    shelfLocation: "",
  });

  const [isEditing, setIsEditing] = useState(false);

  // Fetch warehouses from Firestore
  useEffect(() => {
    if (!user || !open) return;

    const fetchWarehouses = async () => {
      setLoadingLocations(true);
      try {
        const warehousesRef = collection(db, "warehouses", user.uid, "list");
        const q = query(warehousesRef, limit(100));
        const warehousesSnapshot = await getDocs(q);
        const warehousesData = warehousesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setWarehouses(warehousesData);
      } catch (err) {
        console.error("Error fetching warehouses:", err);
        if (err.code !== 'failed-precondition') {
          toast.error("Failed to load warehouses");
        }
        setWarehouses([]);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchWarehouses();
  }, [user, open]);

  // Fetch storage locations when warehouse is selected
  useEffect(() => {
    if (!user || !formData.warehouseId || !open) {
      setStorageLocations([]);
      return;
    }

    const fetchStorageLocations = async () => {
      setLoadingStorage(true);
      try {
        // Fetch storage locations from warehouses/{userId}/list/{warehouseId}/storage
        const storageRef = collection(db, "warehouses", user.uid, "list", formData.warehouseId, "storage");
        const storageSnapshot = await getDocs(storageRef);
        const storageData = storageSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStorageLocations(storageData);
      } catch (err) {
        console.error("Error fetching storage locations:", err);
        setStorageLocations([]);
      } finally {
        setLoadingStorage(false);
      }
    };

    fetchStorageLocations();
  }, [user, formData.warehouseId, open]);

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
        location: product.location || "",
        warehouseId: product.warehouseId || "",
        warehouseName: product.warehouseName || "",
        storageLocationId: product.storageLocationId || "",
        storageLocationName: product.storageLocationName || "",
        shelfLocation: product.shelfLocation || "",
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
      location: "",
      warehouseId: "",
      warehouseName: "",
      storageLocationId: "",
      storageLocationName: "",
      shelfLocation: "",
    });
    setStorageLocations([]);
    setEditingWarehouse(false);
    setCustomWarehouse({ name: "", location: "" });
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

  const handleWarehouseSelect = (warehouseId) => {
    if (warehouseId === "custom") {
      setEditingWarehouse(true);
      setFormData(prev => ({
        ...prev,
        warehouseId: "",
        warehouseName: "",
        location: "",
        storageLocationId: "",
        storageLocationName: "",
      }));
      return;
    }
    
    const selectedWarehouse = warehouses.find(w => w.id === warehouseId);
    if (selectedWarehouse) {
      setFormData(prev => ({
        ...prev,
        warehouseId: selectedWarehouse.id,
        warehouseName: selectedWarehouse.name,
        location: selectedWarehouse.location || selectedWarehouse.address || "",
        storageLocationId: "", // Reset storage location when warehouse changes
        storageLocationName: "",
      }));
      setEditingWarehouse(false);
    }
  };

  const handleCustomWarehouseChange = (e) => {
    const { name, value } = e.target;
    setCustomWarehouse(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCustomWarehouse = () => {
    if (!customWarehouse.name) {
      toast.error("Please enter warehouse name");
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      warehouseId: "custom",
      warehouseName: customWarehouse.name,
      location: customWarehouse.location,
    }));
    setEditingWarehouse(false);
    setCustomWarehouse({ name: "", location: "" });
    toast.success("Custom warehouse added");
  };

  const handleStorageLocationSelect = (storageId) => {
    const selectedStorage = storageLocations.find(s => s.id === storageId);
    if (selectedStorage) {
      setFormData(prev => ({
        ...prev,
        storageLocationId: selectedStorage.id,
        storageLocationName: selectedStorage.name,
        shelfLocation: selectedStorage.shelfLocation || selectedStorage.location || "",
      }));
    }
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
      batchNumber: formData.batchNumber || "",
      category: formData.category,
      unit: formData.unit || "pcs",
      quantity: formData.quantity || 0,
      costPrice: formData.costPrice || 0,
      sellingPrice: formData.sellingPrice || 0,
      qualityGrade: formData.qualityGrade,
      testingStatus: formData.testingStatus,
      description: formData.description || "",
      productionDate: formData.productionDate ? format(formData.productionDate, "yyyy-MM-dd") : null,
      expiryDate: formData.expiryDate ? format(formData.expiryDate, "yyyy-MM-dd") : null,
      noExpiry: formData.noExpiry,
      location: formData.location || "",
      warehouseId: formData.warehouseId || "",
      warehouseName: formData.warehouseName || "",
      storageLocationId: formData.storageLocationId || "",
      storageLocationName: formData.storageLocationName || "",
      shelfLocation: formData.shelfLocation || "",
    };

    try {
      await onProductAdded(submitData);
      resetForm();
      onOpenChange(false);
      toast.success(isEditing ? "Product updated successfully!" : "Product added successfully!");
    } catch (err) {
      console.error("Error saving product:", err);
      toast.error("Failed to save product: " + err.message);
    } finally {
      setLoading(false);
    }
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

        {(loadingLocations || loadingStorage) && (
          <div className="flex items-center justify-center py-4">
            <IconLoader className="animate-spin h-5 w-5 text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              {loadingLocations ? "Loading warehouses..." : "Loading storage locations..."}
            </span>
          </div>
        )}

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

          {/* Warehouse & Storage Location Information */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2 border-b pb-2">
              <IconBuildingWarehouse className="h-3 w-3 sm:h-4 sm:w-4" />
              Warehouse & Storage Location
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Select Warehouse</Label>
                {!editingWarehouse ? (
                  <>
                    <Select
                      value={formData.warehouseId}
                      onValueChange={handleWarehouseSelect}
                    >
                      <SelectTrigger className="h-10 sm:h-11 bg-background/50">
                        <SelectValue placeholder={warehouses.length === 0 ? "No warehouses available" : "Select warehouse"} />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            <div className="flex items-center gap-2">
                              <IconBuildingWarehouse className="h-3 w-3" />
                              <span>{warehouse.name}</span>
                              {warehouse.location && (
                                <span className="text-xs text-muted-foreground">({warehouse.location})</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="custom" className="text-primary">
                          <div className="flex items-center gap-2">
                            <IconPlus className="h-3 w-3" />
                            <span>+ Add Custom Warehouse</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.warehouseName && formData.warehouseId !== "custom" && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Selected: {formData.warehouseName}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <Input
                      name="name"
                      placeholder="Warehouse Name *"
                      value={customWarehouse.name}
                      onChange={handleCustomWarehouseChange}
                      className="h-10 sm:h-11 bg-background/50"
                    />
                    <Input
                      name="location"
                      placeholder="Warehouse Location"
                      value={customWarehouse.location}
                      onChange={handleCustomWarehouseChange}
                      className="h-10 sm:h-11 bg-background/50"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCustomWarehouse}
                        className="flex-1"
                      >
                        <IconPlus className="mr-1 h-3 w-3" />
                        Add Warehouse
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingWarehouse(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {formData.warehouseId && storageLocations.length > 0 && !editingWarehouse && (
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-xs sm:text-sm flex items-center gap-2">
                    <IconLayoutGrid className="h-3 w-3" />
                    Select Storage Location
                  </Label>
                  <Select
                    value={formData.storageLocationId}
                    onValueChange={handleStorageLocationSelect}
                  >
                    <SelectTrigger className="h-10 sm:h-11 bg-background/50">
                      <SelectValue placeholder="Select storage location" />
                    </SelectTrigger>
                    <SelectContent>
                      {storageLocations.map((storage) => (
                        <SelectItem key={storage.id} value={storage.id}>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <IconLocation className="h-3 w-3" />
                              <span className="font-medium">{storage.name}</span>
                            </div>
                            {storage.shelfLocation && (
                              <span className="text-xs text-muted-foreground ml-5">
                                Shelf: {storage.shelfLocation}
                              </span>
                            )}
                            {storage.capacity && (
                              <span className="text-xs text-muted-foreground ml-5">
                                Capacity: {storage.capacity}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.warehouseId && storageLocations.length === 0 && !loadingStorage && !editingWarehouse && (
                <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded-lg">
                  No storage locations found. Please add storage locations to this warehouse first.
                </div>
              )}

              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Shelf / Rack Location</Label>
                <Input
                  name="shelfLocation"
                  value={formData.shelfLocation}
                  onChange={handleInputChange}
                  placeholder="e.g., A-12, Rack 3, Shelf B"
                  className="h-10 sm:h-11 bg-background/50"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Warehouse Address</Label>
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Warehouse address"
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
                <Label className="text-xs sm:text-sm">Cost Price (Tsh)</Label>
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
                <Label className="text-xs sm:text-sm">Selling Price (Tsh)</Label>
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
                <IconLoader className="mr-2 h-4 w-4 animate-spin" />
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