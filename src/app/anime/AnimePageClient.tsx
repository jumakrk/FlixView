'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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

const FORMAT_FILTERS: { id: FormatFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'tv', label: 'TV Shows' },
    { id: 'movie', label: 'Movies' },
];

function formatFilterValue(filter: FormatFilter): AnimeFormat[] | undefined {
    if (filter === 'movie') return ['MOVIE'];
    if (filter === 'tv') return ['TV', 'TV_SHORT', 'ONA', 'OVA', 'SPECIAL'];
    return undefined;
}

export default function AnimePageClient() {
    const [sections, setSections] = useState<AnimeSections>(EMPTY_SECTIONS);
    const [sectionsLoading, setSectionsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
    const [browse, setBrowse] = useState<AniListMedia[]>([]);
    const [browsePage, setBrowsePage] = useState(1);
    const [browseHasMore, setBrowseHasMore] = useState(true);
    const [browseLoading, setBrowseLoading] = useState(true);

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

    // Paginated browse grid (also follows the All / TV / Movies filter).
    const loadBrowse = useCallback(async (page: number, replace: boolean) => {
        setBrowseLoading(true);
        try {
            const result = await fetchAnimePage({
                sort: 'POPULARITY_DESC',
                perPage: 24,
                page,
                formatIn: formatFilterValue(formatFilter),
            });

            setBrowse(prev => replace ? result.media : [...prev, ...result.media]);
            setBrowsePage(page);
            setBrowseHasMore(result.pageInfo.hasNextPage);
        } catch (error) {
            console.error('Failed to load anime browse page:', error);
            if (replace) setBrowse([]);
            setBrowseHasMore(false);
        } finally {
            setBrowseLoading(false);
        }
    }, [formatFilter]);

    useEffect(() => {
        loadBrowse(1, true);
    }, [loadBrowse]);

    return (
        <div className="min-h-screen pt-24 pb-20 bg-black">
            <div className="px-[4%]">
                <h1 className="text-4xl font-bold mb-3 text-white flex items-center gap-3">
                    Anime
                    <AnimeIcon className="text-violet-500" size={30} strokeWidth={2.25} />
                </h1>
                <p className="text-gray-400 mb-10">Series and movies, powered by AniList.</p>
            </div>

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
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <h2 className="text-2xl font-bold text-white">Browse Anime</h2>
                    <div className="flex items-center gap-2 rounded-xl bg-white/5 p-1 border border-white/10">
                        {FORMAT_FILTERS.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setFormatFilter(filter.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    formatFilter === filter.id
                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {browseLoading && browse.length === 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {Array.from({ length: 12 }).map((_, index) => (
                            <div key={index} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {browse.map((media) => (
                            <MovieCard key={media.id} movie={animeToMovie(media)} fullWidth />
                        ))}
                    </div>
                )}

                {browseHasMore && (
                    <div className="flex justify-center mt-12">
                        <button
                            onClick={() => loadBrowse(browsePage + 1, false)}
                            disabled={browseLoading}
                            className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {browseLoading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                'Load More'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
