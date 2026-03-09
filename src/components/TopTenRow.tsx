'use client';

import { Movie } from '@/lib/tmdb';
import styles from './TopTenRow.module.css';
import MovieCard from './MovieCard';

interface TopTenRowProps {
    title: string;
    movies: Movie[];
}

export default function TopTenRow({ title, movies }: TopTenRowProps) {
    // Only show top 10
    const topTen = movies.slice(0, 10);

    return (
        <section className={styles.section}>
            <h2 className={styles.title}>{title}</h2>
            <div className={styles.rail}>
                {topTen.map((movie, index) => (
                    <div key={movie.id} className={styles.item}>
                        <div className={styles.rank}>
                            {index + 1}
                        </div>
                        <div className={styles.cardWrapper}>
                            <MovieCard movie={movie} />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
