import type { Metadata } from "next";
import { Archivo_Black, Outfit } from "next/font/google";

import { PlayerProvider } from "@/context/PlayerContext";

import { ConnectivityProvider } from "@/context/ConnectivityContext";
import { DataProvider } from "@/context/DataContext";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

// Heavy display face for the outlined rank numbers (Top 10 row, Trending).
// Outfit's heavy digits are drawn from overlapping strokes, and an outline
// (text-stroke) traces those overlaps inside each number; Archivo Black was
// drawn as a single weight with clean, single-shape digits.
const rankFont = Archivo_Black({
  variable: "--font-rank",
  subsets: ["latin"],
  weight: "400",
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
        className={`${outfit.variable} ${rankFont.variable} ${outfit.className} antialiased min-h-screen bg-background text-foreground`}
      >
        <PlayerProvider>
          <ConnectivityProvider>
              <DataProvider>
                <AppShell>
                  {children}
                </AppShell>
              </DataProvider>
          </ConnectivityProvider>
        </PlayerProvider>
      </body>
    </html>
  );
}
