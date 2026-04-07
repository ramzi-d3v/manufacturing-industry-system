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
import { Checkbox } from "@/components/ui/checkbox"
import {
  IconBuildingWarehouse,
  IconTruck,
  IconBuildingStore,
  IconUsers,
  IconBell,
  IconSparkles,
  IconCheck,
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
  IconTrendingUp,
  IconCalendar,
  IconCurrencyDollar,
  IconChartBar,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import ProtectedPage from "@/container/ProtectRoot"
import { JetBrains_Mono } from "next/font/google"
import { auth, db } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
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

// Static To-Do items (admin can edit/assign)
const initialTodos = [
  { id: 1, text: "Review monthly inventory report", completed: false, assignedTo: "Warehouse Team", priority: "high" },
  { id: 2, text: "Contact top 3 suppliers for price negotiation", completed: false, assignedTo: "Procurement", priority: "medium" },
  { id: 3, text: "Update distributor agreements", completed: true, assignedTo: "Legal", priority: "low" },
  { id: 4, text: "Schedule maintenance for warehouse A", completed: false, assignedTo: "Facilities", priority: "high" },
]

// Static Announcements (admin can edit/assign)
const initialAnnouncements = [
  { id: 1, text: "New safety protocols implemented in all warehouses", date: "2024-03-15", author: "Safety Officer" },
  { id: 2, text: "Quarterly supplier review meeting on March 25th", date: "2024-03-10", author: "Procurement Lead" },
  { id: 3, text: "System maintenance scheduled for Sunday 2 AM - 4 AM", date: "2024-03-08", author: "IT Dept" },
]

// Static Activities (admin can edit/assign)
const recentActivities = [
  { id: 1, action: "New order #ORD-2024-001 received", time: "10 minutes ago", type: "order", user: "Customer Portal" },
  { id: 2, action: "Warehouse B stock updated (500 units)", time: "1 hour ago", type: "inventory", user: "System" },
  { id: 3, action: "Supplier 'ABC Metals' contract renewed", time: "3 hours ago", type: "supplier", user: "Procurement" },
  { id: 4, action: "Distributor 'City Dist' reported delivery issue", time: "5 hours ago", type: "issue", user: "Support" },
]

export default function DashboardPage() {
  const [user, loadingAuth] = useAuthState(auth)
  const [warehouses, setWarehouses] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [distributors, setDistributors] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [todos, setTodos] = useState(initialTodos)
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
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

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const totalWarehouses = warehouses.length
  const totalSuppliers = suppliers.length
  const totalDistributors = distributors.length
  const totalPartners = totalSuppliers + totalDistributors
  const pendingTasks = todos.filter(t => !t.completed).length

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

  

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader className="relative overflow-hidden bg-zinc-950" />
        
        {/* Animated Background Glows */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[150px] animate-pulse" />
          <div className="absolute top-[30%] -right-[10%] h-[400px] w-[400px] rounded-full bg-indigo-500/15 blur-[120px] animate-pulse delay-1000" />
          <div className="absolute bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-fuchsia-600/10 blur-[100px] animate-pulse delay-2000" />
        </div>

        {/* Full-width Greeting Card (not constrained by sidebar) */}
        <div className="w-full px-4 md:px-6 pt-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-transparent border border-white/10 backdrop-blur-sm p-5 md:p-6 w-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl -ml-24 -mb-24" />
            
            <div className="relative">
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
                  <span className="text-xs text-muted-foreground">{pendingTasks} pending tasks</span>
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

              {/* Additional metrics row */}
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

              {/* Motivational Quote or Tip */}
              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-[10px] text-muted-foreground italic text-center">
                  💡 "Efficient supply chain management is the key to growth. Keep track of your warehouses, suppliers, and distributors in one place."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content with sidebar separation line */}
        <div className="relative">
          {/* Tiny separation line from sidebar */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          
          <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-6 py-6 max-w-7xl mx-auto">
            
            {/* Main Area - Single Column */}
            <div className="flex-1 min-w-0 space-y-5">
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

              {/* Support & Help Card */}
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

            {/* Right Sidebar - To Do, Announcements, Recent Activity */}
            <div className="w-full lg:w-80 space-y-5 flex-shrink-0">
              {/* To Do List */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <IconListCheck className="h-4 w-4 text-blue-400" />
                      To Do List
                    </CardTitle>
                    <Badge variant="outline" className="text-[9px]">
                      {pendingTasks} pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {todos.map((todo) => (
                    <div key={todo.id} className="flex items-start gap-2 p-2 rounded-lg bg-white/5">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => toggleTodo(todo.id)}
                        className="h-3.5 w-3.5 mt-0.5"
                      />
                      <div className="flex-1">
                        <p className={cn("text-xs", todo.completed && "line-through text-muted-foreground")}>
                          {todo.text}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge className={cn(
                            "text-[8px] px-1 py-0",
                            todo.priority === "high" ? "bg-red-500/20 text-red-400" :
                            todo.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-blue-500/20 text-blue-400"
                          )}>
                            {todo.priority}
                          </Badge>
                          <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                            <IconUserCheck className="h-2 w-2" />
                            {todo.assignedTo}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Announcements */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <IconSpeakerphone className="h-4 w-4 text-purple-400" />
                      Announcements
                    </CardTitle>
                    <Badge variant="outline" className="text-[9px]">{announcements.length} new</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="p-2 rounded-lg bg-white/5">
                      <p className="text-xs">{ann.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                          <IconCalendarEvent className="h-2 w-2" />
                          {ann.date}
                        </span>
                        <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                          <IconUserCheck className="h-2 w-2" />
                          {ann.author}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <IconClipboardList className="h-4 w-4 text-green-400" />
                      Recent Activity
                    </CardTitle>
                    <Badge variant="outline" className="text-[9px]">Live</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-2 p-2 rounded-lg bg-white/5">
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
      </SidebarInset>
    </SidebarProvider>
  )
}