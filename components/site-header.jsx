"use client"

import { Home, Bell, ChevronRight } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Inter } from "next/font/google"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

// Import breadcrumb components directly from the file if the index doesn't export them
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const inter = Inter({
  subsets: ["latin"],
})

export function SiteHeader() {
  const pathname = usePathname()
  
  // Get the current page name from pathname
  const getCurrentPageName = () => {
    const path = pathname.replace(/^\//, '')
    if (!path) return "Dashboard"
    
    const pageName = path
      .split('/')
      .pop()
      ?.replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase()) || "Dashboard"
    
    return pageName
  }

  const currentPage = getCurrentPageName()
  const isHome = pathname === "/" || pathname === "/dashboard"

  return (
    <div className="sticky top-0 z-50 w-full px-2">
      <header className={cn(
        inter.className,
        "flex h-14 shrink-0 items-center bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60",
        "rounded-t-xl shadow-sm"
      )}>
        <div className="flex w-full items-center px-4 lg:px-6">
          
          <SidebarTrigger className="-ml-1" />
          
          <Separator orientation="vertical" className="mx-3 h-6" />
          
          <Breadcrumb>
            <BreadcrumbList className="gap-1">
              {/* Only show breadcrumb if not on home page */}
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
                <BreadcrumbPage className={cn(
                  !isHome && "italic"
                )}>
                  {currentPage}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center justify-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
              <Bell className="size-5 text-zinc-400" />
              <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-purple-500 ring-2 ring-background shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
            </Button>
          </div>
        </div>
      </header>
    </div>
  )
}