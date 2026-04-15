"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  IconBuildingStore,
  IconUsers,
  IconClock,
  IconCalendar,
  IconMessage,
  IconMail,
  IconPhone,
  IconHeadset,
  IconHelp,
  IconClipboardList,
  IconMapPin,
  IconSparkles,
  IconListCheck,
  IconLivePhoto,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export default function ModernManufacturingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Static / demo data for dashboard (simulating real data)
  const warehouses = [
    { id: "wh1", name: "Main Distribution Center", location: "Dar es Salaam, TZ" },
    { id: "wh2", name: "North Region Hub", location: "Arusha, TZ" },
    { id: "wh3", name: "Raw Materials Depot", location: "Mwanza, TZ" },
  ];
  const suppliers = [
    { id: "sup1", name: "Global Steel Corp", contact: "steel@example.com" },
    { id: "sup2", name: "Eco Plastics Ltd", contact: "eco@example.com" },
    { id: "sup3", name: "Precision Components", contact: "sales@precision.co" },
  ];
  const distributors = [
    { id: "dist1", name: "East African Logistics", serviceArea: "Kenya, Tanzania, Uganda" },
    { id: "dist2", name: "QuickMove Distributors", serviceArea: "Coastal Region" },
  ];
  const activities = [
    { id: "act1", action: "New warehouse 'Central Hub' added", time: "2 min ago", user: "System", type: "warehouse" },
    { id: "act2", action: "Supplier 'Global Steel Corp' registered", time: "1 hour ago", user: "Procurement", type: "supplier" },
    { id: "act3", action: "Defect reported for 'Aluminum Sheets'", time: "3 hours ago", user: "Quality Control", type: "issue" },
    { id: "act4", action: "Production completed for 'Eco Battery v2'", time: "5 hours ago", user: "Production", type: "report" },
    { id: "act5", action: "Inventory threshold alert: Steel coils low", time: "Yesterday", user: "System", type: "alert" },
  ];

  const totalWarehouses = warehouses.length;
  const totalSuppliers = suppliers.length;
  const totalDistributors = distributors.length;
  const totalPartners = totalSuppliers + totalDistributors;

  const userName = "Alex Morgan";
  const currentTime = new Date();
  const greeting = currentTime.getHours() < 12 ? "Good morning" : currentTime.getHours() < 18 ? "Good afternoon" : "Good evening";
  const formattedDate = currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const formattedTime = currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const features = [
    { icon: IconBuildingWarehouse, title: "Warehouse Management", description: "Track raw materials and finished goods inventory efficiently" },
    { icon: IconTruck, title: "Supply Chain", description: "Monitor suppliers and distributors in real-time" },
    { icon: IconChartBar, title: "Analytics & Reporting", description: "Get detailed insights into production and inventory metrics" },
    { icon: IconShieldCheck, title: "Quality Control", description: "Track defects and maintain product quality standards" },
    { icon: IconBolt, title: "Energy Monitoring", description: "Monitor and optimize energy consumption" },
    { icon: IconBell, title: "Real-time Notifications", description: "Get instant alerts for important events" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - no logo, clean links */}
      <nav className="fixed top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* No logo / empty spacer */}
            <div className="flex-1 md:flex-none"></div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">
                Features
              </Link>
              <Link href="#dashboard" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">
                Dashboard
              </Link>
              <Link href="#insights" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">
                Insights
              </Link>
              <Link href="#contact" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">
                Contact
              </Link>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button className="md:hidden p-2 text-gray-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <IconX className="h-5 w-5" /> : <IconMenu2 className="h-5 w-5" />}
              </button>

              {/* Auth buttons */}
              <Link href="/signin">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-gray-700">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="hidden sm:inline-flex bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-3">
              <Link href="#features" className="block text-sm text-gray-700 hover:text-indigo-600 py-2">
                Features
              </Link>
              <Link href="#dashboard" className="block text-sm text-gray-700 hover:text-indigo-600 py-2">
                Dashboard
              </Link>
              <Link href="#insights" className="block text-sm text-gray-700 hover:text-indigo-600 py-2">
                Insights
              </Link>
              <Link href="#contact" className="block text-sm text-gray-700 hover:text-indigo-600 py-2">
                Contact
              </Link>
              <div className="flex gap-3 pt-2">
                <Link href="/signin" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" className="flex-1">
                  <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="outline" className="mb-4 border-indigo-200 text-indigo-700 bg-indigo-50">
            Next‑Gen Manufacturing Platform
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            Complete Manufacturing{" "}
            <span className="text-indigo-600">Intelligence System</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Streamline your entire operation — from raw materials to finished goods. 
            Real‑time insights, automated quality control, and seamless supply chain management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md">
                Start Free Trial <IconArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-gray-300 text-gray-700">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Powerful capabilities</h2>
            <p className="text-gray-600 text-lg">Everything you need to run a modern manufacturing operation</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="border border-gray-200 shadow-sm hover:shadow-md transition-all bg-white">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <CardTitle className="text-gray-900">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dashboard Overview Section (replaces pricing) */}
      <section id="dashboard" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3 border-indigo-200 text-indigo-700 bg-indigo-50">Live overview</Badge>
            <h2 className="text-3xl font-bold text-gray-900">Your command center</h2>
            <p className="text-gray-600 mt-2">Real‑time metrics and operational status at a glance</p>
          </div>

          {/* Greeting & Metrics Card */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 md:p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-700 font-bold text-lg">{userName.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{greeting},</p>
                  <h3 className="text-2xl font-bold text-gray-900">{userName} <span className="text-indigo-500">👋</span></h3>
                  <p className="text-xs text-gray-500 mt-0.5">Welcome to your supply chain command center</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/notifications">
                  <Button variant="outline" size="sm" className="gap-2 border-gray-300">
                    <IconBell className="h-4 w-4" />
                    <span className="hidden sm:inline">Notifications</span>
                  </Button>
                </Link>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                  <IconSparkles className="h-4 w-4" />
                  Upgrade
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                <IconCalendar className="h-3.5 w-3.5" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                <IconClock className="h-3.5 w-3.5" />
                <span>{formattedTime}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                <IconListCheck className="h-3.5 w-3.5" />
                <span>All systems operational</span>
              </div>
            </div>

            {/* Metric tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                  <IconBuildingWarehouse className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Warehouses</p>
                  <p className="text-lg font-semibold text-gray-900">{totalWarehouses}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
                  <IconTruck className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Suppliers</p>
                  <p className="text-lg font-semibold text-gray-900">{totalSuppliers}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center">
                  <IconBuildingStore className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Distributors</p>
                  <p className="text-lg font-semibold text-gray-900">{totalDistributors}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center">
                  <IconUsers className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Partners</p>
                  <p className="text-lg font-semibold text-gray-900">{totalPartners}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Two-column dashboard: left side lists, right side activities */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left column: warehouses, suppliers, distributors */}
            <div className="flex-1 space-y-6">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <IconBuildingWarehouse className="h-4 w-4 text-blue-600" />
                      Warehouses
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">{totalWarehouses} total</Badge>
                  </div>
                  <CardDescription>Your storage facilities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {warehouses.map((wh) => (
                    <div key={wh.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">{wh.name}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <IconMapPin className="h-3 w-3" />
                        <span>{wh.location}</span>
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full text-indigo-600 mt-2">
                    View all warehouses →
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <IconTruck className="h-4 w-4 text-green-600" />
                      Suppliers
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">{totalSuppliers} total</Badge>
                  </div>
                  <CardDescription>Raw material providers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suppliers.map((sup) => (
                    <div key={sup.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">{sup.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{sup.contact}</p>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full text-indigo-600 mt-2">
                    Manage suppliers →
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <IconBuildingStore className="h-4 w-4 text-purple-600" />
                      Distributors
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">{totalDistributors} total</Badge>
                  </div>
                  <CardDescription>Product distribution partners</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {distributors.map((dist) => (
                    <div key={dist.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">{dist.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{dist.serviceArea}</p>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full text-indigo-600 mt-2">
                    View network →
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right column: Recent Activity + Support */}
            <div className="w-full lg:w-96 space-y-6">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <IconClipboardList className="h-4 w-4 text-indigo-600" />
                      Recent Activity
                    </CardTitle>
                    <Badge variant="outline" className="text-xs gap-1">
                      <IconLivePhoto className="h-3 w-3 text-green-500" /> Live
                    </Badge>
                  </div>
                  <CardDescription>Latest system updates & events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                      <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <IconClock className="h-3 w-3 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{activity.action}</p>
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                          <span>{activity.time}</span>
                          <span>•</span>
                          <span>{activity.user}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="link" className="w-full text-indigo-600 text-sm mt-1">
                    View full history
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-indigo-100 bg-indigo-50/40 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <IconHeadset className="h-4 w-4 text-indigo-600" />
                    Support Center
                  </CardTitle>
                  <CardDescription className="text-gray-600">We're here to help 24/7</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700">Get instant assistance with any supply chain or technical issue.</p>
                  <div className="flex gap-3">
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-1 flex-1">
                      <IconMessage className="h-3.5 w-3.5" /> Live Chat
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-300 flex-1 gap-1">
                      <IconMail className="h-3.5 w-3.5" /> Email
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 text-center pt-1">
                    Response within 1 hour • <span className="font-medium">ramzi@prodesign.co.tz</span> • +255 629 220 302
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Insights / CTA Section (simple) */}
      <section id="insights" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to transform your manufacturing?</h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Join industry leaders who use ManufactureHub to optimize operations, reduce waste, and scale efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                Start free trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-gray-300">
                Talk to sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - no logo, just links */}
      <footer id="contact" className="border-t border-gray-200 bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#features" className="hover:text-indigo-600 transition">Features</Link></li>
                <li><Link href="#dashboard" className="hover:text-indigo-600 transition">Dashboard</Link></li>
                <li><Link href="#" className="hover:text-indigo-600 transition">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#" className="hover:text-indigo-600 transition">About</Link></li>
                <li><Link href="#" className="hover:text-indigo-600 transition">Blog</Link></li>
                <li><Link href="#" className="hover:text-indigo-600 transition">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#" className="hover:text-indigo-600 transition">Documentation</Link></li>
                <li><Link href="#" className="hover:text-indigo-600 transition">API Reference</Link></li>
                <li><Link href="#" className="hover:text-indigo-600 transition">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#" className="hover:text-indigo-600 transition">Privacy</Link></li>
                <li><Link href="#" className="hover:text-indigo-600 transition">Terms</Link></li>
                <li><Link href="#" className="hover:text-indigo-600 transition">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2026 ManufactureHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}