import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import ScrollToTop from "@/components/ScrollToTop";
import UpdateNotification from "@/components/UpdateNotification";


import { PlayerProvider } from "@/context/PlayerContext";

import { ConnectivityProvider } from "@/context/ConnectivityContext";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlixView",
  description: "Your Ultimate Movie & TV Show Destination",
};

import AppShell from "@/components/AppShell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${outfit.className} antialiased min-h-screen bg-background text-foreground`}
      >
        <PlayerProvider>
          <ConnectivityProvider>
            <AuthProvider>
              <DataProvider>
                <AppShell>
                  {children}
                </AppShell>
              </DataProvider>
            </AuthProvider>
          </ConnectivityProvider>
        </PlayerProvider>
      </body>
    </html>
  );
}
