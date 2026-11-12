'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Clapperboard, Film, Flame, Loader2, MonitorPlay, Sparkles, Star, Tv } from 'lucide-react';
import { Movie, fetchBrandContent } from '@/lib/tmdb';
import { BRANDS, brandColor, findBrand } from '@/lib/brands';
import MovieCard from '@/components/MovieCard';
import BrandLogo from '@/components/BrandLogo';
import BrandTile from '@/components/BrandTile';
import InfiniteScroll from '@/components/InfiniteScroll';
import Glass from '@/components/ui/Glass';
import Rail from '@/components/ui/Rail';
import SegmentedControl from '@/components/ui/SegmentedControl';
import ChipRail from '@/components/ui/ChipRail';
import { Reveal } from '@/components/ui/Reveal';
import rowStyles from '@/components/SectionRow.module.css';

const MOVIE_GENRES = [
    { value: 28, label: 'Action' },
    { value: 12, label: 'Adventure' },
    { value: 16, label: 'Animation' },
    { value: 35, label: 'Comedy' },
    { value: 80, label: 'Crime' },
    { value: 99, label: 'Documentary' },
    { value: 18, label: 'Drama' },
    { value: 10751, label: 'Family' },
    { value: 14, label: 'Fantasy' },
    { value: 36, label: 'History' },
    { value: 27, label: 'Horror' },
    { value: 10402, label: 'Music' },
    { value: 9648, label: 'Mystery' },
    { value: 10749, label: 'Romance' },
    { value: 878, label: 'Science Fiction' },
    { value: 53, label: 'Thriller' },
    { value: 10752, label: 'War' },
    { value: 37, label: 'Western' }
];

const TV_GENRES = [
    { value: 10759, label: 'Action & Adventure' },
    { value: 16, label: 'Animation' },
    { value: 35, label: 'Comedy' },
    { value: 80, label: 'Crime' },
    { value: 99, label: 'Documentary' },
    { value: 18, label: 'Drama' },
    { value: 10751, label: 'Family' },
    { value: 10762, label: 'Kids' },
    { value: 9648, label: 'Mystery' },
    { value: 10763, label: 'News' },
    { value: 10764, label: 'Reality' },
    { value: 10765, label: 'Sci-Fi & Fantasy' },
    { value: 10766, label: 'Soap' },
    { value: 10767, label: 'Talk' },
    { value: 10768, label: 'War & Politics' },
    { value: 37, label: 'Western' }
];

type SortValue = 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc';

const SORTS = [
    { value: 'popularity.desc' as const, label: 'Popular', icon: <Flame size={15} /> },
    { value: 'vote_average.desc' as const, label: 'Top rated', icon: <Star size={15} /> },
    { value: 'primary_release_date.desc' as const, label: 'Newest', icon: <Sparkles size={15} /> },
];

const MEDIA = [
    { value: 'movie' as const, label: 'Movies', icon: <Film size={15} /> },
    { value: 'tv' as const, label: 'Series', icon: <Tv size={15} /> },
];

const EASE = [0.16, 1, 0.3, 1] as const;

function StudioDiscoveryContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const brandId = Number(searchParams.get('id'));
    const brandType = searchParams.get('type') as 'company' | 'network' | 'provider';
    const brandName = searchParams.get('name') || '';
    const logoId = searchParams.get('logoId') || '';
    const providerId = Number(searchParams.get('providerId')) || undefined;
    const brand = findBrand(logoId);

    const queryId = brandType === 'network' && providerId ? providerId : brandId;

    const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
    const [content, setContent] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<SortValue>('popularity.desc');

    const genres = mediaType === 'movie' ? MOVIE_GENRES : TV_GENRES;

    const loadContent = useCallback(async (pageNum: number, isNewFetch: boolean) => {
        if (!queryId || !brandType) return;

        if (isNewFetch) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const targetId = brandType === 'provider'
                ? (providerId || brandId)
                : brandType === 'network'
                    ? (mediaType === 'tv' ? brandId : (providerId || brandId))
                    : brandId;

            const results = await fetchBrandContent(brandType, targetId, mediaType, pageNum, selectedGenre ?? undefined, sortBy);

            if (isNewFetch) {
                setContent(results);
            } else {
                // Pages can overlap when popularity shifts between requests.
                setContent(prev => {
                    const seen = new Set(prev.map(item => item.id));
                    return [...prev, ...results.filter(item => !seen.has(item.id))];
                });
            }
            setHasMore(results.length > 0);
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

    const accent = brandColor(logoId);
    const accentSoft = brandColor(logoId, 0.35);
    const spotlight = content.find(item => item.backdrop_path)?.backdrop_path;
    const isStreaming = brand ? brand.group === 'streaming' : brandType !== 'company';
    const others = BRANDS.filter(other => other.id !== logoId && other.group === (isStreaming ? 'streaming' : 'studio'));

    return (
        <div className="min-h-screen pb-24 text-white" style={{ '--brand': accent, '--brand-soft': accentSoft } as React.CSSProperties}>
            {/* ---- Cinematic banner ---- */}
            <section className="relative -mt-[var(--titlebar-height)] overflow-hidden">
                <div className="absolute inset-0">
                    <AnimatePresence initial={false}>
                        {spotlight && (
                            <motion.div
                                key={spotlight}
                                className="absolute inset-0 bg-cover bg-[center_25%]"
                                style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w1280${spotlight})` }}
                                initial={{ opacity: 0, scale: 1.08 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.2, ease: EASE }}
                            />
                        )}
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-[rgba(4,11,10,0.82)] to-[rgba(4,11,10,0.35)]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-[rgba(4,11,10,0.5)]" />
                    <div
                        className="absolute -left-40 top-0 h-[520px] w-[720px] rounded-full opacity-60"
                        style={{ background: `radial-gradient(circle, ${accentSoft} 0%, transparent 65%)` }}
                    />
                </div>

                <div className="relative px-[4%] pb-14 pt-[calc(var(--titlebar-height)+28px)]">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="group mb-12 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:border-white/25 hover:text-white"
                    >
                        <ChevronLeft size={17} className="transition-transform group-hover:-translate-x-0.5" />
                        Back
                    </button>

                    <div className="flex flex-wrap items-end gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.8, ease: EASE }}
                        >
                            <Glass
                                preset="card"
                                className="flex h-40 w-[17rem] items-center justify-center rounded-[30px] p-8"
                                style={{ boxShadow: `0 24px 70px ${accentSoft}, inset 0 1px 1px rgba(255,255,255,0.4), inset 0 0 0 1px rgba(255,255,255,0.14)` }}
                            >
                                <BrandLogo brandId={logoId} />
                            </Glass>
                        </motion.div>

                        <motion.div
                            className="min-w-0 max-w-2xl pb-2"
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: EASE, delay: 0.08 }}
                        >
                            <span
                                className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]"
                                style={{ borderColor: accentSoft, background: brandColor(logoId, 0.16), color: '#fff' }}
                            >
                                {isStreaming ? <MonitorPlay size={13} /> : <Clapperboard size={13} />}
                                {isStreaming ? 'Streaming service' : 'Production studio'}
                            </span>
                            <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl">{brandName}</h1>
                            <p className="mt-4 text-[15.5px] leading-relaxed text-white/65">
                                {isStreaming
                                    ? `Everything streaming on ${brandName}, from the biggest hits to hidden gems.`
                                    : `Films and series from ${brandName}, from classics to the latest releases.`}
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ---- Sticky filter bar ---- */}
            <div className="sticky z-40 px-[4%] pb-6" style={{ top: 'calc(var(--titlebar-height) + 10px)' }}>
                {/* Near-opaque: posters scroll underneath, and a live blur here would be
                    recomputed on every scroll frame. */}
                <div className="glass-panel flex flex-col gap-3 rounded-3xl px-4 py-3" style={{ background: 'rgba(7, 17, 15, 0.97)' }}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <SegmentedControl
                            id="brand-media"
                            options={MEDIA}
                            value={mediaType}
                            onChange={(value) => {
                                setMediaType(value);
                                setSelectedGenre(null);
                            }}
                        />
                        <SegmentedControl id="brand-sort" size="sm" options={SORTS} value={sortBy} onChange={setSortBy} />
                    </div>
                    <ChipRail
                        id="brand-genre"
                        chips={genres}
                        value={selectedGenre}
                        onChange={setSelectedGenre}
                        allLabel="All genres"
                    />
                </div>
            </div>

            {/* ---- Catalogue ---- */}
            <div className="px-[4%]">
                {loading ? (
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                        {Array.from({ length: 12 }).map((_, index) => (
                            <div key={index} className="skeleton aspect-[2/3] rounded-2xl" />
                        ))}
                    </div>
                ) : content.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                            {mediaType === 'movie' ? <Film size={28} className="text-white/50" /> : <Tv size={28} className="text-white/50" />}
                        </div>
                        <h3 className="mb-2 text-xl font-bold">Nothing here yet</h3>
                        <p className="max-w-sm text-sm leading-relaxed text-white/55">
                            No {mediaType === 'movie' ? 'movies' : 'series'} from {brandName} match these filters. Try another genre or sort.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                            {content.map((item) => (
                                <MovieCard key={`${item.media_type}-${item.id}`} movie={item} fullWidth />
                            ))}
                        </div>
                        <InfiniteScroll
                            onLoadMore={handleLoadMore}
                            hasMore={hasMore}
                            loading={loading || loadingMore}
                            className="mt-6 w-full"
                        />
                    </>
                )}
            </div>

            {/* ---- Other brands ---- */}
            {others.length > 0 && (
                <section className="mt-16">
                    <Reveal className={rowStyles.header}>
                        <h2 className={rowStyles.title}>More to explore</h2>
                    </Reveal>
                    <Rail className="flex gap-4 overflow-x-auto px-[4%] pb-8 pt-5">
                        {others.map(other => <BrandTile key={other.id} brand={other} size="sm" />)}
                    </Rail>
                </section>
            )}
        </div>
    );
}

export default function StudioDiscoveryPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="animate-spin text-violet-500" size={40} />
            </div>
        }>
            <StudioDiscoveryContent />
        </Suspense>
    );
}
