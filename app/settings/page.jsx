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
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import {
  IconUser,
  IconBuildingStore,
  IconBell,
  IconPalette,
  IconDatabase,
  IconRefresh,
  IconTrash,
  IconAlertCircle,
  IconMoon,
  IconSun,
  IconDeviceLaptop,
  IconDownload,
  IconCreditCard,
  IconBuildingBank,
  IconCash,
  IconShieldLock,
  IconMail,
  IconPhone,
  IconMapPin,
  IconBriefcase,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { cn } from "@/lib/utils";

// Theme options
const themeOptions = [
  { value: "light", label: "Light", icon: IconSun },
  { value: "dark", label: "Dark", icon: IconMoon },
  { value: "system", label: "System", icon: IconDeviceLaptop },
];

const navItems = [
  { id: "profile", label: "Profile", icon: IconUser },
  { id: "company", label: "Company", icon: IconBuildingStore },
  { id: "financial", label: "Financial", icon: IconCreditCard },
  { id: "notifications", label: "Notifications", icon: IconBell },
  { id: "appearance", label: "Appearance", icon: IconPalette },
  { id: "data", label: "Data", icon: IconDatabase },
];

export default function SettingsPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [copiedField, setCopiedField] = useState(null);

  const { theme: currentTheme, setTheme: setAppTheme } = useTheme();
  
  // Company Settings
  const [company, setCompany] = useState({
    companyName: "",
    tin: "",
    description: "",
    brelaName: "",
    businessLicenceYear: "",
    location: "",
  });
  
  // Personal Information
  const [personal, setPersonal] = useState({
    firstName: "",
    phone: "",
    email: "",
    role: "",
    gender: "",
  });
  
  // Financial Information
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
  
  // Notification Settings (read-only, just display)
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
        
        // Load notification settings from somewhere if stored, else keep defaults
        // For now, keep as is (just display)
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [user]);

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

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Helper to render a read-only field with copy option
  const ReadOnlyField = ({ label, value, copyable = false, copyKey = "" }) => (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md border">
        <span className="flex-1 text-sm break-all">{value || "—"}</span>
        {copyable && value && (
          <button
            onClick={() => copyToClipboard(value, copyKey)}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            {copiedField === copyKey ? (
              <IconCheck className="h-4 w-4 text-green-500" />
            ) : (
              <IconCopy className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  // Simple Label component (since we're not importing it)
  const Label = ({ children, className }) => (
    <div className={cn("text-sm font-medium", className)}>{children}</div>
  );

  if (loadingAuth || loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex-1 flex items-center justify-center">
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
        <div className="flex-1 bg-gradient-to-br from-background via-background to-muted/20">
          <div className="container mx-auto p-6 lg:p-8 max-w-7xl">
            {/* Header - No save button */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-muted-foreground mt-1">
                View your account, company, and preferences (read-only)
              </p>
            </div>

            {/* Two-column layout: sidebar + content */}
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar Navigation */}
              <div className="lg:w-72 flex-shrink-0">
                <Card className="sticky top-24 bg-card/50 backdrop-blur-sm border-muted">
                  <CardContent className="p-4">
                    <nav className="space-y-1">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left",
                              activeTab === item.id
                                ? "bg-primary/10 text-primary font-medium shadow-sm"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content - All read-only */}
              <div className="flex-1 space-y-6">
                {/* Profile Section */}
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    <Card className="border-muted shadow-sm">
                      <CardHeader className="border-b border-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <IconUser className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                              Your personal details and contact information
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <ReadOnlyField label="Full Name" value={personal.firstName} copyable copyKey="name" />
                          <ReadOnlyField label="Phone Number" value={personal.phone} copyable copyKey="phone" />
                          <ReadOnlyField label="Email Address" value={personal.email} copyable copyKey="email" />
                          <ReadOnlyField label="Role / Job Title" value={personal.role} />
                          <ReadOnlyField label="Gender" value={personal.gender ? (personal.gender.charAt(0).toUpperCase() + personal.gender.slice(1)) : "—"} />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-muted shadow-sm">
                      <CardHeader className="border-b border-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <IconShieldLock className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>Password management is available in your account settings</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">
                          To change your password, please contact your administrator or use the "Forgot Password" option on the login page.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Company Section */}
                {activeTab === "company" && (
                  <Card className="border-muted shadow-sm">
                    <CardHeader className="border-b border-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconBuildingStore className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Company Information</CardTitle>
                          <CardDescription>Your company details and registration</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ReadOnlyField label="Company Name" value={company.companyName} copyable copyKey="companyName" />
                        <ReadOnlyField label="TIN / Tax ID" value={company.tin} copyable copyKey="tin" />
                        <ReadOnlyField label="BRELA Name" value={company.brelaName} />
                        <ReadOnlyField label="Business Licence Year" value={company.businessLicenceYear} />
                        <ReadOnlyField label="Location" value={company.location} />
                        <div className="md:col-span-2">
                          <Label className="text-sm font-medium text-muted-foreground">Company Description</Label>
                          <div className="mt-1 p-3 bg-muted/30 rounded-md border">
                            <p className="text-sm whitespace-pre-wrap">{company.description || "—"}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Financial Section */}
                {activeTab === "financial" && (
                  <Card className="border-muted shadow-sm">
                    <CardHeader className="border-b border-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconCreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Payment Information</CardTitle>
                          <CardDescription>Your payment method and billing details</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-6">
                        <ReadOnlyField 
                          label="Payment Method" 
                          value={
                            financial.paymentMethod === "cash" ? "Cash" :
                            financial.paymentMethod === "card" ? "Credit/Debit Card" :
                            financial.paymentMethod === "bank" ? "Bank Transfer" : "—"
                          } 
                        />

                        {financial.paymentMethod === "card" && (
                          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                            <ReadOnlyField label="Card Number" value={financial.cardNumber ? `**** **** **** ${financial.cardNumber.slice(-4)}` : "—"} />
                            <div className="grid grid-cols-2 gap-4">
                              <ReadOnlyField label="Expiry Date" value={financial.expiry} />
                              <ReadOnlyField label="CVV" value="•••" />
                            </div>
                          </div>
                        )}

                        {financial.paymentMethod === "bank" && (
                          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <ReadOnlyField label="Bank Name" value={financial.bankName} />
                              <ReadOnlyField label="Account Number" value={financial.accountNumber} />
                            </div>
                          </div>
                        )}

                        {financial.paymentMethod === "cash" && (
                          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <ReadOnlyField label="Recipient Name" value={financial.recipientName} />
                              <ReadOnlyField label="Recipient Phone" value={financial.recipientPhone} />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Notifications Section - read-only */}
                {activeTab === "notifications" && (
                  <Card className="border-muted shadow-sm">
                    <CardHeader className="border-b border-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconBell className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Notification Preferences</CardTitle>
                          <CardDescription>Your current notification settings</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {[
                          { id: "emailNotifications", label: "Email Notifications", desc: "Receive notifications via email", value: notifications.emailNotifications },
                          { id: "lowStockAlerts", label: "Low Stock Alerts", desc: "Get notified when materials are running low", value: notifications.lowStockAlerts },
                          { id: "defectReports", label: "Defect Reports", desc: "Receive notifications for new defect reports", value: notifications.defectReports },
                          { id: "supplierUpdates", label: "Supplier Updates", desc: "Get updates about supplier performance and changes", value: notifications.supplierUpdates },
                          { id: "weeklyReport", label: "Weekly Report", desc: "Receive weekly summary reports", value: notifications.weeklyReport },
                        ].map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-3 border-b border-muted/50 last:border-0">
                            <div className="space-y-0.5">
                              <Label className="text-base">{item.label}</Label>
                              <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </div>
                            <div className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              item.value ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                            )}>
                              {item.value ? "Enabled" : "Disabled"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Appearance Section - read-only */}
                {activeTab === "appearance" && (
                  <Card className="border-muted shadow-sm">
                    <CardHeader className="border-b border-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconPalette className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Appearance</CardTitle>
                          <CardDescription>Your current theme preference</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <Label>Theme</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {themeOptions.map((theme) => {
                            const Icon = theme.icon;
                            const isActive = appearance.theme === theme.value;
                            return (
                              <div
                                key={theme.value}
                                className={cn(
                                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200",
                                  isActive
                                    ? "border-primary bg-primary/5 shadow-md"
                                    : "border-muted bg-muted/20 opacity-60"
                                )}
                              >
                                <Icon className="h-8 w-8" />
                                <span className="text-sm font-medium">{theme.label}</span>
                                {isActive && (
                                  <span className="text-xs text-primary">Active</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Data Management Section - export only */}
                {activeTab === "data" && (
                  <div className="space-y-6">
                    <Card className="border-muted shadow-sm">
                      <CardHeader className="border-b border-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <IconDatabase className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle>Data Management</CardTitle>
                            <CardDescription>Export your manufacturing data</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-6">
                          <button
                            onClick={exportAllData}
                            disabled={exporting}
                            className="w-full p-6 rounded-lg border-2 border-dashed border-muted hover:border-primary/50 hover:bg-muted/30 transition-all duration-200 group"
                          >
                            <div className="flex flex-col items-center gap-3">
                              <IconDownload className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
                              <div>
                                <p className="font-medium text-lg">Export All Data (JSON)</p>
                                <p className="text-sm text-muted-foreground">Complete data export in JSON format</p>
                              </div>
                            </div>
                          </button>
                          
                          {exporting && (
                            <div className="p-4 bg-primary/10 rounded-lg">
                              <div className="flex items-center gap-3">
                                <IconRefresh className="h-5 w-5 animate-spin" />
                                <p className="text-sm">{exportProgress || "Exporting data..."}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <div className="flex items-start gap-3">
                              <IconAlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                              <div>
                                <p className="font-medium text-destructive">Warning: Data Deletion</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Deleting your data is permanent and cannot be undone. Please make sure to export your data before proceeding.
                                </p>
                                <Button variant="destructive" className="mt-3" size="sm" disabled>
                                  <IconTrash className="mr-2 h-4 w-4" />
                                  Delete All Data (Disabled)
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2">Contact support to request data deletion.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}