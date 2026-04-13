"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  IconBuildingWarehouse,
  IconTruck,
  IconChartBar,
  IconShieldCheck,
  IconBolt,
  IconBell,
  IconCheck,
  IconArrowRight,
  IconMenu2,
  IconX,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const features = [
    {
      icon: IconBuildingWarehouse,
      title: "Warehouse Management",
      description: "Track and manage raw materials and finished goods inventory efficiently"
    },
    {
      icon: IconTruck,
      title: "Supply Chain",
      description: "Monitor suppliers and distributors in real-time"
    },
    {
      icon: IconChartBar,
      title: "Analytics & Reporting",
      description: "Get detailed insights into production and inventory metrics"
    },
    {
      icon: IconShieldCheck,
      title: "Quality Control",
      description: "Track defects and maintain product quality standards"
    },
    {
      icon: IconBolt,
      title: "Energy Monitoring",
      description: "Monitor and optimize energy consumption"
    },
    {
      icon: IconBell,
      title: "Real-time Notifications",
      description: "Get instant alerts for important events and updates"
    },
  ]

  const pricingPlans = [
    {
      name: "Starter",
      description: "Perfect for small operations",
      price: "$29",
      period: "/month",
      features: [
        "Up to 5 warehouses",
        "Basic inventory tracking",
        "Email notifications",
        "Basic analytics",
        "Community support"
      ],
      highlighted: false
    },
    {
      name: "Professional",
      description: "For growing businesses",
      price: "$79",
      period: "/month",
      features: [
        "Unlimited warehouses",
        "Advanced inventory management",
        "Real-time notifications",
        "Advanced analytics & reports",
        "Quality control module",
        "Priority email support",
        "API access"
      ],
      highlighted: true
    },
    {
      name: "Enterprise",
      description: "For large organizations",
      price: "Custom",
      period: "pricing",
      features: [
        "Everything in Professional",
        "Unlimited users",
        "Custom integrations",
        "Dedicated account manager",
        "24/7 phone support",
        "On-premise deployment",
        "SLA guarantee"
      ],
      highlighted: false
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-500/5">
      {/* Navigation */}
      <nav className="fixed top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <span className="text-purple-500 font-bold text-lg">M</span>
              </div>
              <span className="font-bold text-lg hidden sm:inline">ManufactureHub</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition">
                Features
              </Link>
              <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition">
                Pricing
              </Link>
              <Link href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition">
                Contact
              </Link>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              
              {/* Mobile menu button */}
              <button
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <IconX className="h-6 w-6" />
                ) : (
                  <IconMenu2 className="h-6 w-6" />
                )}
              </button>

              {/* Auth buttons */}
              <Link href="/signin">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="hidden sm:inline-flex bg-purple-600 hover:bg-purple-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-4">
              <Link href="#features" className="block text-sm text-muted-foreground hover:text-foreground py-2">
                Features
              </Link>
              <Link href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground py-2">
                Pricing
              </Link>
              <Link href="#contact" className="block text-sm text-muted-foreground hover:text-foreground py-2">
                Contact
              </Link>
              <div className="flex gap-2 pt-4">
                <Link href="/signin" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" className="flex-1">
                  <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="outline" className="mb-4">Revolutionize Your Manufacturing 🚀</Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Complete Manufacturing <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Industry System</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Streamline your entire manufacturing operation with our comprehensive platform. 
            From raw materials to finished products, manage everything in one place with real-time 
            insights and intelligent automation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 gap-2">
                Start Free Trial <IconArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-40 -right-40 h-80 w-80 bg-purple-600/10 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 bg-cyan-600/10 rounded-full blur-3xl -z-10" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground text-lg">Everything you need to manage your manufacturing operations</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <Card key={idx} className="border-border/50 hover:border-purple-500/50 transition-colors">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-purple-500" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Transparent Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, Flexible Plans</h2>
            <p className="text-muted-foreground text-lg">Choose the perfect plan for your business needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, idx) => (
              <Card 
                key={idx} 
                className={cn(
                  "border-border/50 transition-all",
                  plan.highlighted && "border-purple-500/50 ring-1 ring-purple-500/20 lg:scale-105"
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription className="mt-2">{plan.description}</CardDescription>
                    </div>
                    {plan.highlighted && <Badge className="bg-purple-600">Popular</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-2 text-sm">{plan.period}</span>
                  </div>

                  <Button 
                    className={cn(
                      "w-full mb-8",
                      plan.highlighted && "bg-purple-600 hover:bg-purple-700"
                    )}
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    Get Started
                  </Button>

                  <div className="space-y-3">
                    {plan.features.map((feature, featureIdx) => (
                      <div key={featureIdx} className="flex gap-3">
                        <IconCheck className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Transform Your Manufacturing?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of manufacturers already using ManufactureHub to optimize their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                Start Your Free Trial
              </Button>
            </Link>
            <Link href="/signin">
              <Button size="lg" variant="outline">
                Already have an account? Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-border/40 bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-500 font-bold">M</span>
                </div>
                <span className="font-bold">ManufactureHub</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Complete manufacturing management solution
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground transition">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Terms</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 ManufactureHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )

  // Fetch real data from Firestore
  useEffect(() => {
    if (!user) return

    const activitiesList = []

    // Fetch Warehouses
    const warehousesRef = collection(db, "warehouses", user.uid, "list")
    const qWarehouses = query(warehousesRef, orderBy("createdAt", "desc"), limit(100))
    const unsubWarehouses = onSnapshot(qWarehouses, (snapshot) => {
      const warehouseData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setWarehouses(warehouseData)

      // Add warehouse activities
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const wh = change.doc.data()
          if (change.type === "added") {
            activitiesList.push({
              id: `warehouse_${change.doc.id}`,
              action: `New warehouse '${wh.name}' added`,
              time: formatRelativeTime(wh.createdAt || Timestamp.now()),
              timestamp: wh.createdAt || Timestamp.now(),
              type: "warehouse",
              user: "System",
            })
          }
        }
      })

      updateActivitiesList()
      setLoadingData(false)
    })

    // Fetch Suppliers
    const suppliersRef = collection(db, "suppliers", user.uid, "list")
    const qSuppliers = query(suppliersRef, orderBy("createdAt", "desc"), limit(100))
    const unsubSuppliers = onSnapshot(qSuppliers, (snapshot) => {
      const supplierData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setSuppliers(supplierData)

      // Add supplier activities
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const sup = change.doc.data()
          activitiesList.push({
            id: `supplier_${change.doc.id}`,
            action: `New supplier '${sup.name}' registered`,
            time: formatRelativeTime(sup.createdAt || Timestamp.now()),
            timestamp: sup.createdAt || Timestamp.now(),
            type: "supplier",
            user: "Procurement",
          })
        }
      })

      updateActivitiesList()
    })

    // Fetch Distributors
    const distributorsRef = collection(db, "distributors", user.uid, "list")
    const qDistributors = query(distributorsRef, orderBy("createdAt", "desc"), limit(100))
    const unsubDistributors = onSnapshot(qDistributors, (snapshot) => {
      const distributorData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setDistributors(distributorData)

      // Add distributor activities
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const dist = change.doc.data()
          activitiesList.push({
            id: `distributor_${change.doc.id}`,
            action: `New distributor '${dist.name}' added`,
            time: formatRelativeTime(dist.createdAt || Timestamp.now()),
            timestamp: dist.createdAt || Timestamp.now(),
            type: "distributor",
            user: "Admin",
          })
        }
      })

      updateActivitiesList()
    })

    // Fetch Raw Materials
    const materialsRef = collection(db, "rawMaterials", user.uid, "materials")
    const qMaterials = query(materialsRef, orderBy("createdAt", "desc"), limit(50))
    const unsubMaterials = onSnapshot(qMaterials, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const material = change.doc.data()
          activitiesList.push({
            id: `material_${change.doc.id}`,
            action: `New raw material '${material.name}' added to inventory`,
            time: formatRelativeTime(material.createdAt || Timestamp.now()),
            timestamp: material.createdAt || Timestamp.now(),
            type: "inventory",
            user: "System",
          })
        }
      })

      updateActivitiesList()
    })

    // Fetch Finished Goods
    const finishedGoodsRef = collection(db, "finishedGoods", user.uid, "materials")
    const qFinishedGoods = query(finishedGoodsRef, orderBy("createdAt", "desc"), limit(50))
    const unsubFinishedGoods = onSnapshot(qFinishedGoods, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const good = change.doc.data()
          activitiesList.push({
            id: `finished_${change.doc.id}`,
            action: `Production completed for '${good.name}'`,
            time: formatRelativeTime(good.createdAt || Timestamp.now()),
            timestamp: good.createdAt || Timestamp.now(),
            type: "report",
            user: "Production",
          })
        }
      })

      updateActivitiesList()
    })

    // Fetch Defect Reports
    const defectsRef = collection(db, "defectReports")
    const qDefects = query(defectsRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(50))
    const unsubDefects = onSnapshot(
      qDefects,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const defect = change.doc.data()
            activitiesList.push({
              id: `defect_${change.doc.id}`,
              action: `Defect reported for '${defect.materialName}' - ${defect.defectType}`,
              time: formatRelativeTime(defect.createdAt || Timestamp.now()),
              timestamp: defect.createdAt || Timestamp.now(),
              type: "issue",
              user: "Quality Control",
            })
          }
        })

        updateActivitiesList()
      },
      (error) => {
        console.warn("Defect reports index not created yet:", error.message)
      }
    )

    // Function to update and sort activities
    const updateActivitiesList = () => {
      const sorted = [...activitiesList].sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp)
        const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp)
        return timeB - timeA
      })
      setActivities(sorted.slice(0, 6)) // Show only 6 recent activities
    }

    return () => {
      unsubWarehouses()
      unsubSuppliers()
      unsubDistributors()
      unsubMaterials()
      unsubFinishedGoods()
      unsubDefects()
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