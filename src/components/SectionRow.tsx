'use client';

import { memo } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import MovieCard from './MovieCard';
import styles from './SectionRow.module.css';
import { Movie } from '@/lib/tmdb';
import Rail from './ui/Rail';
import { Reveal, RevealGroup, RevealItem } from './ui/Reveal';

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
            <Reveal className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                {viewAllHref !== null && (
                    <Link href={viewAllHref} className={styles['view-all']}>
                        View all <ArrowRight size={15} />
                    </Link>
                )}
            </Reveal>

            <RevealGroup>
                <Rail className={styles.rail}>
                    {movies.map((movie) => (
                        <RevealItem key={movie.id} className="flex-shrink-0">
                            <MovieCard movie={movie} />
                        </RevealItem>
                    ))}
                </Rail>
            </RevealGroup>
        </section>
    );
}

export default memo(SectionRow);
