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
              </DataProvider>
            </AuthProvider>
          </ConnectivityProvider>
        </PlayerProvider>
      </body>
    </html>
  );
}
