'use client';

import { useState, useEffect } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { searchContent, Movie } from '@/lib/tmdb';
import MovieCard from '@/components/MovieCard';
import styles from './Search.module.css';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Movie[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setIsSearching(false);
            setHasSearched(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const searchResults = await searchContent(query);
                setResults(searchResults);
                setHasSearched(true);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

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
                        placeholder="Search for movies, TV shows, people..."
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
                                Results for: &nbsp;<strong>"{query}"</strong>
                            </div>
                            <div className={styles.resultCount}>
                                {results.length} results found
                            </div>
                        </div>

                        {results.length > 0 ? (
                            <div className={styles.grid}>
                                {results.map((movie) => (
                                    <MovieCard key={movie.id} movie={movie} className="w-full" />
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <h2 className={styles.emptyTitle}>No results found</h2>
                                <p className={styles.emptyText}>
                                    We couldn't find any matches for "{query}". Try a different term.
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
                            Enter a search term above to find movies, TV shows, and more.
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
