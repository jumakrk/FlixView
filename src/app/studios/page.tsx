'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Movie, fetchBrandContent } from '@/lib/tmdb';
import MovieCard from '@/components/MovieCard';
import BrandLogo from '@/components/BrandLogo';
import { ChevronLeft, Loader2, ArrowUpDown, Filter } from 'lucide-react';

const MOVIE_GENRES = [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Science Fiction' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
    { id: 37, name: 'Western' }
];

const TV_GENRES = [
    { id: 10759, name: 'Action & Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 10762, name: 'Kids' },
    { id: 9648, name: 'Mystery' },
    { id: 10763, name: 'News' },
    { id: 10764, name: 'Reality' },
    { id: 10765, name: 'Sci-Fi & Fantasy' },
    { id: 10766, name: 'Soap' },
    { id: 10767, name: 'Talk' },
    { id: 10768, name: 'War & Politics' },
    { id: 37, name: 'Western' }
];

const SORT_OPTIONS = [
    { value: 'popularity.desc', label: 'Most Popular' },
    { value: 'vote_average.desc', label: 'Top Rated' },
    { value: 'primary_release_date.desc', label: 'Newest' },
    { value: 'popularity.asc', label: 'Least Popular' }
];

// Brand-specific glow mappings
const getBrandGlow = (id: string) => {
    switch (id) {
        case 'netflix': return 'rgba(229, 9, 20, 0.5)';
        case 'disney': return 'rgba(0, 210, 255, 0.5)';
        case 'apple-tv': return 'rgba(255, 255, 255, 0.3)';
        case 'prime-video': return 'rgba(0, 168, 225, 0.5)';
        case 'hulu': return 'rgba(28, 231, 131, 0.5)';
        case 'hbo': return 'rgba(167, 139, 250, 0.5)';
        case 'paramount-plus': return 'rgba(0, 100, 255, 0.5)';
        case 'marvel': return 'rgba(229, 9, 20, 0.5)';
        case 'dc': return 'rgba(0, 75, 255, 0.5)';
        case 'warner-bros': return 'rgba(255, 215, 0, 0.4)';
        case 'pixar': return 'rgba(59, 130, 246, 0.4)';
        case 'disney-pictures': return 'rgba(255, 255, 255, 0.25)';
        case 'universal': return 'rgba(255, 255, 255, 0.25)';
        case 'sony-pictures': return 'rgba(212, 175, 55, 0.4)';
        case 'columbia': return 'rgba(255, 215, 0, 0.4)';
        case 'dreamworks': return 'rgba(255, 255, 255, 0.25)';
        case 'mgm': return 'rgba(212, 175, 55, 0.4)';
        case 'lionsgate': return 'rgba(200, 160, 40, 0.4)';
        case 'a24': return 'rgba(255, 255, 255, 0.25)';
        case 'new-line': return 'rgba(180, 180, 255, 0.4)';
        case 'lucasfilm': return 'rgba(0, 255, 100, 0.35)';
        case 'searchlight': return 'rgba(255, 215, 0, 0.4)';
        default: return 'rgba(124, 58, 237, 0.4)';
    }
};

function StudioDiscoveryContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const brandId = Number(searchParams.get('id'));
    const brandType = searchParams.get('type') as 'company' | 'network';
    const brandName = searchParams.get('name') || '';
    const logoId = searchParams.get('logoId') || '';
    const providerId = Number(searchParams.get('providerId')) || undefined;

    const queryId = brandType === 'network' && providerId ? providerId : brandId;

    const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
    const [content, setContent] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedGenre, setSelectedGenre] = useState<number | undefined>(undefined);
    const [sortBy, setSortBy] = useState<string>('popularity.desc');

    const genres = mediaType === 'movie' ? MOVIE_GENRES : TV_GENRES;

    const loadContent = useCallback(async (pageNum: number, isNewFetch: boolean) => {
        if (!queryId || !brandType) return;
        
        if (isNewFetch) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const targetId = brandType === 'network' 
                ? (mediaType === 'tv' ? brandId : (providerId || brandId))
                : brandId;

            const results = await fetchBrandContent(brandType, targetId, mediaType, pageNum, selectedGenre, sortBy);
            
            if (isNewFetch) {
                setContent(results);
                setHasMore(results.length > 0);
            } else {
                setContent(prev => [...prev, ...results]);
                setHasMore(results.length > 0);
            }
        } catch (error) {
            console.error('Error fetching studio content:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [brandId, brandType, queryId, mediaType, selectedGenre, sortBy, providerId]);

    // Load initial content on filter change
    useEffect(() => {
        setPage(1);
        loadContent(1, true);
    }, [mediaType, selectedGenre, sortBy, loadContent]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadContent(nextPage, false);
    };

    return (
        <div 
            className="min-h-screen pb-24 text-white font-sans antialiased bg-[#0a0814] transition-all duration-700"
            style={{
                backgroundImage: `radial-gradient(circle at 5% 15%, ${getBrandGlow(logoId)} 0%, transparent 35%)`
            }}
        >
            <div className="max-w-[1600px] mx-auto px-6 md:px-12 pt-8">
                
                {/* BACK BUTTON ROW */}
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full text-xs font-black tracking-wider uppercase transition-all duration-300 active:scale-95 group shadow-md"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform text-violet-400" />
                        <span>Back</span>
                    </button>
                    
                    <span className="text-xs font-bold text-gray-500 tracking-[0.2em] uppercase select-none">
                        Brand Discovery
                    </span>
                </div>

                {/* TWO-COLUMN SIDEBAR INTERFACE */}
                <div className="flex flex-col lg:flex-row gap-10 items-start">
                    
                    {/* LEFT STICKY CONTROL SIDEBAR */}
                    <aside className="w-full lg:w-[360px] shrink-0 lg:sticky lg:top-8 flex flex-col gap-6">
                        
                        {/* BRAND SHOWCASE CONTAINER */}
                        <div className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl p-6.5 shadow-2xl relative overflow-hidden">
                            {/* Inner ambient glow splash */}
                            <div 
                                className="absolute -right-16 -top-16 w-36 h-36 rounded-full blur-[40px] opacity-[0.25] pointer-events-none"
                                style={{ backgroundColor: getBrandGlow(logoId) }}
                            />
                            
                            <div className="flex items-center gap-5.5">
                                {/* Glassmorphic brand logo box */}
                                <div 
                                    className="w-22 h-22 rounded-2xl bg-gradient-to-br from-white/10 to-white/2 border border-white/10 flex items-center justify-center p-3.5 backdrop-blur-md shadow-lg"
                                    style={{ boxShadow: `0 10px 30px -8px ${getBrandGlow(logoId)}` }}
                                >
                                    <BrandLogo brandId={logoId} className="w-full h-full object-contain select-none" />
                                </div>
                                
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase tracking-[0.22em] font-extrabold text-violet-400 mb-1 select-none">
                                        {brandType === 'company' ? 'Production Studio' : 'Streaming Network'}
                                    </span>
                                    <h1 
                                        className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none"
                                        style={{ textShadow: `0 0 25px ${getBrandGlow(logoId)}` }}
                                    >
                                        {brandName}
                                    </h1>
                                </div>
                            </div>
                            
                            <p className="text-gray-400 text-xs md:text-sm leading-relaxed mt-5 font-medium border-t border-white/5 pt-4.5">
                                Explore a curated library of high-fidelity releases produced, distributed, or hosted by {brandName}. Use the controls below to navigate.
                            </p>
                        </div>

                        {/* DASHBOARD CONTROLS */}
                        <div className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl p-6.5 shadow-2xl flex flex-col gap-6">
                            
                            {/* MEDIA TYPE SWITCHER */}
                            <div className="flex flex-col gap-2.5">
                                <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 select-none">Catalog Category</label>
                                <div className="grid grid-cols-2 bg-white/5 p-1 rounded-xl border border-white/10 shadow-inner">
                                    <button
                                        onClick={() => {
                                            setMediaType('movie');
                                            setSelectedGenre(undefined);
                                        }}
                                        className={`py-3.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${mediaType === 'movie' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Movies
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMediaType('tv');
                                            setSelectedGenre(undefined);
                                        }}
                                        className={`py-3.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${mediaType === 'tv' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Series
                                    </button>
                                </div>
                            </div>

                            {/* SORT SELECTOR */}
                            <div className="flex flex-col gap-2.5">
                                <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 select-none">Sort Order</label>
                                <div className="flex items-center gap-3.5 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-xl px-4 py-3.5 transition-all duration-300 focus-within:border-violet-500/50">
                                    <ArrowUpDown size={15} className="text-violet-400 shrink-0" />
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer pr-4 hover:text-violet-300 transition-colors w-full"
                                    >
                                        {SORT_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value} className="bg-[#0a0814] text-white">
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* GENRE GRID DOCK (TABS) */}
                            <div className="flex flex-col gap-2.5">
                                <label className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 select-none">Filter by Genre</label>
                                <div className="flex flex-wrap gap-2 max-h-[220px] lg:max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                    <button
                                        onClick={() => setSelectedGenre(undefined)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${selectedGenre === undefined ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20 border border-violet-500/30' : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'}`}
                                    >
                                        All Genres
                                    </button>
                                    {genres.map(genre => (
                                        <button
                                            key={genre.id}
                                            onClick={() => setSelectedGenre(genre.id)}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${selectedGenre === genre.id ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20 border border-violet-500/30' : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'}`}
                                        >
                                            {genre.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </aside>

                    {/* RIGHT MAIN CATALOG VIEW */}
                    <main className="flex-1 w-full">
                        
                        {/* CATALOG DESCRIPTION BAR */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-8">
                            <h2 className="text-lg font-black uppercase tracking-wider flex items-center gap-2">
                                <span>{mediaType === 'movie' ? 'Movies' : 'TV Series'}</span>
                                <span className="text-xs text-gray-500 font-bold bg-white/5 px-2.5 py-1 rounded-full">
                                    {selectedGenre ? genres.find(g => g.id === selectedGenre)?.name : 'All Library'}
                                </span>
                            </h2>
                            
                            {!loading && content.length > 0 && (
                                <span className="text-xs text-gray-400 font-extrabold tracking-wide">
                                    {content.length}+ Matches
                                </span>
                            )}
                        </div>

                        {/* CONTENT GRID */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-44 gap-5">
                                <Loader2 className="animate-spin text-violet-500" size={44} />
                                <p className="text-gray-400 text-sm font-black animate-pulse tracking-wide uppercase">Cataloging brand releases...</p>
                            </div>
                        ) : content.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-44 text-center">
                                <span className="text-5xl mb-5 filter drop-shadow-md">🔍</span>
                                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Empty Selection</h3>
                                <p className="text-gray-400 text-sm max-w-sm font-medium leading-relaxed">
                                    No {mediaType === 'movie' ? 'movies' : 'series'} match the filter criteria under this brand.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-6 w-full">
                                    {content.map((item) => (
                                        <MovieCard key={`${item.id}-${Math.random()}`} movie={item} fullWidth className="transition-transform duration-300 hover:scale-[1.03]" />
                                    ))}
                                </div>

                                {/* Pagination Button */}
                                {hasMore && (
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        className="mt-14 px-8 py-3.5 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-white/20 rounded-xl text-white text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center gap-3 disabled:opacity-50 shadow-md"
                                    >
                                        {loadingMore ? (
                                            <>
                                                <Loader2 size={15} className="animate-spin text-violet-400" />
                                                <span>Loading titles...</span>
                                            </>
                                        ) : (
                                            <span>Load More Releases</span>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </main>

                </div>
            </div>
        </div>
    );
}

export default function StudioDiscoveryPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0a0814] flex items-center justify-center">
                <Loader2 className="animate-spin text-violet-500" size={40} />
            </div>
        }>
            <StudioDiscoveryContent />
        </Suspense>
    );
}
