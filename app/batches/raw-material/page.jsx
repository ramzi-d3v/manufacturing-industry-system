import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"

function page() {
  return (
    <SidebarProvider >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader className="relative overflow-hidden bg-zinc-950" />
         <div className="text-4xl text-slate-300">page</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default page