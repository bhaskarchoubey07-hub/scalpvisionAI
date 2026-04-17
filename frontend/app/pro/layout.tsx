"use client";

import { usePathname } from "next/navigation";
import { ProSidebar } from "@/components/pro/ProSidebar";
import DataStatusIndicator from "@/components/pro/DataStatusIndicator";

export default function ProLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = pathname === "/pro/chart-fullscreen";

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#030712] w-screen h-screen overflow-hidden antialiased">
        {children}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[50] bg-[#030712] flex overflow-hidden text-slate-100 antialiased">
      {/* Neural background substitute for Pro layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      <ProSidebar />
      
      <main className="flex-1 relative z-10 overflow-y-auto ml-64 p-8">
        <div className="max-w-7xl mx-auto min-h-full flex flex-col">
          <div className="flex justify-end mb-8">
             <DataStatusIndicator />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
