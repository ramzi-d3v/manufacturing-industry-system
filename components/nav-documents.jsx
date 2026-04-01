"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  IconReceipt2,
  IconTruckDelivery,
  IconBolt,
  IconPackage,
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

export function NavDocuments({ ...props }) {
  const pathname = usePathname()

  const secondaryItems = [
    {
      title: "Finance",
      url: "/finance",
      icon: IconReceipt2,
    },
    {
      title: "Logistic & Flow",
      url: "/flow",
      icon: IconTruckDelivery,
    },
    {
      title: "Products Analytics",
      url: "/products-analytics",
      icon: IconBolt,
    },
    {
      title: "Storage",
      url: "/storage",
      icon: IconPackage,
    },
  ]

  return (
    <>
      <div className="px-4 py-1">
        <Separator className="bg-border" />
      </div>

      <SidebarGroup {...props} className="py-0">
        <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-normal px-2 mb-1">
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
                  className="transition-all duration-200 py-1"
                >
                  <Link href={item.url} className="flex items-center gap-2">
                    <item.icon 
                      size={16} 
                      strokeWidth={1.5} 
                      className={cn(
                        "transition-colors",
                        pathname === item.url 
                          ? "text-primary" 
                          : "text-muted-foreground"
                      )} 
                    />
                    <span className={cn(
                      "text-xs font-normal transition-colors",
                      pathname === item.url 
                        ? "text-primary" 
                        : "text-muted-foreground"
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