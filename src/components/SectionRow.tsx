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
    /** Pass null to hide the "View All" link (e.g. on the section's own page). */
    viewAllHref?: string | null;
}

function SectionRow({ title, movies, viewAllHref = '/movies' }: SectionRowProps) {
    if (!movies || movies.length === 0) return null;

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    {title}
                </h2>
                {viewAllHref !== null && (
                    <Link
                        href={viewAllHref}
                        className={styles['view-all']}
                    >
                        View All <ChevronRight size={16} />
                    </Link>
                )}
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
