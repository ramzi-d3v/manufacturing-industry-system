"use client";

import { useState, useEffect } from "react";
import { Package, CheckCircle, AlertTriangle, Truck, Zap, FileText, Bell, Trash2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

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

export default function NotificationsPage() {
  const [user] = useAuthState(auth);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all"); // all, unread, archived
  const [loadingData, setLoadingData] = useState(true);

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

    const notificationsList = [];

    // 1. Raw Materials notifications
    const materialsRef = collection(db, "rawMaterials", user.uid, "materials");
    const materialsQuery = query(
      materialsRef,
      orderBy("createdAt", "desc"),
      limit(50)
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
            archived: false,
            link: `/raw-materials/inventory`,
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
              archived: false,
              link: `/raw-materials/inventory`,
            });
          }
        }
      });

      // Update notifications state
      const sorted = [...notificationsList].sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
        const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
        return timeB - timeA;
      });
      setNotifications(sorted);
      setLoadingData(false);
    });

    // 2. Defect Reports notifications
    const defectsRef = collection(db, "defectReports");
    const defectsQuery = query(
      defectsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
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
              message: `${defect.materialName} - ${defect.defectType}`,
              timestamp: defect.createdAt || Timestamp.now(),
              read: false,
              archived: false,
              link: `/raw-materials/defect-report`,
            });
          }
        });
      },
      (error) => {
        console.warn("Defect reports index not created yet:", error.message);
      }
    );

    // 3. Finished Goods notifications
    const finishedGoodsRef = collection(db, "finishedGoods", user.uid, "materials");
    const finishedGoodsQuery = query(
      finishedGoodsRef,
      orderBy("createdAt", "desc"),
      limit(50)
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
            archived: false,
            link: `/finished-products/inventory`,
          });
        }
      });
    });

    // 4. Energy Consumption alerts
    const energyRef = collection(db, "energyConsumption");
    const energyQuery = query(
      energyRef,
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(50)
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
                archived: false,
                link: `/energy-consumption`,
              });
            }
          }
        });
      },
      (error) => {
        console.warn("Energy consumption index not created yet:", error.message);
      }
    );

    return () => {
      unsubscribeMaterials();
      unsubscribeDefects();
      unsubscribeFinished();
      unsubscribeEnergy();
    };
  }, [user]);

  // Handle mark as read
  const handleMarkAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  // Handle archive
  const handleArchive = (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, archived: true } : n
      )
    );
  };

  // Handle delete
  const handleDelete = (notificationId) => {
    setNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    );
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read && !n.archived;
    if (filter === "archived") return n.archived;
    return !n.archived;
  });

  const getNotificationIcon = (type) => {
    const Icon = notificationTypes[type]?.icon || Bell;
    return Icon;
  };

  if (!user) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex-1 flex items-center justify-center">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Sign In Required</CardTitle>
                <CardDescription>Please log in to view notifications.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <SiteHeader />

        {/* Main scrollable area */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-4 md:px-6 py-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                  <p className="text-muted-foreground mt-1">
                    {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {notifications.some((n) => !n.read) && (
                  <Button
                    onClick={handleMarkAllAsRead}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 border-b border-border">
                <button
                  onClick={() => setFilter("all")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    filter === "all"
                      ? "border-purple-500 text-purple-500"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    filter === "unread"
                      ? "border-purple-500 text-purple-500"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Unread
                </button>
                <button
                  onClick={() => setFilter("archived")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    filter === "archived"
                      ? "border-purple-500 text-purple-500"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Archived
                </button>
              </div>

              {/* Notifications List */}
              <div className="space-y-2">
                {filteredNotifications.length === 0 ? (
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Bell className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <p className="text-lg font-medium">No notifications</p>
                      <p className="text-sm text-muted-foreground">
                        {filter === "unread" && "You're all caught up!"}
                        {filter === "archived" && "No archived notifications yet"}
                        {filter === "all" && "No notifications"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    const typeConfig = notificationTypes[notification.type] || {
                      color: "text-gray-500",
                      bgColor: "bg-gray-500/10",
                    };

                    return (
                      <Card
                        key={notification.id}
                        className={cn(
                          "bg-white/5 border-white/10 backdrop-blur-sm hover:border-white/20 transition-all cursor-pointer group",
                          !notification.read && "border-purple-500/30 bg-purple-500/5"
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div
                              className={cn(
                                "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
                                typeConfig.bgColor
                              )}
                            >
                              <Icon className={cn("h-5 w-5", typeConfig.color)} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div>
                                  <h3 className="font-semibold text-foreground">
                                    {notification.title}
                                    {!notification.read && (
                                      <span className="ml-2 inline-block h-2 w-2 rounded-full bg-purple-500" />
                                    )}
                                  </h3>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatRelativeTime(notification.timestamp)}
                                </span>
                              </div>

                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>

                              {notification.link && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="mt-2 p-0 text-purple-400 hover:text-purple-300 h-auto"
                                  onClick={() => {
                                    handleMarkAsRead(notification.id);
                                    window.location.href = notification.link;
                                  }}
                                >
                                  View details →
                                </Button>
                              )}
                            </div>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.archived && (
                                <>
                                  {!notification.read && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      title="Mark as read"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleArchive(notification.id)}
                                    title="Archive"
                                  >
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:text-red-400"
                                onClick={() => handleDelete(notification.id)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
