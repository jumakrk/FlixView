'use client';

import { Movie } from '@/lib/tmdb';
import styles from './TopTenRow.module.css';
import rowStyles from './SectionRow.module.css';
import MovieCard from './MovieCard';
import Rail from './ui/Rail';
import { Reveal, RevealGroup, RevealItem } from './ui/Reveal';

interface TopTenRowProps {
    title: string;
    movies: Movie[];
}

export default function TopTenRow({ title, movies }: TopTenRowProps) {
    // Only show top 10
    const topTen = movies.slice(0, 10);
    if (topTen.length === 0) return null;

    return (
        <section className={styles.section}>
            <Reveal className={rowStyles.header}>
                <h2 className={rowStyles.title}>{title}</h2>
            </Reveal>
            <RevealGroup stagger={0.07}>
                <Rail className={styles.rail} fade={false}>
                    {topTen.map((movie, index) => (
                        <RevealItem key={movie.id} className={styles.item}>
                            <div className={styles.rank}>
                                {index + 1}
                            </div>
                            <div className={styles.cardWrapper}>
                                <MovieCard movie={movie} />
                            </div>
                        </RevealItem>
                    ))}
                </Rail>
            </RevealGroup>
        </section>
    );
}
