"use client";

import * as React from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { 
  LogOut, Package, LayoutDashboard, ShoppingCart, 
  Users, Settings, Plus, Search, PanelLeftClose, 
  PanelLeftOpen, Inbox, ChevronRight, HomeIcon 
} from "lucide-react";
import { toast } from "sonner";

import ProtectedPage from "@/container/ProtectRoot";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const router = useRouter();
  const user = auth.currentUser;
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      router.replace("/signin");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const userInitials = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <ProtectedPage>
      <div className="flex min-h-screen bg-[#080808] text-slate-200 font-sans">
        
        {/* SIDEBAR */}
        <aside 
          className={`relative border-r border-white/5 bg-[#0d0d0d] transition-all duration-300 flex flex-col z-20
          ${isCollapsed ? "w-[80px]" : "w-64"}`}
        >
          <div className="h-16 flex items-center px-6 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl">
                <Package className="h-5 w-5 text-white" />
              </div>
              {!isCollapsed && <span className="text-white font-bold tracking-tight text-lg">StockFlow</span>}
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1.5">
            <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active collapsed={isCollapsed} />
            <NavItem icon={<Package size={20} />} label="Inventory" collapsed={isCollapsed} />
            <NavItem icon={<ShoppingCart size={20} />} label="Orders" collapsed={isCollapsed} />
            <NavItem icon={<Users size={20} />} label="Suppliers" collapsed={isCollapsed} />
            <div className="py-4"><Separator className="bg-white/5" /></div>
            <NavItem icon={<Settings size={20} />} label="Settings" collapsed={isCollapsed} />
          </nav>

          {/* USER FOOTER SECTION */}
          <div className="mt-auto p-4">
            {isCollapsed ? (
              <div className="flex justify-center items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#1a1a1a] text-violet-400 text-xs font-bold">{userInitials}</AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border-2 border-violet-500/20 shadow-inner">
                    <AvatarFallback className="bg-[#1a1a1a] text-violet-400 text-xs font-bold">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[12px] font-semibold truncate text-white">{user?.email?.split('@')[0]}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">Active</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all cursor-pointer"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          
          {/* TOP NAVIGATION BAR */}
          <header className="h-16 border-b border-white/5 bg-[#080808]/60 backdrop-blur-xl flex items-center justify-between px-8 z-10">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-slate-400 transition-colors cursor-pointer"
              >
                {isCollapsed ? <PanelLeftOpen size={22} /> : <PanelLeftClose size={22} />}
              </button>

              {/* BREADCRUMB */}
              <nav className="flex items-center gap-2 text-sm font-medium">
                <HomeIcon size={14} className="text-slate-500 cursor-pointer" onClick={() => router.push("/admin")} />
                <ChevronRight size={14} className="text-slate-700" />
                <span className="text-slate-500 cursor-pointer" onClick={() => router.push("/admin")}>Admin</span>
                <ChevronRight size={14} className="text-slate-700" />
                <span className="text-white">Inventory</span>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-64 hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <Input 
                  placeholder="Quick search..." 
                  className="pl-9 bg-[#080808]/60 border-white/5 focus:border-violet-500/50 focus:ring-0 text-xs h-8 rounded-full transition-all" 
                />
              </div>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white gap-2 px-4 rounded-full h-8 font-semibold cursor-pointer">
                <Plus size={14} /> <span className="text-xs">Add Item</span>
              </Button>
            </div>
          </header>

          {/* DASHBOARD CONTENT */}
          <main className="flex-1 overflow-y-auto p-8 space-y-8 bg-gradient-to-b from-[#0a0a0a] to-[#080808]">
            <div className="max-w-7xl mx-auto space-y-8">
              
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Warehouse Overview</h1>
                <p className="text-slate-500 text-xs mt-1 font-medium">Manage and monitor your products across all locations.</p>
              </div>

              {/* STATS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Total Inventory" value="0" />
                <StatsCard title="Net Valuation" value="$0.00" />
                <StatsCard title="Pending Restock" value="0" />
                <StatsCard title="Stock Defects" value="0" />
              </div>

              {/* TABLE CONTAINER */}
              <div className="relative group">
                <div className="absolute -inset-[1px] bg-gradient-to-r from-violet-600/30 via-transparent to-fuchsia-600/30 rounded-2xl opacity-50 blur-[2px] transition duration-500" />
                
                <Card className="relative bg-[#0d0d0d] border-white/5 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-white/[0.02] border-b border-white/5 px-8 py-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">Product Registry</CardTitle>
                        <CardDescription className="text-slate-500 text-xs mt-1">Detailed list of SKU items currently in stock.</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 border-white/5 text-[10px] font-bold tracking-widest uppercase px-4 cursor-pointer">Export CSV</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-28">
                    <div className="h-20 w-20 bg-violet-600/5 border border-violet-500/20 rounded-3xl flex items-center justify-center mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                      <Inbox className="h-10 w-10 text-violet-500/40" />
                    </div>
                    <h3 className="text-white text-lg font-semibold tracking-tight">Your shelf is empty</h3>
                    <p className="text-slate-500 text-sm mb-8 text-center max-w-[300px] leading-relaxed">
                      You haven't listed any products yet. Start your inventory journey by clicking below.
                    </p>
                    <Button className="bg-white text-black hover:bg-slate-200 px-8 rounded-full h-10 font-bold transition-all transform hover:scale-105 cursor-pointer">
                      Create First Product
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedPage>
  );
}

function NavItem({ icon, label, active = false, collapsed = false }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border border-transparent ${
      active ? "border-violet-500 text-white" : "text-slate-500"
    }`}>
      <div className={active ? "text-white" : "text-slate-500"}>{icon}</div>
      {!collapsed && <span className="text-[13px] font-semibold tracking-tight">{label}</span>}
    </div>
  );
}

function StatsCard({ title, value }) {
  return (
    <div className="relative">
      <Card className="relative bg-[#0d0d0d] border-white/5 rounded-2xl h-full">
        <CardContent className="pt-6 px-6">
          <div className="flex justify-between items-start mb-4">
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
             <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
          </div>
          <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
          <div className="mt-4 pt-4 border-t border-white/5">
             <div className="flex items-center justify-between text-[10px] font-medium">
               <span className="text-slate-600 italic">No activity recorded</span>
               <span className="text-violet-500">0%</span>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
