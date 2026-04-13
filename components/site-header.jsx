"use client";

import { Home, Bell, ChevronRight, X, Package, CheckCircle, AlertTriangle, Truck, Zap, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

// Import breadcrumb components
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "@/components/theme-toggle";

// Notification types and their icons/colors
const notificationTypes = {
  material_added: {
    icon: Package,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    title: "Material Added",
  },
  material_updated: {
    icon: Package,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    title: "Material Updated",
  },
  low_stock: {
    icon: AlertTriangle,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    title: "Low Stock Alert",
  },
  defect_reported: {
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    title: "Defect Reported",
  },
  production_completed: {
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    title: "Production Completed",
  },
  supplier_update: {
    icon: Truck,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    title: "Supplier Update",
  },
  energy_alert: {
    icon: Zap,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    title: "Energy Alert",
  },
  report_generated: {
    icon: FileText,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    title: "Report Generated",
  },
};

export function SiteHeader() {
  const [user] = useAuthState(auth);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Just now";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  // Fetch real-time notifications
  useEffect(() => {
    if (!user) return;

    // Listen for notifications from various collections
    const notificationsList = [];
    
    // 1. Raw Materials notifications
    const materialsRef = collection(db, "rawMaterials", user.uid, "materials");
    const materialsQuery = query(
      materialsRef,
      orderBy("createdAt", "desc"),
      limit(10)
    );
    
    const unsubscribeMaterials = onSnapshot(materialsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const material = change.doc.data();
          notificationsList.push({
            id: `material_${change.doc.id}`,
            type: "material_added",
            title: "New Material Added",
            message: `${material.name} has been added to inventory`,
            timestamp: material.createdAt || Timestamp.now(),
            read: false,
            link: `/batches/raw-material`,
          });
        } else if (change.type === "modified") {
          const material = change.doc.data();
          if (material.status === "Low Stock") {
            notificationsList.push({
              id: `low_stock_${change.doc.id}`,
              type: "low_stock",
              title: "Low Stock Alert",
              message: `${material.name} is running low (${material.currentStock} ${material.unit} remaining)`,
              timestamp: Timestamp.now(),
              read: false,
              link: `/batches/raw-material`,
            });
          }
        }
      });
    });

    // 2. Defect Reports notifications
    const defectsRef = collection(db, "defectReports");
    const defectsQuery = query(
      defectsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    
    const unsubscribeDefects = onSnapshot(
      defectsQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const defect = change.doc.data();
            notificationsList.push({
              id: `defect_${change.doc.id}`,
              type: "defect_reported",
              title: "New Defect Reported",
              message: `${defect.materialName} - ${defect.defectType} (${defect.quantity} ${defect.unit})`,
              timestamp: defect.createdAt || Timestamp.now(),
              read: false,
              link: `/batches/raw-material/defect-report`,
            });
          }
        });
      },
      (error) => {
        console.warn("Defect reports index not created yet:", error.message);
      }
    );

    // 3. Finished Goods notifications (if you have this collection)
    const finishedGoodsRef = collection(db, "finishedGoods", user.uid, "materials");
    const finishedGoodsQuery = query(
      finishedGoodsRef,
      orderBy("createdAt", "desc"),
      limit(10)
    );
    
    const unsubscribeFinished = onSnapshot(finishedGoodsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const good = change.doc.data();
          notificationsList.push({
            id: `finished_${change.doc.id}`,
            type: "production_completed",
            title: "Production Completed",
            message: `${good.name} has been added to finished goods`,
            timestamp: good.createdAt || Timestamp.now(),
            read: false,
            link: `/batches/finished-goods`,
          });
        }
      });
    });

    // 4. Energy Consumption alerts (if you have this collection)
    const energyRef = collection(db, "energyConsumption");
    const energyQuery = query(
      energyRef,
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(10)
    );
    
    const unsubscribeEnergy = onSnapshot(
      energyQuery,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const energy = change.doc.data();
            if (energy.consumption > energy.threshold) {
              notificationsList.push({
                id: `energy_${change.doc.id}`,
                type: "energy_alert",
                title: "High Energy Consumption",
                message: `Energy usage exceeded threshold: ${energy.consumption} kWh`,
                timestamp: energy.timestamp || Timestamp.now(),
                read: false,
                link: `/energy`,
              });
            }
          }
        });
      },
      (error) => {
        console.warn("Energy consumption index not created yet:", error.message);
      }
    );

    // Combine and sort all notifications
    const combineNotifications = () => {
      const sorted = [...notificationsList].sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
        const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
        return timeB - timeA;
      });
      setNotifications(sorted.slice(0, 10));
      setUnreadCount(sorted.filter(n => !n.read).length);
    };

    combineNotifications();

    // Cleanup subscriptions
    return () => {
      unsubscribeMaterials();
      unsubscribeDefects();
      unsubscribeFinished();
      unsubscribeEnergy();
    };
  }, [user]);

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  // Get current page name
  const getCurrentPageName = () => {
    const path = pathname.replace(/^\//, '');
    if (!path) return "Dashboard";
    
    const pageName = path
      .split('/')
      .pop()
      ?.replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase()) || "Dashboard";
    
    return pageName;
  };

  const currentPage = getCurrentPageName();
  const isHome = pathname === "/dashboard" || pathname === "/home";

  // Get notification icon component
  const getNotificationIcon = (type) => {
    const Icon = notificationTypes[type]?.icon || Bell;
    return Icon;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notifications-dropdown')) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  return (
    <div className="sticky top-0 z-50 w-full px-2">
      <header className="flex h-14 shrink-0 items-center bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 rounded-t-xl shadow-sm">
        <div className="flex w-full items-center px-4 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-3 h-6" />
          
          <Breadcrumb>
            <BreadcrumbList className="gap-1">
              {!isHome && (
                <>
                  <BreadcrumbItem className="gap-0.5">
                    <BreadcrumbLink 
                      href="/dashboard" 
                      className="flex items-center gap-0.5 hover:text-purple-400 transition-colors"
                    >
                      <Home className="size-3.5" />
                      <span>Home</span>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="mx-0">
                    <ChevronRight className="size-3" />
                  </BreadcrumbSeparator>
                </>
              )}
              <BreadcrumbItem className="gap-0.5">
                <BreadcrumbPage className={cn(!isHome && "italic")}>
                  {currentPage}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center justify-center gap-2 relative notifications-dropdown">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 relative hover:bg-accent transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="size-5 text-zinc-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-medium text-white ring-2 ring-background shadow-[0_0_8px_rgba(168,85,247,0.4)]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-popover rounded-lg shadow-lg border border-border z-50 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto py-1 px-2 text-xs"
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
                
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Bell className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      const typeConfig = notificationTypes[notification.type] || {
                        color: "text-gray-500",
                        bgColor: "bg-gray-500/10",
                      };
                      
                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            "p-4 border-b border-border hover:bg-accent/50 transition-colors cursor-pointer",
                            !notification.read && "bg-primary/5"
                          )}
                          onClick={() => {
                            markAsRead(notification.id);
                            if (notification.link) {
                              window.location.href = notification.link;
                            }
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex gap-3">
                            <div className={cn(
                              "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                              typeConfig.bgColor
                            )}>
                              <Icon className={cn("h-4 w-4", typeConfig.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-foreground">
                                  {notification.title}
                                </p>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatRelativeTime(notification.timestamp)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                
                <div className="p-3 border-t border-border bg-muted/30">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => {
                      setShowNotifications(false);
                      window.location.href = "/notifications";
                    }}
                  >
                    View all notifications
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}