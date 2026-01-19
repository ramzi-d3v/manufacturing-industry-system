"use client";
import * as React from "react"
import Link from "next/link"
import { 
  IconReceipt2, 
  IconTruckDelivery, 
  IconBolt 
} from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({ ...props }) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          
          {/* Income & Expenses */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/finance">
                <IconReceipt2 size={18} />
                <span>Income & Expenses</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Delivery Report */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/delivery">
                <IconTruckDelivery size={18} />
                <span>Delivery Report</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Energy Consumption */}
          <SidebarMenuItem>
            <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/energy">
                <IconBolt size={18} />
                <span>Energy Consumption</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}