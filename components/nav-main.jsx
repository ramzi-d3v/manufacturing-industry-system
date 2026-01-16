"use client"

import * as React from "react"
import Link from "next/link" // Import Link for Next.js navigation
import { usePathname } from "next/navigation" // To highlight the active page
import { 
  IconCirclePlusFilled, 
  IconMail, 
  IconChevronRight,
  IconLayoutDashboard,
  IconWallet,
  IconSettings,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button"
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

// Hardcoded menu items with specific Next.js routes
const menus = [
  {
    title: "Dashboard",
    icon: IconLayoutDashboard,
    isActive: true,
    items: [
      { title: "Overview", url: "/dashboard" },
      { title: "Analytics", url: "/dashboard/analytics" },
    ],
  },
  {
    title: "Finances",
    icon: IconWallet,
    items: [
      { title: "Expenses", url: "/dashboard/expenses" },
      { title: "Revenue", url: "/dashboard/revenue" },
      { title: "Invoices", url: "/dashboard/invoices" },
    ],
  },
  {
    title: "Management",
    icon: IconSettings,
    items: [
      { title: "User Details", url: "/dashboard/profile" },
      { title: "Security", url: "/dashboard/security" },
    ],
  },
]

export function NavMain() {
  const pathname = usePathname() // Detects which page you are currently on

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* Quick Actions */}
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-8"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0 transition-opacity"
              variant="outline"
              asChild
            >
              <Link href="/dashboard/inbox">
                <IconMail />
                <span className="sr-only">Inbox</span>
              </Link>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Collapsible Main Menus */}
        <SidebarMenu>
          {menus.map((group) => (
            <Collapsible
              key={group.title}
              asChild
              defaultOpen={group.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={group.title}>
                    {group.icon && <group.icon size={18} />}
                    <span className="font-medium">{group.title}</span>
                    <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-zinc-500" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {group.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton 
                          asChild 
                          // Highlights the sub-item if the URL matches the current page
                          isActive={pathname === subItem.url}
                        >
                          <Link href={subItem.url}>
                            <span className={cn(
                              "transition-colors",
                              pathname === subItem.url ? "text-purple-400 font-semibold" : "text-zinc-400"
                            )}>
                              {subItem.title}
                            </span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}