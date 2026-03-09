import Link from 'next/link';
import { Home, Film, Ghost } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0b1e] text-white p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
                {/* glitched 404 container */}
                <div className="relative mb-8">
                    <h1 className="text-[10rem] font-black leading-none bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 animate-pulse">
                        404
                    </h1>
                    <div className="absolute -top-6 -right-6 animate-bounce delay-700">
                        <Ghost size={48} className="text-white/20 rotate-12" />
                    </div>
                </div>

                <h2 className="text-3xl font-bold mb-4">You've drifted into the void</h2>
                <p className="text-lg text-white/60 mb-10 max-w-sm">
                    The page you are looking for doesn't exist or has been moved to another dimension.
                </p>

                <Link
                    href="/"
                    className="group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                    <Home size={20} className="group-hover:-translate-y-1 transition-transform" />
                    <span>Return Home</span>
                </Link>

                <div className="mt-16 flex items-center gap-2 text-white/20 text-sm">
                    <Film size={16} />
                    <span>FlixView Error System</span>
                </div>
            </div>
        </div>
    );
}
