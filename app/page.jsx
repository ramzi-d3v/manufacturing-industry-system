import { AppSidebar } from "@/components/app-sidebar"
import { MonochromeBarChart } from "@/components/production-chart"
import { ValueLineBarChart } from "@/components/expences-chart"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import data from "./data.json"
import { cn } from "@/lib/utils"
import ProtectedPage from "@/container/ProtectRoot"
import { JetBrains_Mono } from "next/font/google"

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
})

export default function Page() {
  return (
    <ProtectedPage>
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        }}
      >
        <AppSidebar variant="inset" />
        <SidebarInset >
          <SiteHeader className="relative overflow-hidden bg-zinc-950" />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Top Left Glow */}
            <div className="absolute -top-[10%] -left-[10%] h-50 w-50 rounded-full bg-purple-600/20 blur-[120px]" />
            {/* Center Right Glow */}
            <div className="absolute top-[20%] -right-[5%] h-100 w-100 rounded-full bg-indigo-500/15 blur-[100px]" />
            {/* Bottom Left Glow */}
            <div className="absolute bottom-[10%] -left-[5%] h-50 w-75 rounded-full bg-fuchsia-600/10 blur-[80px]" />
          </div>
          <div className="flex flex-col flex-1 w-full">
            <div className="@container/main flex flex-1 flex-col gap-2 w-full">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 w-full">
                <SectionCards />

                <section className="py-8 w-full">
                  {/* Section Header */}
                  <div className="px-4 lg:px-6 mb-10 w-full">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 relative w-full">
                      <div className="space-y-1">
                        <h2
                          className={cn(
                            jetBrainsMono.className,
                            "text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-400"
                          )}
                        >
                          Financial Intelligence
                        </h2>

                        <p className="text-zinc-500 text-sm max-w-sm leading-relaxed antialiased">
                          Real-time tracking of platform performance and expense distributions for the current fiscal year.
                        </p>
                      </div>

                      <div className="flex items-center group cursor-pointer pb-1">
                        <a
                          href="#"
                          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 group-hover:text-purple-400 transition-colors duration-300"
                        >
                          <span>See detailed reports</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="size-3 transition-transform duration-300 group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      </div>

                      <div
                        className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-purple-500/50 via-white/10 to-transparent"
                        style={{
                          maskImage:
                            "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.2) 100%)",
                          WebkitMaskImage:
                            "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.2) 100%)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 lg:px-6 w-full">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-1">
                        <div className="size-2 rounded-full bg-white animate-pulse" />
                        <span className=" text-sm text-zinc-500">
                          Expences Trend
                        </span>
                      </div>
                      <MonochromeBarChart />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-1">
                        <div className="size-2 rounded-full bg-emerald-500" />
                        <span className=" text-sm  text-zinc-500">
                          Income Trend
                        </span>
                      </div>
                      <ValueLineBarChart />
                    </div>
                  </div>
                </section>

                {/* <DataTable data={data} /> */}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedPage>
  )
}
