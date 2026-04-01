"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebase"
import { doc, onSnapshot } from "firebase/firestore"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }) {
  const [user, loading] = useAuthState(auth)
  const [companyName, setCompanyName] = React.useState("Acme Inc.")

  React.useEffect(() => {
    if (!user) {
      setCompanyName("Acme Inc.")
      return
    }

    const companyRef = doc(db, "company_details", user.uid)
    
    // Real-time listener for company name changes
    const unsubscribe = onSnapshot(
      companyRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          setCompanyName(data.companyName || "Acme Inc.")
        } else {
          setCompanyName("Acme Inc.")
        }
      },
      (error) => {
        console.error("Error listening to company details:", error)
        setCompanyName("Acme Inc.")
      }
    )

    return () => unsubscribe()
  }, [user])

  const displayName = loading ? "Loading..." : companyName

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <div className="flex aspect-square size-5 items-center justify-center rounded-md bg-violet-600 text-white">
                  <IconInnerShadowTop className="size-3.5" />
                </div>
                <span className="text-base font-semibold truncate max-w-[150px]" title={displayName}>
                  {displayName}
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <NavMain />
        <NavDocuments/>
        <NavSecondary className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}