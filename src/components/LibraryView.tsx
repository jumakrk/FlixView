'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownAZ, Bookmark, Clock, Compass, Film, Heart, LayoutGrid, Star, Tv, X } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { fetchDetails, Movie } from '@/lib/tmdb';
import { animeToMovie, fetchAnimeByIds } from '@/lib/anilist';
import type { MediaType } from '@/lib/types';
import MovieCard from '@/components/MovieCard';
import AnimeIcon from '@/components/AnimeIcon';
import PageHeader from '@/components/ui/PageHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;
const BACKDROP = 'https://image.tmdb.org/t/p/w1280';

type Kind = 'all' | MediaType;
type Sort = 'recent' | 'title' | 'rating';

const COPY = {
    watchlist: {
        title: 'My Watchlist',
        subtitle: 'Everything you saved to watch later.',
        icon: Bookmark,
        emptyTitle: 'Your watchlist is empty',
        emptyText: 'Tap the bookmark on any movie or series and it will wait for you here.',
        verb: 'Added',
        removeLabel: 'Remove from watchlist',
    },
    favorites: {
        title: 'My Favourites',
        subtitle: 'The ones you loved, all in one place.',
        icon: Heart,
        emptyTitle: 'No favourites yet',
        emptyText: 'Heart the titles you love to keep them close.',
        verb: 'Loved',
        removeLabel: 'Remove from favourites',
    },
} as const;

const SORTS = [
    { value: 'recent' as const, label: 'Recent', icon: <Clock size={14} /> },
    { value: 'title' as const, label: 'A-Z', icon: <ArrowDownAZ size={14} /> },
    { value: 'rating' as const, label: 'Top rated', icon: <Star size={14} /> },
];

const keyOf = (id: string | number, type: MediaType) => `${type}:${id}`;

function timeAgo(then: number, now: number) {
    const days = Math.floor((now - then) / 86_400_000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    const years = Math.floor(months / 12);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

/** Watchlist and Favourites: filter by type, sort, and remove in place. */
export default function LibraryView({ list }: { list: 'watchlist' | 'favorites' }) {
    const data = useData();
    const items = list === 'watchlist' ? data.watchlist : data.favorites;
    const remove = list === 'watchlist' ? data.removeFromWatchlist : data.removeFromFavorites;
    const copy = COPY[list];

    // Details are fetched once per title and kept, so removing or re-sorting
    // never reloads the whole page.
    const [details, setDetails] = useState<Record<string, Movie | null>>({});
    const [kind, setKind] = useState<Kind>('all');
    const [sort, setSort] = useState<Sort>('recent');
    const [now] = useState(() => Date.now());

    useEffect(() => {
        const missing = items.filter(item => !(keyOf(item.mediaId, item.mediaType) in details));
        if (missing.length === 0) return;
        let cancelled = false;

        (async () => {
            // Anime comes from AniList in one batched request (rate limits).
            const anime = missing.filter(item => item.mediaType === 'anime');
            const animeMedia = anime.length ? await fetchAnimeByIds(anime.map(item => item.mediaId)).catch(() => []) : [];
            const animeById = new Map(animeMedia.map(media => [String(media.id), animeToMovie(media)]));

            const entries = await Promise.all(missing.map(async item => {
                const key = keyOf(item.mediaId, item.mediaType);
                if (item.mediaType === 'anime') return [key, animeById.get(String(item.mediaId)) ?? null] as const;
                try {
                    const detail = await fetchDetails(item.mediaId, item.mediaType === 'tv' ? 'tv' : 'movie');
                    return [key, detail ? { ...detail, media_type: item.mediaType } : null] as const;
                } catch {
                    return [key, null] as const;
                }
            }));
            if (!cancelled) setDetails(prev => ({ ...prev, ...Object.fromEntries(entries) }));
        })();

        return () => { cancelled = true; };
    }, [items, details]);

    const loading = items.some(item => !(keyOf(item.mediaId, item.mediaType) in details));

    const rows = useMemo(() => items
        .map(item => ({ item, movie: details[keyOf(item.mediaId, item.mediaType)] }))
        .filter((row): row is { item: typeof row.item; movie: Movie } => Boolean(row.movie)), [items, details]);

    const counts = {
        all: rows.length,
        movie: rows.filter(r => r.item.mediaType === 'movie').length,
        tv: rows.filter(r => r.item.mediaType === 'tv').length,
        anime: rows.filter(r => r.item.mediaType === 'anime').length,
    };

    const visible = useMemo(() => {
        const filtered = rows.filter(r => kind === 'all' || r.item.mediaType === kind);
        const name = (m: Movie) => (m.title || m.name || '').toLowerCase();
        return filtered.sort((a, b) =>
            sort === 'title' ? name(a.movie).localeCompare(name(b.movie)) :
            sort === 'rating' ? (b.movie.vote_average || 0) - (a.movie.vote_average || 0) :
            (b.item.addedAt || 0) - (a.item.addedAt || 0)
        );
    }, [rows, kind, sort]);

    const kinds = [
        { value: 'all' as const, label: `All ${counts.all}`, icon: <LayoutGrid size={14} /> },
        { value: 'movie' as const, label: `Movies ${counts.movie}`, icon: <Film size={14} /> },
        { value: 'tv' as const, label: `Series ${counts.tv}`, icon: <Tv size={14} /> },
        ...(counts.anime > 0 ? [{ value: 'anime' as const, label: `Anime ${counts.anime}`, icon: <AnimeIcon size={14} /> }] : []),
    ];

    // The newest addition sets the mood at the top of the page.
    const spotlight = [...rows].sort((a, b) => (b.item.addedAt || 0) - (a.item.addedAt || 0)).find(r => r.movie.backdrop_path);
    const Icon = copy.icon;

    if (items.length === 0) return <EmptyState list={list} />;

    return (
        <div className="relative min-h-screen pb-24">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px] overflow-hidden">
                <AnimatePresence>
                    {spotlight && (
                        <motion.div
                            key={spotlight.movie.backdrop_path}
                            className="absolute inset-0 bg-cover bg-center [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_55%,transparent)]"
                            style={{ backgroundImage: `url(${BACKDROP}${spotlight.movie.backdrop_path})` }}
                            initial={{ opacity: 0, scale: 1.06 }}
                            animate={{ opacity: 0.3, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.4, ease: EASE }}
                        />
                    )}
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-b from-[#040b0a]/40 via-[#040b0a]/80 to-[#040b0a]" />
                <div className={cn('absolute -left-32 -top-20 h-[380px] w-[380px] rounded-full blur-[110px]', list === 'favorites' ? 'bg-[#7a2e35]/30' : 'bg-[#004741]/45')} />
            </div>

            <PageHeader
                className="relative"
                eyebrow={loading ? 'Loading' : `${rows.length} ${rows.length === 1 ? 'title' : 'titles'}`}
                title={copy.title}
                subtitle={copy.subtitle}
                icon={<Icon size={26} className={list === 'favorites' ? 'text-[#e9a8a0]' : undefined} fill={list === 'favorites' ? 'currentColor' : 'none'} />}
            />

            {/* Toolbar */}
            <motion.div
                className="relative mx-[4%] mb-8 flex flex-wrap items-center justify-between gap-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
            >
                <SegmentedControl id={`${list}-kind`} size="sm" options={kinds} value={kind} onChange={setKind} />
                <SegmentedControl id={`${list}-sort`} size="sm" options={SORTS} value={sort} onChange={setSort} />
            </motion.div>

            <div className="relative px-[4%]">
                {loading && rows.length === 0 ? (
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {items.slice(0, 12).map(item => (
                            <div key={keyOf(item.mediaId, item.mediaType)}>
                                <div className="aspect-[2/3] rounded-2xl skeleton" />
                                <div className="mt-3 h-3 w-2/3 rounded skeleton" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <motion.div layout className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {visible.map(({ item, movie }, index) => (
                                <motion.div
                                    key={keyOf(item.mediaId, item.mediaType)}
                                    layout
                                    initial={{ opacity: 0, y: 24, scale: 0.94 }}
                                    animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE, delay: Math.min(index, 12) * 0.03 } }}
                                    exit={{ opacity: 0, scale: 0.85, filter: 'blur(6px)', transition: { duration: 0.3 } }}
                                    className="group/lib"
                                >
                                    <MovieCard movie={movie} fullWidth />
                                    <div className="mt-2.5 flex items-center justify-between gap-2 px-1">
                                        <span className="truncate text-[12px] text-white/40">
                                            {item.addedAt ? `${copy.verb} ${timeAgo(item.addedAt, now)}` : ' '}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => remove(item.mediaId, item.mediaType)}
                                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/35 opacity-0 transition-all duration-300 hover:bg-white/[0.08] hover:text-white focus-visible:opacity-100 group-hover/lib:opacity-100"
                                            title={copy.removeLabel}
                                            aria-label={`${copy.removeLabel}: ${movie.title || movie.name}`}
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

                {!loading && visible.length === 0 && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center text-white/45">
                        Nothing here in this category yet.
                    </motion.p>
                )}
            </div>
        </div>
    );
}

function EmptyState({ list }: { list: 'watchlist' | 'favorites' }) {
    const copy = COPY[list];
    const Icon = copy.icon;
    return (
        <div className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-[4%] text-center">
            <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#004741]/40 blur-[120px]" />
            <motion.div
                className="relative flex h-24 w-24 items-center justify-center rounded-[30px] border border-[#f0ede4]/15 bg-gradient-to-b from-[#0d6b61] to-[#004741] text-[#f0ede4] shadow-[0_30px_70px_-20px_rgba(0,71,65,0.95),inset_0_1px_0_rgba(240,237,228,0.25)]"
                initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 16 }}
            >
                <motion.span
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <Icon size={40} fill={list === 'favorites' ? 'currentColor' : 'none'} />
                </motion.span>
            </motion.div>
            <motion.h1
                className="relative mt-8 text-4xl font-extrabold tracking-tight text-gradient md:text-5xl"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
            >
                {copy.emptyTitle}
            </motion.h1>
            <motion.p
                className="relative mt-3 max-w-md text-[15.5px] leading-relaxed text-white/55"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.18 }}
            >
                {copy.emptyText}
            </motion.p>
            <motion.div
                className="relative mt-9 flex flex-wrap justify-center gap-3"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.26 }}
            >
                <Link href="/trending" data-ripple className="relative flex items-center gap-2 overflow-hidden rounded-2xl bg-[#f0ede4] px-6 py-3.5 text-sm font-bold text-[#00332e] shadow-[0_12px_30px_-12px_rgba(240,237,228,0.5)] transition-transform duration-300 hover:-translate-y-0.5">
                    <Compass size={16} /> Explore trending
                </Link>
                <Link href="/movies" data-ripple className="relative flex items-center gap-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-3.5 text-sm font-semibold text-white/85 transition-colors hover:bg-white/[0.1]">
                    <Film size={16} /> Movies
                </Link>
                <Link href="/series" data-ripple className="relative flex items-center gap-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-3.5 text-sm font-semibold text-white/85 transition-colors hover:bg-white/[0.1]">
                    <Tv size={16} /> Series
                </Link>
            </motion.div>
        </div>
    );
}
