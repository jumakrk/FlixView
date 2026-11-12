'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, Film, Flame, LayoutGrid, Radio, RotateCcw, Sparkles, Star, TrendingUp, Tv } from 'lucide-react';
import InfiniteScroll from '@/components/InfiniteScroll';
import SegmentedControl from '@/components/ui/SegmentedControl';
import ChipRail from '@/components/ui/ChipRail';
import filterStyles from '@/components/DiscoverFilters.module.css';
import PageHeader from '@/components/ui/PageHeader';
import AnimeIcon from '@/components/AnimeIcon';
import SectionRow from '@/components/SectionRow';
import MovieCard from '@/components/MovieCard';
import {
    AnimeFormat,
    AniListMedia,
    animeListToMovies,
    animeToMovie,
    fetchAnimePage,
    getCurrentAnimeSeason,
} from '@/lib/anilist';

type FormatFilter = 'all' | 'tv' | 'movie';

interface AnimeSections {
    trending: AniListMedia[];
    season: AniListMedia[];
    top: AniListMedia[];
    upcoming: AniListMedia[];
    movies: AniListMedia[];
}

const EMPTY_SECTIONS: AnimeSections = {
    trending: [],
    season: [],
    top: [],
    upcoming: [],
    movies: [],
};

const FORMAT_FILTERS = [
    { value: 'all' as const, label: 'All', icon: <LayoutGrid size={14} /> },
    { value: 'tv' as const, label: 'TV Shows', icon: <Tv size={14} /> },
    { value: 'movie' as const, label: 'Movies', icon: <Film size={14} /> },
];

type SortFilter = 'POPULARITY_DESC' | 'TRENDING_DESC' | 'SCORE_DESC' | 'START_DATE_DESC';

const SORT_FILTERS = [
    { value: 'POPULARITY_DESC' as const, label: 'Popular', icon: <Flame size={14} /> },
    { value: 'TRENDING_DESC' as const, label: 'Trending', icon: <TrendingUp size={14} /> },
    { value: 'SCORE_DESC' as const, label: 'Top rated', icon: <Star size={14} /> },
    { value: 'START_DATE_DESC' as const, label: 'Newest', icon: <Sparkles size={14} /> },
];

// AniList's genre list (adult-only genres left out).
const ANIME_GENRES = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mahou Shoujo', 'Mecha',
    'Music', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports',
    'Supernatural', 'Thriller',
].map(genre => ({ value: genre, label: genre }));

const STATUS_FILTERS = [
    { value: '', label: 'Any status' },
    { value: 'RELEASING', label: 'Airing now' },
    { value: 'FINISHED', label: 'Finished' },
    { value: 'NOT_YET_RELEASED', label: 'Upcoming' },
];

const ANIME_YEARS = Array.from({ length: 50 }, (_, i) => String(new Date().getFullYear() + 1 - i));

interface BrowseFilters {
    format: FormatFilter;
    sort: SortFilter;
    genre: string | null;
    year: string;
    status: string;
}

const DEFAULT_FILTERS: BrowseFilters = { format: 'all', sort: 'POPULARITY_DESC', genre: null, year: '', status: '' };

function formatFilterValue(filter: FormatFilter): AnimeFormat[] | undefined {
    if (filter === 'movie') return ['MOVIE'];
    if (filter === 'tv') return ['TV', 'TV_SHORT', 'ONA', 'OVA', 'SPECIAL'];
    return undefined;
}

export default function AnimePageClient() {
    const [sections, setSections] = useState<AnimeSections>(EMPTY_SECTIONS);
    const [sectionsLoading, setSectionsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const [filters, setFilters] = useState<BrowseFilters>(DEFAULT_FILTERS);
    const setFilter = <K extends keyof BrowseFilters>(key: K, value: BrowseFilters[K]) =>
        setFilters(prev => ({ ...prev, [key]: value }));
    const filtered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);
    // Ignores responses for filters that have since changed.
    const requestId = useRef(0);
    const [browse, setBrowse] = useState<AniListMedia[]>([]);
    const [browsePage, setBrowsePage] = useState(1);
    const [browseHasMore, setBrowseHasMore] = useState(true);
    const [browseLoading, setBrowseLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Curated rails.
    useEffect(() => {
        let cancelled = false;

        async function loadSections() {
            setSectionsLoading(true);
            setLoadError(false);
            try {
                const { season, seasonYear } = getCurrentAnimeSeason();
                const results = await Promise.allSettled([
                    fetchAnimePage({ sort: 'TRENDING_DESC', perPage: 20 }),
                    fetchAnimePage({ sort: 'POPULARITY_DESC', season, seasonYear, perPage: 20 }),
                    fetchAnimePage({ sort: 'SCORE_DESC', perPage: 20 }),
                    fetchAnimePage({ sort: 'POPULARITY_DESC', status: 'NOT_YET_RELEASED', perPage: 20 }),
                    fetchAnimePage({ sort: 'POPULARITY_DESC', format: 'MOVIE', perPage: 20 }),
                ]);

                if (cancelled) return;

                const mediaAt = (index: number): AniListMedia[] => {
                    const result = results[index];
                    return result.status === 'fulfilled' ? result.value.media : [];
                };

                const next = {
                    trending: mediaAt(0),
                    season: mediaAt(1),
                    top: mediaAt(2),
                    upcoming: mediaAt(3),
                    movies: mediaAt(4),
                };
                setSections(next);

                // Keep whichever rails loaded; only surface an error if AniList
                // failed for every request (rate limit / outage).
                if (results.every(result => result.status === 'rejected')) {
                    setLoadError(true);
                }
            } catch (error) {
                console.error('Failed to load anime sections:', error);
                if (!cancelled) setLoadError(true);
            } finally {
                if (!cancelled) setSectionsLoading(false);
            }
        }

        loadSections();
        return () => { cancelled = true; };
    }, []);

    // Paginated browse grid, following the filter bar.
    const loadBrowse = useCallback(async (page: number, replace: boolean) => {
        const request = ++requestId.current;
        setBrowseLoading(true);
        setRefreshing(replace);
        try {
            const result = await fetchAnimePage({
                sort: filters.sort,
                perPage: 24,
                page,
                formatIn: formatFilterValue(filters.format),
                genre: filters.genre ?? undefined,
                seasonYear: filters.year ? Number(filters.year) : undefined,
                status: filters.status || undefined,
                // "Newest" would otherwise lead with unannounced future titles.
                statusNot: filters.sort === 'START_DATE_DESC' && !filters.status ? 'NOT_YET_RELEASED' : undefined,
            });
            if (request !== requestId.current) return;

            setBrowse(prev => replace ? result.media : [...prev, ...result.media]);
            setBrowsePage(page);
            setBrowseHasMore(result.pageInfo.hasNextPage);
        } catch (error) {
            if (request !== requestId.current) return;
            console.error('Failed to load anime browse page:', error);
            if (replace) setBrowse([]);
            setBrowseHasMore(false);
        } finally {
            if (request === requestId.current) {
                setBrowseLoading(false);
                setRefreshing(false);
            }
        }
    }, [filters]);

    useEffect(() => {
        loadBrowse(1, true);
    }, [loadBrowse]);

    return (
        <div className="min-h-screen pb-20">
            <PageHeader
                eyebrow="Powered by AniList"
                title="Anime"
                subtitle="Trending series, this season's hits and the all-time greats."
                icon={<AnimeIcon size={30} strokeWidth={2.25} />}
            />

            {loadError && (
                <div className="px-[4%] mb-8">
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-300">
                        AniList could not be reached right now. Please try again in a moment.
                    </div>
                </div>
            )}

            {/* Curated Sections */}
            {sectionsLoading ? (
                <div className="space-y-10 mb-16 px-[4%]">
                    {Array.from({ length: 4 }).map((_, row) => (
                        <div key={row} className="mb-10">
                            <div className="h-7 w-48 rounded bg-white/5 animate-pulse mb-5" />
                            <div className="flex gap-5 overflow-hidden">
                                {Array.from({ length: 6 }).map((_, card) => (
                                    <div key={card} className="w-[160px] shrink-0 aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4 mb-16">
                    <SectionRow title="Trending Now" movies={animeListToMovies(sections.trending)} viewAllHref={null} />
                    <SectionRow title="Popular This Season" movies={animeListToMovies(sections.season)} viewAllHref={null} />
                    <SectionRow title="Top Rated Anime" movies={animeListToMovies(sections.top)} viewAllHref={null} />
                    <SectionRow title="Upcoming Anime" movies={animeListToMovies(sections.upcoming)} viewAllHref={null} />
                    <SectionRow title="Anime Movies" movies={animeListToMovies(sections.movies)} viewAllHref={null} />
                </div>
            )}

            {/* Browse */}
            <div className="px-[4%] mt-20">
                <h2 className="text-3xl font-bold mb-6 text-gradient">Browse Anime</h2>

                <div className={`${filterStyles.filterBar} glass-panel`}>
                    <div className={filterStyles.topRow}>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <SegmentedControl
                                id="anime-format"
                                size="sm"
                                options={FORMAT_FILTERS}
                                value={filters.format}
                                onChange={value => setFilter('format', value)}
                            />
                            <SegmentedControl
                                id="anime-sort"
                                size="sm"
                                options={SORT_FILTERS}
                                value={filters.sort}
                                onChange={value => setFilter('sort', value)}
                            />
                        </div>
                        <div className={filterStyles.right}>
                            <label className={filterStyles.yearPill}>
                                <Radio size={15} />
                                <select
                                    className={filterStyles.select}
                                    value={filters.status}
                                    onChange={event => setFilter('status', event.target.value)}
                                    aria-label="Airing status"
                                >
                                    {STATUS_FILTERS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                            </label>
                            <label className={filterStyles.yearPill}>
                                <CalendarDays size={15} />
                                <select
                                    className={filterStyles.select}
                                    value={filters.year}
                                    onChange={event => setFilter('year', event.target.value)}
                                    aria-label="Release year"
                                >
                                    <option value="">Any year</option>
                                    {ANIME_YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                                </select>
                            </label>
                            {filtered && (
                                <button type="button" className={filterStyles.reset} data-ripple onClick={() => setFilters(DEFAULT_FILTERS)}>
                                    <RotateCcw size={14} />
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                    <ChipRail
                        id="anime-genre"
                        chips={ANIME_GENRES}
                        value={filters.genre}
                        onChange={value => setFilter('genre', value)}
                        allLabel="All genres"
                    />
                </div>

                {browseLoading && browse.length === 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {Array.from({ length: 12 }).map((_, index) => (
                            <div key={index} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 transition-opacity duration-300 ${refreshing ? 'opacity-50' : ''}`}>
                        {browse.map((media) => (
                            <MovieCard key={media.id} movie={animeToMovie(media)} fullWidth />
                        ))}
                    </div>
                )}

                {!browseLoading && browse.length === 0 && (
                    <p className="py-16 text-center text-white/45">No anime match these filters.</p>
                )}

                {/* Loads the next page as the user scrolls */}
                <InfiniteScroll
                    onLoadMore={() => loadBrowse(browsePage + 1, false)}
                    hasMore={browseHasMore && browse.length > 0}
                    loading={browseLoading}
                    className="mt-6"
                />
            </div>
        </div>
    );
}
