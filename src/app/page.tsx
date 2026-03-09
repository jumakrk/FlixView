'use client';

import { useEffect, useState } from 'react';
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
  Play,
  Menu,
  X
} from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { fetchTrending, Movie } from '@/lib/tmdb';

export default function LandingPage() {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0814] text-white selection:bg-primary/30 selection:text-white font-sans overflow-x-hidden">
      
      {/* Premium Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-4 md:px-6 py-4 md:py-5 flex items-center justify-between glass-panel border-none bg-black/10 backdrop-blur-2xl">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-[#7c3aed] to-[#a855f7] rounded-full flex items-center justify-center text-white shadow-[0_4px_15px_rgba(124,58,237,0.4)] pl-[2px] transition-transform group-hover:scale-110">
                <Play size={16} md:size={18} fill="currentColor" />
            </div>
            <span className="text-lg md:text-xl font-extrabold tracking-tight text-white uppercase">FLIXVIEW</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
            <button onClick={() => scrollToSection('features')} className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollToSection('download')} className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors">Download</button>
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[90] bg-[#0a0814] pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-8 text-center">
              <button onClick={() => scrollToSection('features')} className="text-2xl font-black uppercase tracking-[0.1em] text-white/50 hover:text-white transition-colors">Features</button>
              <button onClick={() => scrollToSection('download')} className="text-2xl font-black uppercase tracking-[0.1em] text-white/50 hover:text-white transition-colors">Download</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section with Animated Background */}
      <section className="relative min-h-[100vh] md:min-h-screen flex flex-col items-center justify-center text-center px-4 md:px-6 overflow-hidden pt-20">
        
        {/* Animated Poster Grid Background */}
        <div className="absolute inset-0 -z-10 opacity-15 md:opacity-20 perspective-[1000px] overflow-hidden">
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
                className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 w-[110%] md:w-[120%] -ml-[5%] md:-ml-[10%] pt-20"
            >
                {[...trendingMovies, ...trendingMovies, ...trendingMovies].map((movie, i) => (
                    <div key={i} className="aspect-[2/3] relative rounded-xl md:rounded-2xl overflow-hidden glass-panel border-white/5">
                        {movie.poster_path && (
                            <Image 
                                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                alt={movie.title || "Movie"}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, 20vw"
                                unoptimized
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
                className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest mb-6 md:mb-8"
            >
                <Zap size={14} /> New Version 0.1.6 Available
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[100px] font-black tracking-tight leading-[1.1] md:leading-[0.9] mb-6 md:mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                STREAMS UNINTERRUPTED. <br className="hidden sm:block" />
                <span className="text-primary italic">EXPERIENCE REDEFINED.</span>
            </h1>

            <p className="text-base md:text-2xl text-white/50 mb-8 md:mb-12 max-w-2xl mx-auto font-medium leading-relaxed px-4">
                The most beautiful way to watch your favorite content. Cross-platform, private, and powered by the community.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 px-4">
                <button 
                    onClick={() => scrollToSection('download')}
                    className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-2xl bg-primary text-white font-black text-lg md:text-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(124,58,237,0.4)]"
                >
                    <Download size={24} />
                    Download Free
                </button>
                <button 
                  onClick={() => scrollToSection('features')}
                  className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-lg md:text-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                >
                    Explore Features
                </button>
            </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 text-white/20 cursor-pointer hidden md:block"
            onClick={() => scrollToSection('features')}
        >
            <div className="w-6 h-10 rounded-full border-2 border-current flex justify-center pt-2">
                <div className="w-1 h-2 bg-current rounded-full" />
            </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 px-4 md:px-6 relative">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 md:mb-24">
                <h2 className="text-3xl md:text-6xl font-black mb-4 md:mb-6 italic tracking-tighter uppercase">Why FlixView?</h2>
                <div className="h-1.5 w-16 md:w-24 bg-primary mx-auto rounded-full shadow-[0_0_15px_rgba(124,58,237,0.8)]" />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
                        className="p-8 md:p-10 rounded-3xl glass-panel border-white/5 flex flex-col items-start gap-4 transition-all hover:bg-white/5 group"
                    >
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            {feature.icon}
                        </div>
                        <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter">{feature.title}</h3>
                        <p className="text-white/50 leading-relaxed font-medium text-sm md:text-base">{feature.desc}</p>
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-24 md:py-40 px-4 md:px-6 relative bg-gradient-to-b from-transparent to-primary/5">
        <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-4xl md:text-7xl font-black mb-4 md:mb-6 tracking-tighter uppercase italic">Ready to watch?</h2>
            <p className="text-lg md:text-xl text-white/50 mb-12 md:mb-16 max-w-2xl mx-auto font-medium">Download FlixView for your device and start streaming today.</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[
                    { name: 'Windows', icon: '/icons/windows.png', link: downloadLinks.windows, sub: 'Installer (.exe)' },
                    { name: 'macOS', icon: '/icons/macos.png', link: downloadLinks.macos, sub: 'Apple Silicon (.dmg)' },
                    { name: 'Linux', icon: '/icons/linux.png', link: downloadLinks.linux, sub: 'AppImage (.AppImage)' }
                ].map((os, i) => (
                    <a 
                        key={i} 
                        href={os.link}
                        className="p-6 md:p-8 rounded-3xl glass-panel border-white/5 flex flex-col items-center gap-4 md:gap-6 hover:bg-white/10 hover:border-primary/30 hover:scale-105 active:scale-95 transition-all group"
                    >
                        <div className="w-16 h-16 md:w-20 md:h-20 relative">
                            <Image src={os.icon} alt={os.name} fill className="object-contain grayscale group-hover:grayscale-0 transition-all opacity-40 group-hover:opacity-100 unoptimized" unoptimized />
                        </div>
                        <div>
                            <div className="text-lg md:text-xl font-black uppercase italic">{os.name}</div>
                            <div className="text-[10px] md:text-xs text-white/30 font-bold tracking-widest mt-1 uppercase">{os.sub}</div>
                        </div>
                        <div className="mt-2 w-full py-3 md:py-4 rounded-xl bg-white/5 font-bold group-hover:bg-primary group-hover:text-white transition-all text-sm md:text-base">
                            Download Now
                        </div>
                    </a>
                ))}
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 md:py-20 px-6 border-t border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-baseline justify-between gap-10 md:gap-12">
            <div className="max-w-sm text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                    <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-[#7c3aed] to-[#a855f7] rounded-full flex items-center justify-center text-white shadow-[0_4px_15px_rgba(124,58,237,0.4)] pl-[2px]">
                        <Play size={16} md:size={18} fill="currentColor" />
                    </div>
                    <span className="text-lg md:text-xl font-extrabold tracking-tight text-white uppercase">FLIXVIEW</span>
                </div>
                <p className="text-white/40 text-sm leading-relaxed font-medium">
                    Built for the cinephiles, the binge-watchers, and everyone in between. FlixView is your companion for the ultimate entertainment experience.
                </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-6">
                <div className="flex gap-4">
                    <a href="#" className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary border border-white/5 transition-all">
                        <Image src="/icons/telegram.png" alt="Telegram" width={20} height={20} unoptimized />
                    </a>
                    <a href="#" className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary border border-white/5 transition-all">
                        <Image src="/icons/discord.png" alt="Discord" width={20} height={20} unoptimized />
                    </a>
                </div>
                <div className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white/10 text-center">
                    © 2026 FLIXVIEW PROJECT • BY JUMAKRK
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
