"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  IconReceipt2,
  IconFileAnalytics,
  IconBolt,
} from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export function NavDocuments({ ...props }) {
  const pathname = usePathname()

  const secondaryItems = [
    {
      title: "Income & Expenses",
      url: "/dashboard/finance",
      icon: IconReceipt2,
    },
    {
      title: "Delivery Report",
      url: "/dashboard/reports/delivery",
      icon: IconFileAnalytics,
    },
    {
      title: "Energy Consumption",
      url: "/dashboard/energy",
      icon: IconBolt,
    },
  ]

  return (
    <>
      {/* Separator at the top to divide from main nav */}
      <div className="px-4 py-2">
        <Separator className="opacity-50" />
      </div>

      <SidebarGroup {...props} className="py-0">
        {/* The Title Section */}
        <SidebarGroupLabel className={cn(
          inter.className,
          "text-[11px] uppercase tracking-widest text-zinc-500 font-normal px-2 mb-2"
        )}>
          Reports & Analytics
        </SidebarGroupLabel>

        <SidebarGroupContent>
          <SidebarMenu>
            {secondaryItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className="hover:bg-zinc-800/50 transition-all duration-200"
                >
                  <Link href={item.url} className="flex items-center gap-3">
                    <item.icon 
                      size={18} 
                      stroke={1.5} 
                      className={cn(
                        pathname === item.url ? "text-purple-400" : "text-zinc-500"
                      )} 
                    />
                    <span className={cn(
                      inter.className,
                      "text-sm font-normal transition-colors",
                      pathname === item.url ? "text-purple-400" : "text-zinc-400"
                    )}>
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}