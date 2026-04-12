"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  IconBuildingWarehouse,
  IconTruck,
  IconBuildingStore,
  IconUsers,
  IconBell,
  IconSparkles,
  IconClock,
  IconMessage,
  IconHelp,
  IconMapPin,
  IconPhone,
  IconMail,
  IconLoader,
  IconSpeakerphone,
  IconListCheck,
  IconUserCheck,
  IconCalendarEvent,
  IconClipboardList,
  IconCalendar,
  IconChartBar,
  IconHeadset,
  IconLivePhoto,
  IconMailForward,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { JetBrains_Mono } from "next/font/google"
import { auth, db } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { AnnouncementsTodosSider } from "@/components/dashboard/AnnouncementsTodosSider"
import {
  collection,
  query,
  onSnapshot,
  orderBy,
} from "firebase/firestore"

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
})

// Static Activities
const recentActivities = [
  { id: 1, action: "New order #ORD-2024-001 received", time: "10 minutes ago", type: "order", user: "Customer Portal" },
  { id: 2, action: "Warehouse B stock updated (500 units)", time: "1 hour ago", type: "inventory", user: "System" },
  { id: 3, action: "Supplier 'ABC Metals' contract renewed", time: "3 hours ago", type: "supplier", user: "Procurement" },
  { id: 4, action: "Distributor 'City Dist' reported delivery issue", time: "5 hours ago", type: "issue", user: "Support" },
  { id: 5, action: "New supplier registered: XYZ Logistics", time: "8 hours ago", type: "supplier", user: "Admin" },
  { id: 6, action: "Monthly inventory report generated", time: "12 hours ago", type: "report", user: "System" },
]

export default function DashboardPage() {
  const [user, loadingAuth] = useAuthState(auth)
  const [warehouses, setWarehouses] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [distributors, setDistributors] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [activities] = useState(recentActivities)

  // Fetch real data from Firestore
  useEffect(() => {
    if (!user) return
    const warehousesRef = collection(db, "warehouses", user.uid, "list")
    const qWarehouses = query(warehousesRef, orderBy("createdAt", "desc"))
    const unsubWarehouses = onSnapshot(qWarehouses, (snapshot) => {
      setWarehouses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setLoadingData(false)
    })

    const suppliersRef = collection(db, "suppliers", user.uid, "list")
    const qSuppliers = query(suppliersRef, orderBy("createdAt", "desc"))
    const unsubSuppliers = onSnapshot(qSuppliers, (snapshot) => {
      setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    const distributorsRef = collection(db, "distributors", user.uid, "list")
    const qDistributors = query(distributorsRef, orderBy("createdAt", "desc"))
    const unsubDistributors = onSnapshot(qDistributors, (snapshot) => {
      setDistributors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    return () => {
      unsubWarehouses()
      unsubSuppliers()
      unsubDistributors()
    }
  }, [user])

  const totalWarehouses = warehouses.length
  const totalSuppliers = suppliers.length
  const totalDistributors = distributors.length
  const totalPartners = totalSuppliers + totalDistributors

  const userName = user?.displayName || user?.email?.split('@')[0] || "Guest"
  const currentTime = new Date()
  const greeting = currentTime.getHours() < 12 ? "Good morning" : currentTime.getHours() < 18 ? "Good afternoon" : "Good evening"
  const formattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  if (loadingAuth || loadingData) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex-1 flex items-center justify-center">
            <IconLoader className="animate-spin text-purple-500" size={32} />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

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
                <CardDescription>Please log in to view your dashboard.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <SiteHeader className="relative overflow-hidden bg-zinc-950 flex-shrink-0" />
        
        {/* Animated Background Glows */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute top-[30%] -right-[10%] h-[400px] w-[400px] rounded-full bg-indigo-500/15 blur-[120px] animate-pulse delay-1000" />
          <div className="absolute bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-fuchsia-600/10 blur-[100px] animate-pulse delay-2000" />
        </div>

        {/* Main scrollable area - with hidden scrollbar */}
        <div className="flex-1 overflow-y-auto relative z-10 scrollbar-hide">
          <div className="w-full px-4 md:px-6 py-6">
            <div className="max-w-7xl mx-auto space-y-6">
              
              {/* Full-width Header Card with Greeting and Contact */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-transparent border border-white/10 backdrop-blur-sm p-5 md:p-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl -ml-24 -mb-24" />
                
                <div className="relative">
                  {/* Greeting and Actions Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-14 w-14 ring-2 ring-purple-500/50">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-lg">
                          {userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm text-muted-foreground">{greeting},</p>
                        <h1 className={cn(jetBrainsMono.className, "text-2xl md:text-3xl font-bold tracking-tight")}>
                          {userName} <span className="text-purple-400">👋</span>
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Welcome to your supply chain command center
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-9 gap-2">
                        <IconBell className="h-4 w-4" />
                        <span className="hidden sm:inline">Notifications</span>
                      </Button>
                      <Button size="sm" className="h-9 gap-2 bg-gradient-to-r from-purple-500 to-indigo-600">
                        <IconSparkles className="h-4 w-4" />
                        <span className="hidden sm:inline">Upgrade Plan</span>
                      </Button>
                    </div>
                  </div>

                  {/* Date and Time Row */}
                  <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-1.5">
                      <IconCalendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IconClock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{formattedTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IconListCheck className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Tasks managed by admin</span>
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                      <IconChartBar className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-[10px] text-purple-300">System Online</span>
                      <div className="h-1.5 w-20 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-[85%] bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <IconBuildingWarehouse className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Warehouses</p>
                        <p className="text-sm font-semibold">{totalWarehouses}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <IconTruck className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Suppliers</p>
                        <p className="text-sm font-semibold">{totalSuppliers}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <IconBuildingStore className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Distributors</p>
                        <p className="text-sm font-semibold">{totalDistributors}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <IconUsers className="h-4 w-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Partners</p>
                        <p className="text-sm font-semibold">{totalPartners}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Section - Full Width Below Metrics */}
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <IconHeadset className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white">24/7 Support Available</p>
                          <p className="text-[9px] text-muted-foreground">Get help anytime, anywhere</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                          <IconMessage className="h-3 w-3" />
                          Live Chat
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                          <IconMail className="h-3 w-3" />
                          ramzi@prodesign.co.tz
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                          <IconPhone className="h-3 w-3" />
                          +255 629 220 302
                        </Button>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-3">
                      💡 "Efficient supply chain management is the key to growth. Keep track of your warehouses, suppliers, and distributors in one place."
                    </p>
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="flex flex-col lg:flex-row gap-6 relative items-start">
                
                {/* Left Column - Normal scroll */}
                <div className="flex-1 min-w-0 space-y-6">
                  {/* Warehouses Card */}
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:border-blue-500/30 transition-all">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <IconBuildingWarehouse className="h-4 w-4 text-blue-400" />
                          Warehouses
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px]">{totalWarehouses} total</Badge>
                      </div>
                      <CardDescription className="text-[10px]">Your storage facilities</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {warehouses.slice(0, 3).map((wh) => (
                        <div key={wh.id} className="p-2 rounded-lg bg-white/5">
                          <p className="text-xs font-medium">{wh.name}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                            <IconMapPin className="h-2.5 w-2.5" />
                            <span>{wh.location || "Not set"}</span>
                          </div>
                        </div>
                      ))}
                      {warehouses.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No warehouses</p>}
                      {warehouses.length > 3 && (
                        <Button variant="ghost" size="sm" className="w-full text-xs mt-1">View all {totalWarehouses}</Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Suppliers Card */}
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:border-green-500/30 transition-all">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <IconTruck className="h-4 w-4 text-green-400" />
                          Suppliers
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px]">{totalSuppliers} total</Badge>
                      </div>
                      <CardDescription className="text-[10px]">Raw material providers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {suppliers.slice(0, 3).map((sup) => (
                        <div key={sup.id} className="p-2 rounded-lg bg-white/5">
                          <p className="text-xs font-medium">{sup.name}</p>
                          {sup.contact && <p className="text-[9px] text-muted-foreground mt-0.5">{sup.contact}</p>}
                        </div>
                      ))}
                      {suppliers.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No suppliers</p>}
                      {suppliers.length > 3 && (
                        <Button variant="ghost" size="sm" className="w-full text-xs mt-1">View all {totalSuppliers}</Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Distributors Card */}
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:border-purple-500/30 transition-all">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <IconBuildingStore className="h-4 w-4 text-purple-400" />
                          Distributors
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px]">{totalDistributors} total</Badge>
                      </div>
                      <CardDescription className="text-[10px]">Product distribution partners</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {distributors.slice(0, 3).map((dist) => (
                        <div key={dist.id} className="p-2 rounded-lg bg-white/5">
                          <p className="text-xs font-medium">{dist.name}</p>
                          {dist.serviceArea && <p className="text-[9px] text-muted-foreground mt-0.5">{dist.serviceArea}</p>}
                        </div>
                      ))}
                      {distributors.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No distributors</p>}
                      {distributors.length > 3 && (
                        <Button variant="ghost" size="sm" className="w-full text-xs mt-1">View all {totalDistributors}</Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Support Center Card */}
                  <Card className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/20">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <IconHelp className="h-4 w-4 text-purple-400" />
                        Support Center
                      </CardTitle>
                      <CardDescription className="text-[10px]">We're here to help</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">Get instant assistance with any supply chain issue.</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="h-8 text-xs bg-purple-600 hover:bg-purple-700 flex-1">
                            <IconMessage className="h-3 w-3 mr-1" />
                            Live Chat
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs flex-1">
                            <IconMail className="h-3 w-3 mr-1" />
                            Email
                          </Button>
                        </div>
                        <p className="text-[9px] text-muted-foreground text-center">Response within 1 hour</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Sticky and independently scrollable with hidden scrollbar */}
                <div className="w-full lg:w-96 flex-shrink-0 lg:sticky lg:top-6 self-start">
                  <div className="max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide">
                    <div className="space-y-1 pr-1">
                      {/* Announcements & Todos Manager */}
                      <AnnouncementsTodosSider 
                        adminUid={user?.uid} 
                        userUid={user?.uid}
                      />

                      {/* Recent Activity Card */}
                      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                        <CardHeader className="pb-2 sticky top-0 bg-inherit z-10">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <IconClipboardList className="h-4 w-4 text-green-400" />
                              Recent Activity
                            </CardTitle>
                            <Badge variant="outline" className="text-[9px]">
                              <IconLivePhoto size={10} className="mr-1 text-green-400" />
                              Live
                            </Badge>
                          </div>
                          <CardDescription className="text-[10px]">Latest system updates and events</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {activities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                              <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                <IconClock className="h-2.5 w-2.5 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs">{activity.action}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[8px] text-muted-foreground">{activity.time}</span>
                                  <span className="text-[8px] text-muted-foreground">•</span>
                                  <span className="text-[8px] text-muted-foreground">{activity.user}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}