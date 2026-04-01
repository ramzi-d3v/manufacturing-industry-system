// app/setting/page.jsx
"use client";

import { useState, useEffect } from "react";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconUser,
  IconBuildingStore,
  IconBell,
  IconPalette,
  IconDatabase,
  IconDeviceFloppy,
  IconRefresh,
  IconTrash,
  IconAlertCircle,
  IconMoon,
  IconSun,
  IconDeviceLaptop,
  IconDownload,
  IconPackage,
  IconBug,
  IconBolt,
  IconClipboardList,
  IconCreditCard,
  IconBuildingBank,
  IconCash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { updatePassword, updateEmail, updateProfile } from "firebase/auth";

// Theme options
const themeOptions = [
  { value: "light", label: "Light", icon: IconSun },
  { value: "dark", label: "Dark", icon: IconMoon },
  { value: "system", label: "System", icon: IconDeviceLaptop },
];

export default function SettingsPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");

  const { theme: currentTheme, setTheme: setAppTheme } = useTheme();
  
  // Company Settings - Only fields from your function
  const [company, setCompany] = useState({
    companyName: "",
    tin: "",
    description: "",
    brelaName: "",
    businessLicenceYear: "",
    location: "",
  });
  
  // Personal Information - Only fields from your function
  const [personal, setPersonal] = useState({
    firstName: "",
    phone: "",
    email: "",
    role: "",
    gender: "",
  });
  
  // Financial Information - Only fields from your function
  const [financial, setFinancial] = useState({
    paymentMethod: "cash",
    cardNumber: "",
    expiry: "",
    cvv: "",
    bankName: "",
    accountNumber: "",
    recipientName: "",
    recipientPhone: "",
  });
  
  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    lowStockAlerts: true,
    defectReports: true,
    supplierUpdates: true,
    weeklyReport: true,
  });
  
  // Appearance Settings
  const [appearance, setAppearance] = useState({
    theme: "system",
  });
  
  // Password Change
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Load user settings from Firestore
  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      setLoading(true);
      try {
        const [companyDoc, personalDoc, financialDoc] = await Promise.all([
          getDoc(doc(db, "company_details", user.uid)),
          getDoc(doc(db, "user_details", user.uid)),
          getDoc(doc(db, "payment_info", user.uid)),
        ]);
        
        // Load Company Information
        if (companyDoc.exists()) {
          const data = companyDoc.data();
          setCompany({
            companyName: data.companyName || "",
            tin: data.tin || "",
            description: data.description || "",
            brelaName: data.brelaName || "",
            businessLicenceYear: data.businessLicenceYear || "",
            location: data.location || "",
          });
        }
        
        // Load Personal Information
        if (personalDoc.exists()) {
          const data = personalDoc.data();
          setPersonal({
            firstName: data.firstName || "",
            phone: data.phone || "",
            email: data.email || user.email || "",
            role: data.role || "",
            gender: data.gender || "",
          });
        } else {
          setPersonal(prev => ({
            ...prev,
            email: user.email || "",
          }));
        }
        
        // Load Financial Information
        if (financialDoc.exists()) {
          const data = financialDoc.data();
          setFinancial({
            paymentMethod: data.paymentMethod || "cash",
            cardNumber: data.cardNumber || "",
            expiry: data.expiry || "",
            cvv: data.cvv || "",
            bankName: data.bankName || "",
            accountNumber: data.accountNumber || "",
            recipientName: data.recipientName || "",
            recipientPhone: data.recipientPhone || "",
          });
        }
        
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [user]);

  const saveSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const timestamp = serverTimestamp();
      
      // 1. Company Information - Exactly as your function
      const companyInfo = {
        uid: user.uid,
        companyName: company.companyName,
        tin: company.tin,
        description: company.description,
        brelaName: company.brelaName,
        businessLicenceYear: company.businessLicenceYear,
        location: company.location,
        updatedAt: timestamp,
      };

      // 2. Personal Information - Exactly as your function
      const personalInfo = {
        uid: user.uid,
        firstName: personal.firstName,
        phone: personal.phone,
        email: personal.email,
        role: personal.role,
        gender: personal.gender,
        isAdmin: false,
        isApproved: false,
        createdAt: timestamp,
      };

      // 3. Financial Information - Exactly as your function
      let financialInfo = { 
        uid: user.uid, 
        paymentMethod: financial.paymentMethod, 
        updatedAt: timestamp 
      };
      
      if (financial.paymentMethod === "card") {
        financialInfo = { 
          ...financialInfo, 
          cardNumber: financial.cardNumber, 
          expiry: financial.expiry, 
          cvv: financial.cvv 
        };
      } else if (financial.paymentMethod === "bank") {
        financialInfo = { 
          ...financialInfo, 
          bankName: financial.bankName, 
          accountNumber: financial.accountNumber 
        };
      } else if (financial.paymentMethod === "cash") {
        financialInfo = { 
          ...financialInfo, 
          recipientName: financial.recipientName, 
          recipientPhone: financial.recipientPhone 
        };
      }

      // Save to specific collections
      await Promise.all([
        setDoc(doc(db, "company_details", user.uid), companyInfo, { merge: true }),
        setDoc(doc(db, "user_details", user.uid), personalInfo, { merge: true }),
        setDoc(doc(db, "payment_info", user.uid), financialInfo, { merge: true }),
      ]);
      
      // Update Firebase Auth profile
      if (personal.firstName && personal.firstName !== user.displayName) {
        await updateProfile(user, { displayName: personal.firstName });
      }
      if (personal.email !== user.email) {
        await updateEmail(user, personal.email);
      }
      
      // Apply theme if changed
      if (appearance.theme !== currentTheme) {
        setAppTheme(appearance.theme);
      }
      
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setChangingPassword(true);
    try {
      await updatePassword(user, passwordData.newPassword);
      toast.success("Password changed successfully!");
      setPasswordData({
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  };

  const exportAllData = async () => {
    setExporting(true);
    try {
      const userData = {};
      
      const collections = [
        { name: "company_details", path: "company_details" },
        { name: "user_details", path: "user_details" },
        { name: "payment_info", path: "payment_info" },
        { name: "rawMaterials", path: "rawMaterials", subcollection: "materials" },
        { name: "finishedGoods", path: "finishedGoods", subcollection: "materials" },
        { name: "defectReports", path: "defectReports" },
        { name: "suppliers", path: "suppliers", subcollection: "list" },
      ];
      
      for (const collectionInfo of collections) {
        setExportProgress(`Exporting ${collectionInfo.name}...`);
        
        let data = [];
        
        if (collectionInfo.subcollection) {
          const subRef = collection(db, collectionInfo.path, user.uid, collectionInfo.subcollection);
          const querySnapshot = await getDocs(subRef);
          data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
          const collectionRef = collection(db, collectionInfo.path);
          const querySnapshot = await getDocs(collectionRef);
          data = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(item => item.uid === user.uid || item.userId === user.uid);
        }
        
        userData[collectionInfo.name] = data;
      }
      
      userData.userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      };
      
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `manufacturing-export-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      setExportProgress("");
      toast.success("All data exported successfully!");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
      setExportProgress("");
    } finally {
      setExporting(false);
    }
  };

  const handleThemeChange = (themeValue) => {
    setAppearance({ ...appearance, theme: themeValue });
    setAppTheme(themeValue);
  };

  if (loadingAuth || loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex-1 p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>
            <Button onClick={saveSettings} disabled={saving} className="cursor-pointer">
              <IconDeviceFloppy className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="profile" className="cursor-pointer">
                <IconUser className="mr-2 h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="company" className="cursor-pointer">
                <IconBuildingStore className="mr-2 h-4 w-4" />
                Company
              </TabsTrigger>
              <TabsTrigger value="financial" className="cursor-pointer">
                <IconCreditCard className="mr-2 h-4 w-4" />
                Financial
              </TabsTrigger>
              <TabsTrigger value="notifications" className="cursor-pointer">
                <IconBell className="mr-2 h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="appearance" className="cursor-pointer">
                <IconPalette className="mr-2 h-4 w-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="data" className="cursor-pointer">
                <IconDatabase className="mr-2 h-4 w-4" />
                Data Management
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings - Only fields from your function */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={personal.firstName}
                        onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })}
                        placeholder="Your first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={personal.phone}
                        onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={personal.email}
                        onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                        placeholder="your@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role / Job Title</Label>
                      <Input
                        id="role"
                        value={personal.role}
                        onChange={(e) => setPersonal({ ...personal, role: e.target.value })}
                        placeholder="e.g., Production Manager"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={personal.gender}
                        onValueChange={(value) => setPersonal({ ...personal, gender: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={changePassword} 
                    disabled={changingPassword || !passwordData.newPassword}
                    className="cursor-pointer"
                  >
                    {changingPassword ? "Changing..." : "Change Password"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Company Settings - Only fields from your function */}
            <TabsContent value="company" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>
                    Manage your company details and registration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={company.companyName}
                        onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
                        placeholder="Your company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tin">TIN / Tax ID</Label>
                      <Input
                        id="tin"
                        value={company.tin}
                        onChange={(e) => setCompany({ ...company, tin: e.target.value })}
                        placeholder="Tax Identification Number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brelaName">BRELA Name</Label>
                      <Input
                        id="brelaName"
                        value={company.brelaName}
                        onChange={(e) => setCompany({ ...company, brelaName: e.target.value })}
                        placeholder="Business Registration name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessLicenceYear">Business Licence Year</Label>
                      <Input
                        id="businessLicenceYear"
                        value={company.businessLicenceYear}
                        onChange={(e) => setCompany({ ...company, businessLicenceYear: e.target.value })}
                        placeholder="e.g., 2024"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={company.location}
                        onChange={(e) => setCompany({ ...company, location: e.target.value })}
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Company Description</Label>
                    <Textarea
                      id="description"
                      value={company.description}
                      onChange={(e) => setCompany({ ...company, description: e.target.value })}
                      placeholder="Tell us about your company"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financial Settings - Exactly matching your function */}
            <TabsContent value="financial" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                  <CardDescription>
                    Manage your payment method and billing details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select
                      value={financial.paymentMethod}
                      onValueChange={(value) => setFinancial({ ...financial, paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {financial.paymentMethod === "card" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Card Number</Label>
                        <Input
                          value={financial.cardNumber}
                          onChange={(e) => setFinancial({ ...financial, cardNumber: e.target.value })}
                          placeholder="**** **** **** ****"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Expiry Date</Label>
                          <Input
                            value={financial.expiry}
                            onChange={(e) => setFinancial({ ...financial, expiry: e.target.value })}
                            placeholder="MM/YY"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>CVV</Label>
                          <Input
                            type="password"
                            value={financial.cvv}
                            onChange={(e) => setFinancial({ ...financial, cvv: e.target.value })}
                            placeholder="***"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {financial.paymentMethod === "bank" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Bank Name</Label>
                        <Input
                          value={financial.bankName}
                          onChange={(e) => setFinancial({ ...financial, bankName: e.target.value })}
                          placeholder="Bank name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Number</Label>
                        <Input
                          value={financial.accountNumber}
                          onChange={(e) => setFinancial({ ...financial, accountNumber: e.target.value })}
                          placeholder="Account number"
                        />
                      </div>
                    </div>
                  )}

                  {financial.paymentMethod === "cash" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Recipient Name</Label>
                        <Input
                          value={financial.recipientName}
                          onChange={(e) => setFinancial({ ...financial, recipientName: e.target.value })}
                          placeholder="Full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Recipient Phone</Label>
                        <Input
                          value={financial.recipientPhone}
                          onChange={(e) => setFinancial({ ...financial, recipientPhone: e.target.value })}
                          placeholder="Phone number"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose what notifications you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label>Low Stock Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when materials are running low
                      </p>
                    </div>
                    <Switch
                      checked={notifications.lowStockAlerts}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, lowStockAlerts: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label>Defect Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications for new defect reports
                      </p>
                    </div>
                    <Switch
                      checked={notifications.defectReports}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, defectReports: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label>Supplier Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get updates about supplier performance and changes
                      </p>
                    </div>
                    <Switch
                      checked={notifications.supplierUpdates}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, supplierUpdates: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label>Weekly Report</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly summary reports
                      </p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReport}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReport: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Settings */}
            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize how the application looks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {themeOptions.map((theme) => {
                        const Icon = theme.icon;
                        return (
                          <Button
                            key={theme.value}
                            variant={appearance.theme === theme.value ? "default" : "outline"}
                            className="h-auto py-4 flex flex-col gap-2"
                            onClick={() => handleThemeChange(theme.value)}
                          >
                            <Icon className="h-6 w-6" />
                            <span>{theme.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Management */}
            <TabsContent value="data" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>
                    Export and manage your manufacturing data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Button 
                    variant="outline" 
                    onClick={exportAllData} 
                    disabled={exporting}
                    className="w-full h-auto py-6 flex flex-col gap-2"
                  >
                    <IconDownload className="h-10 w-10" />
                    <div>
                      <p className="font-medium text-lg">Export All Data (JSON)</p>
                      <p className="text-xs text-muted-foreground">Complete data export in JSON format</p>
                    </div>
                  </Button>
                  
                  {exporting && (
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <div className="flex items-center gap-3">
                        <IconRefresh className="h-5 w-5 animate-spin" />
                        <p className="text-sm">{exportProgress || "Exporting data..."}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <IconAlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-500">Warning: Data Deletion</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Deleting your data is permanent and cannot be undone. Please make sure to export your data before proceeding.
                        </p>
                        <Button variant="destructive" className="mt-3 cursor-pointer" size="sm">
                          <IconTrash className="mr-2 h-4 w-4" />
                          Delete All Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}