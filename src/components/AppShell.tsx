'use client';

import { useSyncExternalStore } from 'react';
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";
import UpdateNotification from "@/components/UpdateNotification";

const emptySubscribe = () => () => {};

export default function AppShell({ children }: { children: React.ReactNode }) {
  // The shell renders only after hydration (server + first client pass get
  // `false`), which is how the old isReady flag prevented flicker — but
  // without a setState-in-effect. useSyncExternalStore is the supported way
  // to express "is hydration done yet".
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!isClient) return null;

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
