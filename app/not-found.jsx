"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Home, 
  ArrowRight, 
  ArrowLeft,
  Package, 
  Factory,
  Zap,
  TrendingUp,
  Users,
  Settings,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  const router = useRouter();

  const quickLinks = [
    {
      icon: Home,
      label: "Dashboard",
      href: "/",
      description: "Back to home",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Package,
      label: "Raw Materials",
      href: "/raw-materials/inventory",
      description: "Inventory management",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Factory,
      label: "Finished Products",
      href: "/finished-products/inventory",
      description: "Production inventory",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: Zap,
      label: "Energy",
      href: "/energy-consumption",
      description: "Energy insights",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      icon: TrendingUp,
      label: "Analytics",
      href: "/products-analytics",
      description: "Data insights",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Users,
      label: "Suppliers",
      href: "/admin",
      description: "Manage partners",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      icon: FileText,
      label: "Finance",
      href: "/finance",
      description: "Financial reports",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/settings",
      description: "Configuration",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black px-4 py-12">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative w-full max-w-6xl z-10">
        {/* Main 404 Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-2xl opacity-25 animate-pulse" />
            <AlertTriangle className="h-24 w-24 text-purple-400 relative drop-shadow-lg" />
          </div>

          <h1 className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-3">
            404
          </h1>

          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3">
            Page Not Found
          </h2>

          <p className="text-muted-foreground text-lg max-w-md mx-auto mb-1">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
            Don't worry, let us help you get back on track
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Button 
              onClick={() => router.back()}
              variant="outline"
              className="gap-2 border-purple-500/50 hover:border-purple-500 hover:bg-purple-500/10"
              size="lg"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Link href="/">
              <Button 
                className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                size="lg"
                asChild
              >
                <span>
                  <Home className="h-4 w-4" />
                  Home Dashboard
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Links Grid */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-6 text-center">
            Quick Navigation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <div className="group relative h-full p-4 rounded-lg border border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-purple-500/5 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer">
                    <div className="flex flex-col h-full">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${link.bgColor}`}>
                        <Icon className={`h-5 w-5 ${link.color}`} />
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-1 text-left">
                        {link.label}
                      </h4>
                      <p className="text-xs text-muted-foreground text-left mb-3 flex-grow">
                        {link.description}
                      </p>
                      <div className="flex items-center gap-1 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                        <span>Explore</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Support Section */}
        <div className="rounded-lg border border-white/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm p-6 text-center">
          <p className="text-muted-foreground mb-3">
            Need help finding something?
          </p>
          <p className="text-sm text-muted-foreground">
            Check out our <Link href="/settings" className="text-purple-400 hover:text-purple-300 underline">settings</Link> or contact support at{" "}
            <a href="ramzi@prodesign.co.tz" className="text-purple-400 hover:text-purple-300 underline">support@example.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
