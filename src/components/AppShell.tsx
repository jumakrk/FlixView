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
  
  // Routes where the Sidebar/TopBar should NOT be shown
  const isLandingPage = pathname === '/';

  useEffect(() => {
    // Check if we are in Electron
    const isElectron = typeof window !== 'undefined' && (window as any).electron;
    
    // If we are on the web (not Electron) and NOT on the landing page, 
    // redirect to the landing page.
    if (!isLandingPage && !isElectron) {
      router.replace('/');
    } else {
      setIsReady(true);
    }
  }, [pathname, isLandingPage, router]);
  
  if (isLandingPage) {
    return <>{children}</>;
  }

  // Prevent flicker during redirect on web
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
