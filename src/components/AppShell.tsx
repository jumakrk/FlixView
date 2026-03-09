'use client';

import { usePathname } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";
import UpdateNotification from "@/components/UpdateNotification";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Routes where the Sidebar/TopBar should NOT be shown
  const isLandingPage = pathname === '/';
  
  if (isLandingPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <ScrollToTop />
      <UpdateNotification />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:pl-[260px] pl-[80px] transition-[padding] duration-300">
        <TopBar />
        <main className="flex-grow pt-[32px]">
          {children}
        </main>
      </div>
    </div>
  );
}
