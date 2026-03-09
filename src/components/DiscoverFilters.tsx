'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from './DiscoverFilters.module.css';

interface DiscoverFiltersProps {
    type?: 'movie' | 'tv';
}

export default function DiscoverFilters({ type = 'movie' }: DiscoverFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value.includes('All')) {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        router.push(`?${params.toString()}`, { scroll: false });
    };

    const movieGenres = [
        'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama',
        'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery', 'Romance',
        'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'
    ];

    const tvGenres = [
        'Action & Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama',
        'Family', 'Kids', 'Mystery', 'News', 'Reality', 'Sci-Fi & Fantasy', 'Soap',
        'Talk', 'War & Politics', 'Western'
    ];

    const genres = type === 'movie' ? movieGenres : tvGenres;

    return (
        <div className={styles.filterBar}>
            <div className={styles.selectWrapper}>
                <select 
                    className={styles.select}
                    value={searchParams.get('genre') || 'All Genres'}
                    onChange={(e) => updateFilter('genre', e.target.value)}
                >
                    <option>All Genres</option>
                    {genres.map(genre => (
                        <option key={genre}>{genre}</option>
                    ))}
                </select>
            </div>
            <div className={styles.selectWrapper}>
                <select 
                    className={styles.select}
                    value={searchParams.get('year') || 'All Years'}
                    onChange={(e) => updateFilter('year', e.target.value)}
                >
                    <option>All Years</option>
                    {Array.from({ length: 50 }, (_, i) => 2025 - i).map(year => (
                        <option key={year}>{year}</option>
                    ))}
                </select>
            </div>
            <div className={styles.selectWrapper}>
                <select 
                    className={styles.select}
                    value={searchParams.get('sortBy') || 'Popularity Descending'}
                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                >
                    <option>Popularity Descending</option>
                    <option>Popularity Ascending</option>
                    <option>Rating Descending</option>
                    <option>Release Date Descending</option>
                </select>
            </div>
        </div>
    );
}
