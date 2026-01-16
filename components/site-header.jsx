"use client"

import { Home, Search, Bell, ChevronRight } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"

const inter = Inter({
  subsets: ["latin"],
})

export function SiteHeader() {
  return (
    /* The Wrapper: Sticky at the very top. 
       px-2 and pt-2 create the "floating" effect so you can see the rounded corners.
    */
    <div className="sticky top-0 z-50 w-full px-2 pt-1 bg-background/0">
      <header className={cn(
        inter.className,
        "flex h-14 shrink-0 items-center bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60",
        "rounded-t-2xl border-t border-x border-white/5 shadow-sm" // The Top Radius is here
      )}>
        <div className="flex w-full items-center px-4 lg:px-6">
          
          <SidebarTrigger className="-ml-1" />
          
          <Separator orientation="vertical" className="mx-3 h-6" />
          
          <Breadcrumb>
            {/* gap-0.5 for minimum spacing between breadcrumb items */}
            <BreadcrumbList className="text-sm gap-0.5 tracking-tight font-normal">
              <BreadcrumbItem>
                <BreadcrumbLink 
                  href="/dashboard" 
                  className="flex items-center gap-1.5 hover:text-purple-400 transition-colors"
                >
                  <Home className="size-4" />
                  <span>Home</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              
              <BreadcrumbSeparator className="opacity-30">
                <ChevronRight className="size-3" />
              </BreadcrumbSeparator>
              
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground">
                  Financial Intelligence
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-2">
            {/* Search Bar: No bold, Inter font */}
            <Button 
              variant="outline" 
              className="h-9 w-40 lg:w-64 justify-start px-3 text-xs font-normal text-muted-foreground gap-3 border-white/10 bg-zinc-900/40 hover:bg-zinc-800 hidden md:flex rounded-lg"
            >
              <Search className="size-4" />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] opacity-70">
                ⌘K
              </kbd>
            </Button>

            <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
              <Search className="size-5" />
            </Button>

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