'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { MotionConfig } from 'framer-motion';
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import CommandPalette from "@/components/CommandPalette";
import SmoothScroll from "@/components/ui/SmoothScroll";
import ScrollChrome from "@/components/ui/ScrollChrome";
import Ripples from "@/components/ui/Ripples";
import { UpdateProvider } from "@/context/UpdateContext";

const emptySubscribe = () => () => {};
const SIDEBAR_KEY = 'flixview:sidebar-collapsed';

export default function AppShell({ children }: { children: React.ReactNode }) {
  // The shell renders only after hydration (server + first client pass get
  // `false`), which is how the old isReady flag prevented flicker — but
  // without a setState-in-effect. useSyncExternalStore is the supported way
  // to express "is hydration done yet".
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(SIDEBAR_KEY) === '1';
    } catch {
      return false;
    }
  });

  // The sidebar width is a CSS variable (--sidebar-w) driven by this
  // attribute, so the content padding, top bar and scroll line all follow it.
  useEffect(() => {
    document.documentElement.dataset.sidebar = collapsed ? 'collapsed' : 'expanded';
  }, [collapsed]);

  const toggleSidebar = useCallback(() => {
    setCollapsed(value => {
      try {
        window.localStorage.setItem(SIDEBAR_KEY, value ? '0' : '1');
      } catch {}
      return !value;
    });
  }, []);

  if (!isClient) return null;

  return (
    // UpdateProvider checks for updates on launch and owns the Update/Cancel
    // prompt; Settings reads the same state for its manual check.
    <UpdateProvider>
      {/* Animations follow the OS "reduce motion" setting. */}
      <MotionConfig reducedMotion="user">
        <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
        <SmoothScroll />
        <ScrollChrome />
        <Ripples />
        <CommandPalette />
        <div className="flex min-h-screen">
          <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
          <div className="flex-1 flex flex-col min-w-0 pl-[var(--sidebar-w)] transition-[padding] duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
            <TopBar />
            <main className="flex-grow pt-[var(--titlebar-height)]">
              {children}
            </main>
          </div>
        </div>
      </MotionConfig>
    </UpdateProvider>
  );
}
