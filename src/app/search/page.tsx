'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Film, LayoutGrid, Search, SearchX, Tv } from 'lucide-react';
import { Movie } from '@/lib/tmdb';
import { searchEverything } from '@/lib/search';
import MovieCard from '@/components/MovieCard';
import AnimeIcon from '@/components/AnimeIcon';
import PageHeader from '@/components/ui/PageHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { openCommandPalette } from '@/components/CommandPalette';

const EASE = [0.16, 1, 0.3, 1] as const;

type Kind = 'all' | 'movie' | 'tv' | 'anime';

/**
 * Full results for a search made in the search palette (its "See all
 * results" row). There is no second search box here: "Search again" reopens
 * the palette with the same words.
 */
export default function SearchResultsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen" />}>
            <SearchResults />
        </Suspense>
    );
}

function SearchResults() {
    const query = (useSearchParams().get('q') ?? '').trim();
    const [found, setFound] = useState<{ query: string; movies: Movie[]; anime: Movie[] } | null>(null);
    const [kind, setKind] = useState<Kind>('all');

    useEffect(() => {
        if (!query) return;
        let cancelled = false;
        searchEverything(query)
            .then(({ movies, anime }) => { if (!cancelled) setFound({ query, movies, anime }); })
            .catch(() => { if (!cancelled) setFound({ query, movies: [], anime: [] }); });
        return () => { cancelled = true; };
    }, [query]);

    // Results belong to the query they were fetched for; anything else is loading.
    const current = found && found.query === query ? found : null;
    const loading = Boolean(query) && !current;

    const groups = useMemo(() => {
        const movies = current?.movies.filter(m => m.media_type !== 'tv') ?? [];
        const series = current?.movies.filter(m => m.media_type === 'tv') ?? [];
        const anime = current?.anime ?? [];
        return { movie: movies, tv: series, anime, all: [...(current?.movies ?? []), ...anime] };
    }, [current]);

    const visible = groups[kind];
    const total = groups.all.length;

    const kinds = [
        { value: 'all' as const, label: `All ${total}`, icon: <LayoutGrid size={14} /> },
        { value: 'movie' as const, label: `Movies ${groups.movie.length}`, icon: <Film size={14} /> },
        { value: 'tv' as const, label: `Series ${groups.tv.length}`, icon: <Tv size={14} /> },
        { value: 'anime' as const, label: `Anime ${groups.anime.length}`, icon: <AnimeIcon size={14} /> },
    ];

    const searchAgain = (
        <button
            type="button"
            data-ripple
            onClick={() => openCommandPalette(query)}
            className="relative flex items-center gap-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white/85 transition-colors hover:bg-white/[0.1] hover:text-white"
        >
            <Search size={16} />
            {query ? 'Search again' : 'Open search'}
            <kbd className="ml-1 rounded-md border border-white/15 px-1.5 text-[11px] text-white/45">Ctrl K</kbd>
        </button>
    );

    if (!query) {
        return (
            <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-[4%] text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-to-b from-[#0d6b61] to-[#004741] text-[#f0ede4] shadow-[0_24px_60px_-18px_rgba(0,71,65,0.95)]">
                    <Search size={34} />
                </span>
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gradient">Search FlixView</h1>
                    <p className="mt-2 text-white/55">Find movies, series and anime from anywhere with Ctrl K.</p>
                </div>
                {searchAgain}
            </div>
        );
    }

    return (
        <div className="relative min-h-screen pb-24">
            <div className="pointer-events-none absolute -left-32 -top-24 h-[380px] w-[380px] rounded-full bg-[#004741]/40 blur-[110px]" />

            <PageHeader
                className="relative"
                eyebrow="Search results"
                title={`“${query}”`}
                subtitle={loading ? 'Searching movies, series and anime...' : `${total} ${total === 1 ? 'title' : 'titles'} across movies, series and anime.`}
                icon={<Search size={26} />}
            >
                {searchAgain}
            </PageHeader>

            {!loading && total > 0 && (
                <motion.div
                    className="relative mx-[4%] mb-8"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
                >
                    <SegmentedControl id="search-kind" size="sm" options={kinds} value={kind} onChange={setKind} />
                </motion.div>
            )}

            <div className="relative px-[4%]">
                {loading ? (
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {Array.from({ length: 12 }).map((_, index) => (
                            <div key={index} className="aspect-[2/3] rounded-2xl skeleton" />
                        ))}
                    </div>
                ) : total === 0 ? (
                    <div className="flex flex-col items-center py-24 text-center">
                        <SearchX size={44} className="text-white/25" />
                        <h2 className="mt-5 text-2xl font-bold text-white">No matches</h2>
                        <p className="mt-2 max-w-md text-white/55">Nothing matched &ldquo;{query}&rdquo;. Check the spelling or try fewer words.</p>
                    </div>
                ) : (
                    <motion.div layout className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {visible.map((movie, index) => (
                                <motion.div
                                    key={`${movie.media_type}-${movie.id}`}
                                    layout
                                    initial={{ opacity: 0, y: 24, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE, delay: Math.min(index, 12) * 0.03 } }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
                                >
                                    <MovieCard movie={movie} fullWidth />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
                {!loading && total > 0 && visible.length === 0 && (
                    <p className="py-16 text-center text-white/45">No {kind === 'tv' ? 'series' : kind === 'anime' ? 'anime' : 'movies'} in these results.</p>
                )}
            </div>
        </div>
    );
}
