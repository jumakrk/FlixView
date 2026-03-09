'use client';

import Link from 'next/link';
import { Play, Download, ExternalLink, MessageSquare, Send, Monitor, Apple, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const downloadLinks = {
    windows: 'https://github.com/jumakrk/FlixView/releases/download/v0.1.6/FlixView-Setup-0.1.6.exe',
    macos: 'https://github.com/jumakrk/FlixView/releases/download/v0.1.6/FlixView-0.1.6-arm64.dmg',
    linux: 'https://github.com/jumakrk/FlixView/releases/download/v0.1.6/FlixView-0.1.6.AppImage',
  };

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30 selection:text-white">
      {/* Navbar placeholder for landing */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between glass-panel border-none bg-black/20 backdrop-blur-xl">
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.5)]">
                <Play size={20} fill="currentColor" className="ml-1" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">FlixView</span>
        </div>
        <Link 
            href="/browse"
            className="px-6 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all font-semibold text-sm flex items-center gap-2"
        >
            Launch App <ExternalLink size={14} />
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-screen flex flex-col items-center justify-center text-center">
        {/* Decorative Blobs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] -z-10" />

        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           className="max-w-4xl mx-auto"
        >
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 leading-none">
                Unlimited Entertainment. <br/> <span className="text-primary italic">Zero Constraints.</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto font-medium">
                The ultimate destination for your favorite movies and TV shows. Fully cross-platform, ad-free, and always evolving.
            </p>

            {/* Main CTAs */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16">
                <Link 
                    href={downloadLinks.windows}
                    className="w-full md:w-auto px-8 py-5 rounded-2xl bg-primary text-white font-bold text-lg flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_40px_rgba(124,58,237,0.4)]"
                >
                    <Download size={22} />
                    Download for Windows
                </Link>
                <Link 
                    href="/browse"
                    className="w-full md:w-auto px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-lg flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                >
                    <Play size={20} fill="currentColor" />
                    Browse Online
                </Link>
            </div>

            {/* platform links */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                <Link href={downloadLinks.macos} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white/5 transition-all active:scale-95">
                    <Apple size={24} />
                    <span className="text-xs font-bold uppercase tracking-widest">macOS</span>
                </Link>
                <Link href={downloadLinks.linux} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white/5 transition-all active:scale-95">
                    <Terminal size={24} />
                    <span className="text-xs font-bold uppercase tracking-widest">Linux</span>
                </Link>
                <div className="hidden md:flex flex-col items-center gap-2 p-4 rounded-xl cursor-not-allowed opacity-30">
                    <Monitor size={24} />
                    <span className="text-xs font-bold uppercase tracking-widest">Android Soon</span>
                </div>
            </div>
        </motion.div>
      </section>

      {/* Socials / Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-black/20 backdrop-blur-3xl relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-baseline justify-between gap-12">
            <div className="max-w-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Play size={16} fill="currentColor" className="ml-0.5" />
                    </div>
                    <span className="text-lg font-black tracking-tighter uppercase italic">FlixView</span>
                </div>
                <p className="text-white/40 text-sm leading-relaxed">
                    A community-focused streaming companion designed for smoothness, beauty, and privacy. 
                </p>
            </div>

            <div className="flex gap-4">
                <a href="#" className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/20 border border-white/10 transition-all">
                    <Send size={24} />
                </a>
                <a href="#" className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-indigo-500/20 hover:text-indigo-400 hover:border-indigo-500/20 border border-white/10 transition-all">
                    <MessageSquare size={24} />
                </a>
            </div>
        </div>
        
        <div className="max-w-6xl mx-auto mt-20 text-center text-white/10 text-[10px] font-black uppercase tracking-[0.3em]">
            © 2026 FLIXVIEW PROJECT • BY JUMAKRK
        </div>
      </footer>
    </div>
  );
}
