'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, Play, Plus, Star } from 'lucide-react';
import { Movie } from '@/lib/tmdb';
import { resolveImageUrl } from '@/lib/images';
import { useData } from '@/context/DataContext';
import { usePlayer } from '@/context/PlayerContext';
import { useTilt } from '@/lib/useTilt';
import { getLastWatchedEpisode, MediaType } from '@/lib/types';
import { cn } from '@/lib/utils';
import styles from './MovieCard.module.css';
import Countdown from './Countdown';

interface MovieCardProps {
    movie: Movie;
    className?: string;
    fullWidth?: boolean;
}

function MovieCard({ movie, className, fullWidth = false }: MovieCardProps) {
    const { isInWatchlist, addToWatchlist, removeFromWatchlist, getProgress } = useData();
    const { openPlayer } = usePlayer();
    const { onPointerMove, onPointerLeave } = useTilt<HTMLDivElement>(8);

    // Supports both TMDB relative paths and absolute AniList poster URLs.
    const imagePath = movie.poster_path || movie.backdrop_path;
    // w342 covers a 200px card at the app's 1x layout; w500 would only cost
    // decode time.
    const imageUrl = imagePath ? resolveImageUrl(imagePath, 'w342') : null;

    const mediaType: MediaType = movie.media_type === 'anime'
        ? 'anime'
        : movie.media_type === 'tv' ? 'tv' : 'movie';
    const linkType = mediaType === 'tv' ? 'series' : mediaType;

    const releaseDate = movie.release_date || movie.first_air_date;
    const isUpcoming = releaseDate ? new Date(releaseDate) > new Date() : false;

    const typeLabel = mediaType === 'anime' ? 'Anime' : mediaType === 'tv' ? 'TV' : 'Movie';
    const title = movie.title || movie.name || 'Untitled';
    const idStr = String(movie.id);
    const inWatchlist = isInWatchlist(idStr, mediaType);

    const toggleWatchlist = () => {
        if (inWatchlist) removeFromWatchlist(idStr, mediaType);
        else addToWatchlist({ mediaId: idStr, mediaType, title, poster: movie.poster_path ?? null });
    };

    // Quick Play resumes the last-watched episode, like the main Play button.
    const play = () => {
        const resume = getLastWatchedEpisode(getProgress(idStr, mediaType));
        openPlayer(idStr, mediaType, resume.season, resume.episode);
    };

    const card = (
        <div
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            className={cn(styles.card, fullWidth && styles.fullWidth, className)}
        >
            <div className={styles.inner}>
                <Link href={`/details?type=${linkType}&id=${movie.id}`} className={styles.link} aria-label={title}>
                    {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={imageUrl}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            className={styles.image}
                        />
                    ) : (
                        <span className={styles.noImage}>{title}</span>
                    )}
                    <div className={styles.overlay} />
                    <div className={styles.glare} />

                    {isUpcoming && releaseDate && (
                        <div className="absolute top-2 left-2 z-20">
                            <Countdown targetDate={releaseDate} compact />
                        </div>
                    )}

                    <div className={styles.content}>
                        <h3 className={styles.title}>{title}</h3>
                        <div className={styles.meta}>
                            {!isUpcoming ? (
                                <span className={styles.rating}>
                                    <Star size={11} fill="currentColor" />
                                    {(movie.vote_average || 0).toFixed(1)}
                                </span>
                            ) : (
                                <span className={styles.upcoming}>Upcoming</span>
                            )}
                            <span>{releaseDate ? new Date(releaseDate).getFullYear() : 'N/A'}</span>
                            <span className={styles.type}>{typeLabel}</span>
                        </div>
                    </div>
                </Link>

                {/* Quick actions sit outside the link so they do not navigate. */}
                <div className={styles.actions}>
                    {!isUpcoming && (
                        <button
                            type="button"
                            data-ripple
                            className={cn(styles.action, styles.actionPlay)}
                            onClick={play}
                            aria-label={`Play ${title}`}
                            title="Play"
                        >
                            <Play size={15} fill="currentColor" />
                        </button>
                    )}
                    <button
                        type="button"
                        data-ripple
                        className={cn(styles.action, inWatchlist && styles.actionOn)}
                        onClick={toggleWatchlist}
                        aria-label={inWatchlist ? `Remove ${title} from watchlist` : `Add ${title} to watchlist`}
                        title={inWatchlist ? 'In your watchlist' : 'Add to watchlist'}
                    >
                        {inWatchlist ? <Check size={15} /> : <Plus size={15} />}
                    </button>
                </div>
            </div>
        </div>
    );

    // In grids (fullWidth) each card fades up as it scrolls into view. Cards
    // in rails are revealed by the row instead.
    if (!fullWidth) return card;

    return (
        <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '0px 0px -5% 0px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
            {card}
        </motion.div>
    );
}

export default memo(MovieCard);
