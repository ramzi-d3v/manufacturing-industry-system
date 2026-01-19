"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  IconCirclePlusFilled, 
  IconChevronRight,
  IconStack2,      // Batches
  IconBox,         // Products
  IconTruckDelivery, // Logistics/Incoming
  IconPackageExport  // Outgoing
} from "@tabler/icons-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function NavMain() {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        
        {/* Quick Action */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="New Production Order"
              className="bg-primary text-primary-foreground hover:bg-slate-600 cursor-pointer"
            >
              <IconCirclePlusFilled size={18} />
              <span>Quick Action</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu>
          {/* 1. Batches - Collapsible */}
          <Collapsible
            asChild
            defaultOpen={true}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Batches">
                  <IconStack2 size={18} stroke={1.5} />
                  <span className="font-medium">Batches</span>
                  <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-zinc-500" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/batches/raw-material"}>
                      <Link href="/batches/raw-material">
                        <span className={cn(
                          "transition-colors text-xs",
                          pathname === "/batches/raw-material" ? "text-purple-400 font-medium" : "text-zinc-400"
                        )}>
                          Raw Material Batch
                        </span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/batches/finished"}>
                      <Link href="/batches/finished">
                        <span className={cn(
                          "transition-colors text-xs",
                          pathname === "/batches/finished" ? "text-purple-400 font-medium" : "text-zinc-400"
                        )}>
                          Finished Production Batch
                        </span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          {/* 2. Logistics & Flow - Collapsible */}
          <Collapsible
            asChild
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Logistics">
                  <IconTruckDelivery size={18} stroke={1.5} />
                  <span className="font-medium">Flow & Logistics</span>
                  <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-zinc-500" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/logistics/incoming"}>
                      <Link href="/logistics/incoming">
                        <span className={cn(
                          "transition-colors text-xs",
                          pathname === "/logistics/incoming" ? "text-purple-400 font-medium" : "text-zinc-400"
                        )}>
                          Incoming Supply
                        </span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/logistics/outgoing"}>
                      <Link href="/logistics/outgoing">
                        <span className={cn(
                          "transition-colors text-xs",
                          pathname === "/logistics/outgoing" ? "text-purple-400 font-medium" : "text-zinc-400"
                        )}>
                          Outgoing Production
                        </span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          {/* 3. Products - Standalone */}
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              tooltip="Products & Catalog"
              isActive={pathname === "/products"}
            >
              <Link href="/products">
                <IconBox size={18} stroke={1.5} />
                <span className={cn(
                  "font-medium",
                  pathname === "/products" ? "text-purple-400" : ""
                )}>
                  Products & Catalog
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}