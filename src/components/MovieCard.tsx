'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Movie } from '@/lib/tmdb';
import styles from './MovieCard.module.css';
import Countdown from './Countdown';

interface MovieCardProps {
    movie: Movie;
    className?: string;
}

function MovieCard({ movie, className }: MovieCardProps) {
    const imageBaseUrl = 'https://image.tmdb.org/t/p/w500'; // Hardcoded

    // Prefer poster for vertical card
    const imagePath = movie.poster_path || movie.backdrop_path;
    const imageUrl = imagePath ? `${imageBaseUrl}${imagePath}` : '/placeholder-movie.jpg';

    const linkType = movie.media_type === 'tv' ? 'series' : 'movie';

    const releaseDate = movie.release_date || movie.first_air_date;
    const isUpcoming = releaseDate ? new Date(releaseDate) > new Date() : false;

    return (
        <div className={`${styles.card} ${className || ''}`}>
            <Link href={`/details?type=${linkType}&id=${movie.id}`} className={styles.link}>
                <div
                    className={styles.image}
                    style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />

                <div className={styles.overlay} />

                {isUpcoming && releaseDate && (
                    <div className="absolute top-2 left-2 z-20">
                        <Countdown targetDate={releaseDate} compact />
                    </div>
                )}

                <div className={styles.content}>
                    <h3 className={styles.title}>{movie.title || movie.name}</h3>

                    <div className={styles.meta}>
                        {!isUpcoming ? (
                            <span className={styles.rating}>
                                <span style={{ fontSize: '12px', color: '#4ade80', marginRight: '4px' }}>★</span>
                                {(movie.vote_average || 0).toFixed(1)}
                            </span>
                        ) : (
                            <span style={{ 
                                fontSize: '10px', 
                                fontWeight: 800, 
                                color: '#fbbf24', 
                                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid rgba(251, 191, 36, 0.2)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                Upcoming
                            </span>
                        )}

                        <span style={{ margin: '0 8px', opacity: 0.5 }}>|</span>

                        <span>{releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'}</span>

                        <span style={{
                            marginLeft: 'auto',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.7)',
                            textTransform: 'uppercase'
                        }}>
                            {movie.media_type === 'tv' ? 'TV' : 'Movie'}
                        </span>
                    </div>
                </div>
            </Link>
        </div>
    );
}

export default memo(MovieCard);
