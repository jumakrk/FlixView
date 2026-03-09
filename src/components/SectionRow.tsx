'use client';

import { memo } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import MovieCard from './MovieCard';
import styles from './SectionRow.module.css';
import { Movie } from '@/lib/tmdb';

interface SectionRowProps {
    title: string;
    movies: Movie[];
}

function SectionRow({ title, movies }: SectionRowProps) {
    if (!movies || movies.length === 0) return null;

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    {title}
                </h2>
                <Link
                    href="/movies"
                    className={styles['view-all']}
                >
                    View All <ChevronRight size={16} />
                </Link>
            </div>

            <div className={styles.rail}>
                {movies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} className="flex-shrink-0" />
                ))}
            </div>
        </section>
    );
}

export default memo(SectionRow);
