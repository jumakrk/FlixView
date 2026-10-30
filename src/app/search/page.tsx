'use client';

import { useState, useEffect } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Movie } from '@/lib/tmdb';
import { searchEverything } from '@/lib/search';
import MovieCard from '@/components/MovieCard';
import styles from './Search.module.css';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Movie[]>([]);
    const [animeResults, setAnimeResults] = useState<Movie[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setAnimeResults([]);
            setIsSearching(false);
            setHasSearched(false);
            return;
        }

        let cancelled = false;

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                // TMDB for movies/TV, AniList for anime. The helper also
                // recovers missing spaces ("onepiece" -> "one piece") when a
                // provider has no exact title match.
                const { movies, anime } = await searchEverything(query);

                if (cancelled) return;
                setResults(movies);
                setAnimeResults(anime);
                setHasSearched(true);
            } catch (error) {
                if (!cancelled) console.error('Search error:', error);
            } finally {
                if (!cancelled) setIsSearching(false);
            }
        }, 600);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query]);

    const totalResults = results.length + animeResults.length;

    return (
        <div className={styles.container}>
            {/* Header / Title Section */}
            <div className={styles.header}>
                <div className={styles.headerIcon}>
                    <SearchIcon size={24} />
                </div>
                <h1 className={styles.headerTitle}>Search</h1>
            </div>

            {/* Search Input Box */}
            <div className={styles.searchBox}>
                <div className={styles.inputWrapper}>
                    <SearchIcon className={styles.searchIcon} size={22} />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search movies, TV shows, anime..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto">
                {hasSearched && query.trim() ? (
                    <>
                        <div className={styles.resultsHeader}>
                            <div className={styles.queryChip}>
                                Results for: &nbsp;<strong>&quot;{query}&quot;</strong>
                            </div>
                            <div className={styles.resultCount}>
                                {totalResults} results found
                            </div>
                        </div>

                        {totalResults > 0 ? (
                            <div className="space-y-12">
                                {results.length > 0 && (
                                    <section>
                                        <h2 className="text-xl font-bold text-white mb-5">Movies &amp; TV</h2>
                                        <div className={styles.grid}>
                                            {results.map((movie) => (
                                                <MovieCard key={movie.id} movie={movie} fullWidth />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {animeResults.length > 0 && (
                                    <section>
                                        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                                            Anime
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded px-1.5 py-0.5">
                                                AniList
                                            </span>
                                        </h2>
                                        <div className={styles.grid}>
                                            {animeResults.map((movie) => (
                                                <MovieCard key={movie.id} movie={movie} fullWidth />
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <h2 className={styles.emptyTitle}>No results found</h2>
                                <p className={styles.emptyText}>
                                    We couldn&apos;t find any matches for &quot;{query}&quot;. Try a different term.
                                </p>
                            </div>
                        )}
                    </>
                ) : !isSearching && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <SearchIcon size={40} />
                        </div>
                        <h2 className={styles.emptyTitle}>Start searching</h2>
                        <p className={styles.emptyText}>
                            Enter a search term above to find movies, TV shows, anime, and more.
                        </p>
                    </div>
                )}

                {isSearching && (
                    <div className="flex justify-center mt-20">
                        <div className={styles.loadingSpinner}></div>
                    </div>
                )}
            </div>
        </div>
    );
}
