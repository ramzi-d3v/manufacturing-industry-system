"use client";
import * as React from "react"
import Link from "next/link"
import { IconSettings } from "@tabler/icons-react"

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
          
          {/* Settings */}
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              className="cursor-pointer   hover:bg-transparent"
            >
              
              <Link href="/settings" >
                <div className="hover:text-purple-400 flex gap-2 items-center">
                <IconSettings size={18} />
                <span>Settings</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}