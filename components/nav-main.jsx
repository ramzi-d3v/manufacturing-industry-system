"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  IconCirclePlusFilled, 
  IconChevronRight,
  IconStack2,      
  IconBox,         
  IconPackageExport ,
  IconBolt 
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
  
  // State to track which section is open (only one at a time)
  const [openSection, setOpenSection] = React.useState("raw-materials")

  const handleSectionToggle = (section) => {
    setOpenSection(prev => prev === section ? null : section)
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        
        {/* Quick Action */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="New Production Order"
              className="bg-primary text-primary-foreground hover:bg-slate-600 cursor-pointer hover:backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
            >
              <IconCirclePlusFilled size={18} />
              <span>Quick Action</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu>
          {/* 1. Raw Materials - Collapsible */}
          <Collapsible
            asChild
            open={openSection === "raw-materials"}
            onOpenChange={() => handleSectionToggle("raw-materials")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton 
                  tooltip="Raw Materials"
                  className="cursor-pointer hover:backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
                >
                  <IconStack2 size={18} stroke={1.5} />
                  <span className="font-medium">Raw Materials</span>
                  <IconChevronRight className={cn(
                    "ml-auto transition-transform duration-200 text-zinc-500",
                    openSection === "raw-materials" && "rotate-90"
                  )} />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton 
                      asChild 
                      isActive={pathname === "/raw-materials/inventory"}
                      className="cursor-pointer hover:backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
                    >
                      <Link href="/raw-materials/inventory">
                        <span className={cn(
                          "transition-colors text-xs",
                          pathname === "/raw-materials/inventory" ? "text-purple-400 font-medium" : "text-zinc-400"
                        )}>
                          Inventory
                        </span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton 
                      asChild 
                      isActive={pathname === "/raw-materials/defect-report"}
                      className="cursor-pointer hover:backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
                    >
                      <Link href="/raw-materials/defect-report">
                        <span className={cn(
                          "transition-colors text-xs",
                          pathname === "/raw-materials/defect-report" ? "text-purple-400 font-medium" : "text-zinc-400"
                        )}>
                          Defect Report
                        </span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          {/* 2. Finished Products - Collapsible */}
          <Collapsible
            asChild
            open={openSection === "finished-products"}
            onOpenChange={() => handleSectionToggle("finished-products")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton 
                  tooltip="Finished Products"
                  className="cursor-pointer hover:backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
                >
                  <IconPackageExport size={18} stroke={1.5} />
                  <span className="font-medium">Finished Products</span>
                  <IconChevronRight className={cn(
                    "ml-auto transition-transform duration-200 text-zinc-500",
                    openSection === "finished-products" && "rotate-90"
                  )} />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton 
                      asChild 
                      isActive={pathname === "/finished-products/inventory"}
                      className="cursor-pointer hover:backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
                    >
                      <Link href="/finished-products/inventory">
                        <span className={cn(
                          "transition-colors text-xs",
                          pathname === "/finished-products/inventory" ? "text-purple-400 font-medium" : "text-zinc-400"
                        )}>
                          Inventory
                        </span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton 
                      asChild 
                      isActive={pathname === "/finished-products/defect-report"}
                      className="cursor-pointer hover:backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
                    >
                      <Link href="/finished-products/defect-report">
                        <span className={cn(
                          "transition-colors text-xs",
                          pathname === "/finished-products/defect-report" ? "text-purple-400 font-medium" : "text-zinc-400"
                        )}>
                          Defect Report
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
              className="cursor-pointer hover:backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
            >
              <Link href="/energy-consuption" className="flex items-center gap-2">
                <IconBolt size={18} stroke={1.5} />
                <span className={cn(
                  "font-medium",
                  pathname === "/energy-consuption" ? "text-purple-400" : ""
                )}>
                  Energy Consuption
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
            
            
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}