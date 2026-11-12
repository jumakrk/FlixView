'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Clock3, Film, Flame, Info, LayoutGrid, Star, Tv } from 'lucide-react';
import { fetchTrending, Movie } from '@/lib/tmdb';
import MovieCard from '@/components/MovieCard';
import PlayButton from '@/components/PlayButton';
import PageHeader from '@/components/ui/PageHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { Reveal } from '@/components/ui/Reveal';
import { cn } from '@/lib/utils';

type Window = 'day' | 'week';
type Kind = 'all' | 'movie' | 'tv';

const WINDOWS = [
    { value: 'day' as const, label: 'Today', icon: <Clock3 size={15} /> },
    { value: 'week' as const, label: 'This week', icon: <CalendarDays size={15} /> },
];

const KINDS = [
    { value: 'all' as const, label: 'All', icon: <LayoutGrid size={15} /> },
    { value: 'movie' as const, label: 'Movies', icon: <Film size={15} /> },
    { value: 'tv' as const, label: 'Series', icon: <Tv size={15} /> },
];

const EASE = [0.16, 1, 0.3, 1] as const;
const BACKDROP = 'https://image.tmdb.org/t/p/w1280';

function year(item: Movie): string {
    const date = item.release_date || item.first_air_date;
    return date ? String(new Date(date).getFullYear()) : '';
}

function detailsHref(item: Movie): string {
    return `/details?type=${item.media_type === 'tv' ? 'series' : 'movie'}&id=${item.id}`;
}

/** Large backdrop card for the top three. */
function SpotlightCard({ item, rank, large }: { item: Movie; rank: number; large?: boolean }) {
    const type = item.media_type === 'tv' ? 'tv' : 'movie';
    return (
        <div className={cn(
            'group relative overflow-hidden rounded-[28px] ring-1 ring-white/[0.08]',
            large ? 'min-h-[440px]' : 'min-h-[208px]'
        )}>
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                style={{ backgroundImage: `url(${BACKDROP}${item.backdrop_path})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,11,10,0.97)] via-[rgba(4,11,10,0.45)] to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[rgba(4,11,10,0.7)] to-transparent" />

            <span
                className={cn(
                    'absolute right-5 top-2 font-extrabold leading-none text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.55)]',
                    large ? 'text-[150px]' : 'text-[84px]'
                )}
            >
                {rank}
            </span>

            <div className={cn('absolute inset-x-0 bottom-0 flex flex-col gap-3', large ? 'p-8' : 'p-5')}>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] shadow-[0_6px_20px_rgba(31,128,115,0.45)]">
                    <Flame size={12} /> #{rank} trending
                </span>
                <Link href={detailsHref(item)} className={cn('font-extrabold leading-tight tracking-tight hover:text-violet-200', large ? 'text-4xl' : 'text-xl')}>
                    {item.title || item.name}
                </Link>
                <div className="flex items-center gap-3 text-sm font-medium text-white/70">
                    <span className="flex items-center gap-1 font-bold text-amber-300">
                        <Star size={14} fill="currentColor" /> {(item.vote_average || 0).toFixed(1)}
                    </span>
                    <span>{year(item)}</span>
                    <span className="rounded-md border border-white/25 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider">
                        {type === 'tv' ? 'Series' : 'Movie'}
                    </span>
                </div>
                {large && (
                    <>
                        <p className="line-clamp-2 max-w-xl text-[15px] leading-relaxed text-white/70">{item.overview}</p>
                        <div className="mt-1 flex items-center gap-3">
                            <PlayButton
                                id={item.id}
                                type={type}
                                className="bg-white text-[#00332e] shadow-[0_10px_34px_rgba(255,255,255,0.22)] transition-transform hover:-translate-y-0.5 hover:scale-[1.03]"
                                releaseDate={item.release_date || item.first_air_date}
                            />
                            <Link
                                href={detailsHref(item)}
                                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 font-bold transition-colors hover:bg-white/20"
                            >
                                <Info size={19} /> More Info
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function TrendingClient({ initialDay }: { initialDay: Movie[] }) {
    const [window, setWindow] = useState<Window>('day');
    const [kind, setKind] = useState<Kind>('all');
    const [lists, setLists] = useState<Partial<Record<Window, Movie[]>>>({ day: initialDay });

    // "This week" is fetched the first time it is picked, then cached.
    useEffect(() => {
        if (lists[window]) return;
        let cancelled = false;
        fetchTrending(window)
            .then(items => { if (!cancelled) setLists(previous => ({ ...previous, [window]: items })); })
            .catch(() => { if (!cancelled) setLists(previous => ({ ...previous, [window]: [] })); });
        return () => { cancelled = true; };
    }, [window, lists]);

    // A window is loading until its list has arrived.
    const loading = !lists[window];

    const items = useMemo(() => (lists[window] ?? [])
        .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
        .filter(item => kind === 'all' || item.media_type === kind), [lists, window, kind]);

    const [first, second, third, ...rest] = items;
    const viewKey = `${window}-${kind}`;

    return (
        <div className="min-h-screen pb-20">
            <PageHeader
                eyebrow="Live chart"
                title="Trending Now"
                subtitle="What everyone is watching right now. Switch between today and this week, or focus on movies or series."
            >
                <div className="flex flex-wrap items-center gap-3">
                    <SegmentedControl id="trend-window" options={WINDOWS} value={window} onChange={setWindow} />
                    <SegmentedControl id="trend-kind" size="sm" options={KINDS} value={kind} onChange={setKind} />
                </div>
            </PageHeader>

            <div className="px-[4%]">
                {loading && items.length === 0 ? (
                    <div className="grid gap-5 lg:grid-cols-3">
                        <div className="skeleton min-h-[440px] rounded-[28px] lg:col-span-2" />
                        <div className="grid gap-5">
                            <div className="skeleton min-h-[208px] rounded-[28px]" />
                            <div className="skeleton min-h-[208px] rounded-[28px]" />
                        </div>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={viewKey}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.45, ease: EASE }}
                        >
                            {first && (
                                <div className="grid gap-5 lg:grid-cols-3">
                                    <div className="lg:col-span-2">
                                        <SpotlightCard item={first} rank={1} large />
                                    </div>
                                    <div className="grid gap-5">
                                        {second && <SpotlightCard item={second} rank={2} />}
                                        {third && <SpotlightCard item={third} rank={3} />}
                                    </div>
                                </div>
                            )}

                            {rest.length > 0 && (
                                <>
                                    <Reveal className="mb-6 mt-14 flex items-end justify-between">
                                        <h2 className="text-3xl font-bold text-gradient">The rest of the chart</h2>
                                        <span className="text-sm font-semibold text-white/45">{items.length} titles</span>
                                    </Reveal>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                                        {rest.map((item, index) => (
                                            <div key={`${item.media_type}-${item.id}`} className="relative pl-7">
                                                <span className="pointer-events-none absolute -bottom-3 left-0 z-20 text-[76px] font-extrabold leading-none text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.5)]">
                                                    {index + 4}
                                                </span>
                                                <MovieCard movie={item} fullWidth />
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {items.length === 0 && !loading && (
                                <p className="py-24 text-center text-white/50">Nothing trending here right now.</p>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
