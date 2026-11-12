'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bookmark, CornerDownLeft, Film, Heart, Home, Loader2, Search, Settings, Shuffle, Star, TrendingUp, Tv,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AnimeIcon from './AnimeIcon';
import OriginPop from './ui/OriginPop';
import { useData } from '@/context/DataContext';
import { searchEverything } from '@/lib/search';
import { resolveImageUrl } from '@/lib/images';
import { fetchTrending, Movie } from '@/lib/tmdb';
import { cn } from '@/lib/utils';
import { useScrollLock } from '@/lib/useScrollLock';

const OPEN_EVENT = 'flixview:open-palette';

/** Open the command palette from anywhere, optionally with a search filled in. */
export function openCommandPalette(query?: string) {
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: typeof query === 'string' ? query : undefined }));
}

/** Details URL for a search result or library item. */
function detailsHref(item: { id: number | string; media_type?: string }): string {
    const type = item.media_type === 'anime' ? 'anime' : item.media_type === 'tv' ? 'series' : 'movie';
    return `/details?type=${type}&id=${item.id}`;
}

/** Open a random title from today's trending list. */
export async function openRandomTitle(push: (href: string) => void) {
    const trending = await fetchTrending('day');
    const pool = trending.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
    if (pool.length === 0) return;
    push(detailsHref(pool[Math.floor(Math.random() * pool.length)]));
}

interface Entry {
    key: string;
    label: string;
    hint?: string;
    icon?: LucideIcon | typeof AnimeIcon;
    image?: string | null;
    rating?: number;
    run: () => void;
}

const SEARCH_DEBOUNCE_MS = 280;
const MAX_RESULTS = 8;

export default function CommandPalette() {
    const router = useRouter();
    const { progress } = useData();

    const [open, setOpen] = useState(false);
    useScrollLock(open);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Movie[]>([]);
    const [searching, setSearching] = useState(false);
    const [active, setActive] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const close = useCallback(() => {
        setOpen(false);
        setQuery('');
        setResults([]);
        setActive(0);
    }, []);

    const go = useCallback((href: string) => {
        close();
        router.push(href);
    }, [close, router]);

    // Global shortcuts: Ctrl/Cmd+K anywhere, "/" when not typing.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setOpen(value => !value);
            } else if (event.key === '/' && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
                event.preventDefault();
                setOpen(true);
            }
        };
        const onOpen = (event: Event) => {
            const preset = (event as CustomEvent<string | undefined>).detail;
            if (preset) setQuery(preset);
            setOpen(true);
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener(OPEN_EVENT, onOpen);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener(OPEN_EVENT, onOpen);
        };
    }, []);

    useEffect(() => {
        if (!open) return;
        const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
        return () => window.clearTimeout(timer);
    }, [open]);

    // Debounced live search across movies, TV and anime.
    useEffect(() => {
        const trimmed = query.trim();
        if (!open || trimmed.length < 2) return;

        let cancelled = false;
        const timer = window.setTimeout(async () => {
            setSearching(true);
            try {
                const found = await searchEverything(trimmed);
                if (cancelled) return;
                // Interleave so anime is not buried under 30 movie results.
                const merged: Movie[] = [];
                for (let i = 0; merged.length < MAX_RESULTS && (i < found.movies.length || i < found.anime.length); i++) {
                    if (found.movies[i]) merged.push(found.movies[i]);
                    if (found.anime[i] && merged.length < MAX_RESULTS) merged.push(found.anime[i]);
                }
                setResults(merged);
                setActive(0);
            } finally {
                if (!cancelled) setSearching(false);
            }
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [query, open]);

    const isSearch = query.trim().length >= 2;

    const sections = useMemo(() => {
        if (isSearch) {
            const items: Entry[] = results.map(item => {
                const date = item.release_date || item.first_air_date;
                const kind = item.media_type === 'anime' ? 'Anime' : item.media_type === 'tv' ? 'Series' : 'Movie';
                return {
                    key: `${item.media_type}-${item.id}`,
                    label: item.title || item.name || 'Untitled',
                    hint: [kind, date ? new Date(date).getFullYear() : null].filter(Boolean).join(' · '),
                    image: item.poster_path || item.backdrop_path,
                    rating: item.vote_average,
                    run: () => go(detailsHref(item)),
                };
            });
            items.push({
                key: 'all-results',
                label: `See all results for "${query.trim()}"`,
                icon: Search,
                run: () => go(`/search?q=${encodeURIComponent(query.trim())}`),
            });
            return [{ title: 'Results', items }];
        }

        const recent: Entry[] = [...progress]
            .filter(record => record.watched_seconds > 0)
            .sort((a, b) => new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime())
            .slice(0, 3)
            .map(record => ({
                key: `resume-${record.media_type}-${record.media_id}`,
                label: record.media_data?.title || 'Untitled',
                hint: 'Continue watching',
                image: record.media_data?.poster_path,
                run: () => go(`/watch?type=${record.media_type}&id=${record.media_id}`),
            }));

        const pages: Entry[] = [
            { key: 'home', label: 'Home', icon: Home, run: () => go('/') },
            { key: 'trending', label: 'Trending', icon: TrendingUp, run: () => go('/trending') },
            { key: 'movies', label: 'Movies', icon: Film, run: () => go('/movies') },
            { key: 'series', label: 'Series', icon: Tv, run: () => go('/series') },
            { key: 'anime', label: 'Anime', icon: AnimeIcon, run: () => go('/anime') },
            { key: 'watchlist', label: 'My Watchlist', icon: Bookmark, run: () => go('/watchlist') },
            { key: 'favorites', label: 'My Favourites', icon: Heart, run: () => go('/favorites') },
            { key: 'settings', label: 'Settings & Data', icon: Settings, run: () => go('/settings') },
        ];

        const actions: Entry[] = [
            {
                key: 'surprise',
                label: 'Surprise me',
                hint: 'Open a random trending title',
                icon: Shuffle,
                run: () => { close(); openRandomTitle(href => router.push(href)); },
            },
        ];

        return [
            ...(recent.length ? [{ title: 'Jump back in', items: recent }] : []),
            { title: 'Actions', items: actions },
            { title: 'Go to', items: pages },
        ];
    }, [isSearch, results, query, progress, go, close, router]);

    const flat = useMemo(() => sections.flatMap(section => section.items), [sections]);
    // Index of each section's first row in the flat (keyboard) order.
    const sectionStarts = useMemo(() => {
        const starts: number[] = [];
        let count = 0;
        for (const section of sections) {
            starts.push(count);
            count += section.items.length;
        }
        return starts;
    }, [sections]);
    const activeIndex = Math.min(active, Math.max(0, flat.length - 1));

    // Keep the highlighted row in view while arrowing through the list. Only
    // for the keyboard: hover highlights must never scroll the list, or they
    // fight the wheel (scrolling moves rows under the pointer).
    const keyboardNav = useRef(false);
    useEffect(() => {
        if (!keyboardNav.current) return;
        keyboardNav.current = false;
        listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    const onInputKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') keyboardNav.current = true;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((activeIndex + 1) % Math.max(1, flat.length));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((activeIndex - 1 + flat.length) % Math.max(1, flat.length));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            flat[activeIndex]?.run();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            close();
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    data-lenis-prevent
                    className="fixed inset-0 z-[5000] flex items-start justify-center bg-[rgba(2,6,5,0.72)] px-4 pt-[14vh]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}
                >
                    <OriginPop className="w-full max-w-[640px]" fallback="top">
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-label="Search and commands"
                            className="overflow-hidden rounded-[26px] border border-white/[0.09] bg-[rgba(9,19,17,0.97)] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(240,237,228,0.06)]"
                        >
                            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                                {searching
                                    ? <Loader2 size={20} className="shrink-0 animate-spin text-violet-300" />
                                    : <Search size={20} className="shrink-0 text-white/60" />}
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(event) => { setQuery(event.target.value); setActive(0); }}
                                    onKeyDown={onInputKeyDown}
                                    placeholder="Search movies, shows and anime..."
                                    className="w-full bg-transparent text-lg font-medium text-white outline-none placeholder:text-white/40"
                                    spellCheck={false}
                                    autoComplete="off"
                                />
                                <kbd className="shrink-0 rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/50">Esc</kbd>
                            </div>

                            <div ref={listRef} className="max-h-[52vh] overflow-y-auto overscroll-contain p-2 [contain:content]">
                                {sections.map((section, sectionIndex) => (
                                    <div key={section.title} className="mb-1">
                                        <div className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">
                                            {section.title}
                                        </div>
                                        {section.items.map((item, itemIndex) => {
                                            const index = sectionStarts[sectionIndex] + itemIndex;
                                            const isActive = index === activeIndex;
                                            const Icon = item.icon;
                                            return (
                                                <button
                                                    key={item.key}
                                                    type="button"
                                                    data-index={index}
                                                    data-ripple
                                                    onMouseMove={() => { if (index !== activeIndex) setActive(index); }}
                                                    onClick={item.run}
                                                    className={cn(
                                                        'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors',
                                                        isActive ? 'bg-violet-500/25 text-white' : 'text-white/75'
                                                    )}
                                                >
                                                    {item.image !== undefined ? (
                                                        <span
                                                            className="h-[54px] w-9 shrink-0 rounded-[5px] bg-white/10 bg-cover bg-center shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
                                                            style={item.image ? { backgroundImage: `url(${resolveImageUrl(item.image, 'w92')})` } : undefined}
                                                        />
                                                    ) : Icon ? (
                                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.07]">
                                                            <Icon size={18} />
                                                        </span>
                                                    ) : null}
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-[15px] font-semibold">{item.label}</span>
                                                        {item.hint && <span className="block truncate text-xs text-white/45">{item.hint}</span>}
                                                    </span>
                                                    {item.rating ? (
                                                        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-300">
                                                            <Star size={12} fill="currentColor" />{item.rating.toFixed(1)}
                                                        </span>
                                                    ) : null}
                                                    {isActive && <CornerDownLeft size={15} className="shrink-0 text-white/50" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}

                                {isSearch && !searching && results.length === 0 && (
                                    <p className="px-3 pb-3 text-sm text-white/45">No titles found yet. Try another spelling.</p>
                                )}
                            </div>

                            <div className="flex items-center gap-4 border-t border-white/10 px-5 py-2.5 text-[11px] font-medium text-white/40">
                                <span><kbd className="font-semibold text-white/60">↑↓</kbd> navigate</span>
                                <span><kbd className="font-semibold text-white/60">Enter</kbd> open</span>
                                {isSearch ? (
                                    <button
                                        type="button"
                                        onClick={() => go(`/search?q=${encodeURIComponent(query.trim())}`)}
                                        className="ml-auto rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11.5px] font-semibold text-white/75 transition-colors hover:bg-white/[0.1] hover:text-white"
                                    >
                                        See all results
                                    </button>
                                ) : (
                                    <span className="ml-auto"><kbd className="font-semibold text-white/60">Ctrl K</kbd> toggle</span>
                                )}
                            </div>
                        </div>
                    </OriginPop>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
