'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, Flame, RotateCcw, Sparkles, Star } from 'lucide-react';
import styles from './DiscoverFilters.module.css';
import SegmentedControl from './ui/SegmentedControl';
import ChipRail from './ui/ChipRail';

interface DiscoverFiltersProps {
    type?: 'movie' | 'tv';
}

const MOVIE_GENRES = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama',
    'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery', 'Romance',
    'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'
];

const TV_GENRES = [
    'Action & Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama',
    'Family', 'Kids', 'Mystery', 'News', 'Reality', 'Sci-Fi & Fantasy', 'Soap',
    'Talk', 'War & Politics', 'Western'
];

// URL values are the labels fetchDiscover already understands.
type SortValue = 'Popularity Descending' | 'Rating Descending' | 'Release Date Descending';

const SORTS = [
    { value: 'Popularity Descending' as const, label: 'Popular', icon: <Flame size={15} /> },
    { value: 'Rating Descending' as const, label: 'Top rated', icon: <Star size={15} /> },
    { value: 'Release Date Descending' as const, label: 'Newest', icon: <Sparkles size={15} /> },
];

const YEARS = Array.from({ length: 60 }, (_, i) => String(new Date().getFullYear() - i));

export default function DiscoverFilters({ type = 'movie' }: DiscoverFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const genre = searchParams.get('genre');
    const year = searchParams.get('year');
    const sortBy = (searchParams.get('sortBy') as SortValue | null) ?? 'Popularity Descending';
    const filtered = Boolean(genre || year || searchParams.get('sortBy'));

    const updateFilter = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(key, value);
        else params.delete(key);
        router.push(`?${params.toString()}`, { scroll: false });
    };

    const genres = (type === 'movie' ? MOVIE_GENRES : TV_GENRES).map(name => ({ value: name, label: name }));

    return (
        <div className={`${styles.filterBar} glass-panel`}>
            <div className={styles.topRow}>
                <SegmentedControl
                    id={`sort-${type}`}
                    options={SORTS}
                    value={sortBy}
                    onChange={value => updateFilter('sortBy', value === 'Popularity Descending' ? null : value)}
                />

                <div className={styles.right}>
                    <label className={styles.yearPill}>
                        <CalendarDays size={15} />
                        <select
                            className={styles.select}
                            value={year ?? ''}
                            onChange={(event) => updateFilter('year', event.target.value || null)}
                            aria-label="Release year"
                        >
                            <option value="">Any year</option>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </label>

                    {filtered && (
                        <button
                            type="button"
                            className={styles.reset}
                            data-ripple
                            onClick={() => router.push('?', { scroll: false })}
                        >
                            <RotateCcw size={14} />
                            Reset
                        </button>
                    )}
                </div>
            </div>

            <ChipRail
                id={`genre-${type}`}
                chips={genres}
                value={genre}
                onChange={value => updateFilter('genre', value)}
                allLabel="All genres"
            />
        </div>
    );
}
