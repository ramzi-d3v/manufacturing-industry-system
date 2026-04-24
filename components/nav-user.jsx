"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  getFirestore, 
  doc, 
  onSnapshot 
} from "firebase/firestore"
import { 
  getAuth, 
  signOut 
} from "firebase/auth"
import {
  IconLogout,
  IconUserCircle,
  IconDotsVertical,
} from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { toast } from "sonner"; 

const db = getFirestore()
const auth = getAuth()

export function NavUser({ user: initialUser }) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  
  const [userData, setUserData] = useState({
    name: initialUser?.name || "Loading...",
    email: initialUser?.email || "",
    avatar: initialUser?.avatar || ""
  })

  // Fetch data from Firestore collection 'user_details'
  useEffect(() => {
    if (!auth.currentUser?.uid) return

    const userDocRef = doc(db, "user_details", auth.currentUser.uid)
    
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        setUserData({
          name: data.firstName || "User",
          email: data.email || auth.currentUser.email,
          avatar: data.avatar_url || data.avatar || ""
        })
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.replace("/signin") 
    } catch (error) {
      toast.error("Network or Server Error");
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={userData.avatar} alt={userData.name} />
                <AvatarFallback className="rounded-lg">
                  {userData.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userData.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {userData.email}
                </span>
              </div>
              <IconDotsVertical className="h-4 w-4 text-muted-foreground ml-1 flex-shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={userData.avatar} alt={userData.name} />
                  <AvatarFallback className="rounded-lg">
                    {userData.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{userData.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {userData.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600 cursor-pointer"
            >
              <IconLogout className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}