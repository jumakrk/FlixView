'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Download, 
  Monitor, 
  Apple, 
  Terminal, 
  ShieldCheck, 
  Zap, 
  Layout, 
  Globe, 
  ChevronRight,
  Play
} from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { fetchTrending, Movie } from '@/lib/tmdb';

export default function LandingPage() {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.9]);

  useEffect(() => {
    async function getMovies() {
      const movies = await fetchTrending('week');
      setTrendingMovies(movies.slice(0, 15));
    }
    getMovies();
  }, []);

  const downloadLinks = {
    windows: 'https://github.com/jumakrk/FlixView/releases/download/v0.1.6/FlixView-Setup-0.1.6.exe',
    macos: 'https://github.com/jumakrk/FlixView/releases/download/v0.1.6/FlixView-0.1.6-arm64.dmg',
    linux: 'https://github.com/jumakrk/FlixView/releases/download/v0.1.6/FlixView-0.1.6.AppImage',
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0814] text-white selection:bg-primary/30 selection:text-white font-sans overflow-x-hidden">
      
      {/* Premium Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-5 flex items-center justify-between glass-panel border-none bg-black/10 backdrop-blur-2xl">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_25px_rgba(124,58,237,0.4)] transition-transform group-hover:scale-110">
                <Image 
                    src="/icon.png" 
                    alt="Logo" 
                    fill 
                    className="p-2 object-contain"
                />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                FlixView
            </span>
        </div>

        <div className="hidden md:flex items-center gap-10">
            <button onClick={() => scrollToSection('features')} className="text-sm font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollToSection('download')} className="text-sm font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Download</button>
            <div className="h-4 w-[1px] bg-white/10" />
            <a href="https://github.com/jumakrk/FlixView" target="_blank" rel="noopener noreferrer" className="text-sm font-bold hover:text-primary transition-colors">GitHub</a>
        </div>

        <button 
            onClick={() => scrollToSection('download')}
            className="px-6 py-2.5 rounded-full bg-primary text-white font-bold text-sm shadow-[0_10px_20px_rgba(124,58,237,0.3)] hover:scale-105 active:scale-95 transition-all"
        >
            Get Started
        </button>
      </nav>

      {/* Hero Section with Animated Background */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        
        {/* Animated Poster Grid Background */}
        <div className="absolute inset-0 -z-10 opacity-20 perspective-[1000px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0814] via-transparent to-[#0a0814] z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0814] via-transparent to-[#0a0814] z-10" />
            
            <motion.div 
                animate={{ 
                    y: [0, -1000],
                }}
                transition={{ 
                    duration: 40, 
                    repeat: Infinity, 
                    ease: "linear" 
                }}
                className="grid grid-cols-2 md:grid-cols-5 gap-4 w-[120%] -ml-[10%] pt-20"
            >
                {[...trendingMovies, ...trendingMovies, ...trendingMovies].map((movie, i) => (
                    <div key={i} className="aspect-[2/3] relative rounded-2xl overflow-hidden glass-panel border-white/5">
                        {movie.poster_path && (
                            <Image 
                                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                alt={movie.title || "Movie"}
                                fill
                                className="object-cover"
                                sizes="20vw"
                            />
                        )}
                    </div>
                ))}
            </motion.div>
        </div>

        <motion.div
           style={{ opacity, scale }}
           className="max-w-5xl z-20"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8"
            >
                <Zap size={14} /> New Version 0.1.6 Available
            </motion.div>

            <h1 className="text-6xl md:text-[100px] font-black tracking-tight leading-[0.9] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                STREAMS UNINTERRUPTED. <br/>
                <span className="text-primary italic">EXPERIENCE REDEFINED.</span>
            </h1>

            <p className="text-lg md:text-2xl text-white/50 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                The most beautiful way to watch your favorite content. Cross-platform, private, and powered by the community.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <button 
                    onClick={() => scrollToSection('download')}
                    className="w-full md:w-auto px-10 py-5 rounded-2xl bg-primary text-white font-black text-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(124,58,237,0.4)]"
                >
                    <Download size={24} />
                    Download Free
                </button>
                <button 
                  onClick={() => scrollToSection('features')}
                  className="w-full md:w-auto px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                >
                    Explore Features
                </button>
            </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/20 cursor-pointer"
            onClick={() => scrollToSection('features')}
        >
            <div className="w-6 h-10 rounded-full border-2 border-current flex justify-center pt-2">
                <div className="w-1 h-2 bg-current rounded-full" />
            </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
                <h2 className="text-4xl md:text-6xl font-black mb-6 italic tracking-tighter uppercase">Why FlixView?</h2>
                <div className="h-1.5 w-24 bg-primary mx-auto rounded-full shadow-[0_0_15px_rgba(124,58,237,0.8)]" />
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {[
                    {
                        icon: <ShieldCheck size={32} className="text-green-400" />,
                        title: "Ad-Free Forever",
                        desc: "Say goodbye to intrusive popups and annoying redirects. Our internal engine blocks ads at the network level for a clean experience."
                    },
                    {
                        icon: <Monitor size={32} className="text-blue-400" />,
                        title: "Native Performance",
                        desc: "Experience ultra-smooth navigation and high-quality playback with our hardware-accelerated desktop applications."
                    },
                    {
                        icon: <Layout size={32} className="text-purple-400" />,
                        title: "Ultimate UI",
                        desc: "A stunning glassmorphic design that adapts to your screen. Night-mode by default, because your eyes deserve the best."
                    },
                    {
                        icon: <Globe size={32} className="text-orange-400" />,
                        title: "Multi-Source",
                        desc: "Access a vast library of content from multiple reliable sources, ensuring you always find what you're looking for."
                    },
                    {
                        icon: <Zap size={32} className="text-yellow-400" />,
                        title: "Auto Updates",
                        desc: "Never miss a feature. Our intelligent update system keeps your app fresh with the latest improvements in one click."
                    },
                    {
                        icon: <Play size={32} className="text-red-400" />,
                        title: "Smart Progress",
                        desc: "Resume exactly where you left off. FlixView tracks your progress locally across all your favorite movies and shows."
                    }
                ].map((feature, i) => (
                    <motion.div 
                        key={i}
                        whileHover={{ y: -10 }}
                        className="p-10 rounded-3xl glass-panel border-white/5 flex flex-col items-start gap-4 transition-all hover:bg-white/5 group"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            {feature.icon}
                        </div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter">{feature.title}</h3>
                        <p className="text-white/50 leading-relaxed font-medium">{feature.desc}</p>
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-40 px-6 relative bg-gradient-to-b from-transparent to-primary/5">
        <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase italic">Ready to watch?</h2>
            <p className="text-xl text-white/50 mb-16 max-w-2xl mx-auto font-medium">Download FlixView for your device and start streaming today.</p>

            <div className="grid md:grid-cols-3 gap-6">
                {[
                    { name: 'Windows', icon: '/icons/windows.png', link: downloadLinks.windows, sub: 'Installer (.exe)' },
                    { name: 'macOS', icon: '/icons/macos.png', link: downloadLinks.macos, sub: 'Apple Silicon (.dmg)' },
                    { name: 'Linux', icon: '/icons/linux.png', link: downloadLinks.linux, sub: 'AppImage (.AppImage)' }
                ].map((os, i) => (
                    <a 
                        key={i} 
                        href={os.link}
                        className="p-8 rounded-3xl glass-panel border-white/5 flex flex-col items-center gap-6 hover:bg-white/10 hover:border-primary/30 hover:scale-105 active:scale-95 transition-all group"
                    >
                        <div className="w-20 h-20 relative">
                            <Image src={os.icon} alt={os.name} fill className="object-contain grayscale group-hover:grayscale-0 transition-all opacity-40 group-hover:opacity-100" />
                        </div>
                        <div>
                            <div className="text-xl font-black uppercase italic">{os.name}</div>
                            <div className="text-xs text-white/30 font-bold tracking-widest mt-1 uppercase">{os.sub}</div>
                        </div>
                        <div className="mt-2 w-full py-4 rounded-xl bg-white/5 font-bold group-hover:bg-primary group-hover:text-white transition-all">
                            Download Now
                        </div>
                    </a>
                ))}
            </div>

            <div className="mt-24 flex items-center justify-center gap-8 opacity-40 hover:opacity-100 transition-opacity">
                <a href="#" className="flex items-center gap-2 font-bold group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#229ED9]/20 group-hover:text-[#229ED9] transition-all">
                        <Image src="/icons/telegram.png" alt="Telegram" width={24} height={24} />
                    </div>
                    Join Telegram
                </a>
                <div className="w-[1px] h-6 bg-white/10" />
                <a href="#" className="flex items-center gap-2 font-bold group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#5865F2]/20 group-hover:text-[#5865F2] transition-all">
                        <Image src="/icons/discord.png" alt="Discord" width={24} height={24} />
                    </div>
                    Discord Community
                </a>
            </div>
        </div>
      </section>

      {/* Footer (Unchanged structure, polished styles) */}
      <footer className="py-20 px-6 border-t border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-baseline justify-between gap-12">
            <div className="max-w-sm">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                        <Image src="/icon.png" alt="Logo" width={24} height={24} />
                    </div>
                    <span className="text-xl font-black tracking-tighter uppercase italic">FlixView</span>
                </div>
                <p className="text-white/40 text-sm leading-relaxed font-medium">
                    Built for the cinephiles, the binge-watchers, and everyone in between. FlixView is your companion for the ultimate entertainment experience.
                </p>
            </div>

            <div className="flex flex-col items-end gap-6">
                <div className="flex gap-4">
                    <a href="#" className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary border border-white/5 transition-all">
                        <Image src="/icons/telegram.png" alt="Telegram" width={20} height={20} />
                    </a>
                    <a href="#" className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary border border-white/5 transition-all">
                        <Image src="/icons/discord.png" alt="Discord" width={20} height={20} />
                    </a>
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10">
                    © 2026 FLIXVIEW PROJECT • BY JUMAKRK
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
