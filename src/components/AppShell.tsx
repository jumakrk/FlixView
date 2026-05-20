'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";
import UpdateNotification from "@/components/UpdateNotification";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    setIsReady(true);
  }, [pathname]);

  // Prevent flicker
  if (!isReady) return null;

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
