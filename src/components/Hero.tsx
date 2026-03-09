'use client';

import { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { Info, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image'; // Import the Image component
import { Movie } from '@/lib/tmdb';
import styles from './Hero.module.css';
import { usePlayer } from '@/context/PlayerContext';
import InteractionButtons from './InteractionButtons';
import PlayButton from './PlayButton';
import MediaProgressBar from '@/components/MediaProgressBar';

interface HeroProps {
    movies: (Movie & { logo_path?: string | null })[];
}

// Common TMDB Genre IDs
const GENRE_MAP: Record<number, string> = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western', 10759: 'Action & Adventure',
    10762: 'Kids', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy',
    10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
};

function Hero({ movies }: HeroProps) {
    const imageBaseUrl = 'https://image.tmdb.org/t/p/original';
    const logoBaseUrl = 'https://image.tmdb.org/t/p/w500'; // Smaller size for logo
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const { openPlayer } = usePlayer();

    const currentMovie = useMemo(() => movies[currentIndex], [movies, currentIndex]);

    const handleNext = useCallback(() => {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 500); // Reset animation state
        setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, [movies.length]);

    const handlePrev = useCallback(() => {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 500);
        setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
    }, [movies.length]);

    // Auto-play - fixed dependency issue
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % movies.length);
        }, 10000); // 10 seconds per slide

        return () => clearInterval(timer);
    }, [movies.length, currentIndex]);

    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            handleNext();
        } else if (isRightSwipe) {
            handlePrev();
        }
    };

    if (!movies || movies.length === 0) return null;
    const movie = currentMovie;

    return (
        <div
            className={styles.hero}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Background Image - Keyed to trigger re-render animation or smooth transition if we had CSS transition */}
            <div
                key={movie.id} // Forces re-creation of div to restart bgZoom animation
                className={`${styles['hero-bg']} ${isAnimating ? styles.fadeOut : styles.fadeIn}`}
                style={{ backgroundImage: `url(${imageBaseUrl}${movie.backdrop_path})` }}
            />
            <div className={styles.overlay} />

            <div className={styles.content}>
                <div className={styles['text-wrapper']} key={`text-${movie.id}`}>
                    {/* Animated Tags */}
                    <div className={styles.title}>
                        {movie.logo_path ? (
                            <div className={styles['hero-logo-container']}>
                                <Image
                                    src={`${logoBaseUrl}${movie.logo_path}`}
                                    alt={movie.title || movie.name || ''}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className={styles['hero-logo']}
                                />
                            </div>
                        ) : (
                            <span>{movie.title || movie.name}</span>
                        )}
                    </div>

                    {/* Animated Tags */}
                    <div className={styles['meta-tags']}>
                        <div className={styles['rating-item']}>
                            {/* Star Icon */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                            <span className="text-white ml-2">{(movie.vote_average || 0).toFixed(1)}</span>
                        </div>

                        <span className={styles.separator}>•</span>
                        <span>{(() => {
                            const date = movie.release_date || movie.first_air_date;
                            return date ? new Date(date).getFullYear() : 'N/A';
                        })()}</span>

                        <span className={styles.separator}>•</span>
                        <span className={styles.badge}>{movie.media_type === 'tv' ? 'SERIES' : 'MOVIE'}</span>

                        {movie.genre_ids?.slice(0, 3).map((genreId) => (
                            <div key={genreId} className="flex items-center">
                                <span className={styles.separator}>•</span>
                                <span>{GENRE_MAP[genreId] || 'Genre'}</span>
                            </div>
                        ))}
                    </div>

                    <p className={styles.description}>
                        {movie.overview}
                    </p>

                    <div className="flex flex-col w-full max-w-md">
                        <div className={styles.actions}>
                            <PlayButton
                                id={movie.id}
                                type={movie.media_type === 'tv' ? 'tv' : 'movie'}
                                className={styles['btn-play']}
                                releaseDate={movie.release_date || movie.first_air_date}
                            />
                            <InteractionButtons
                                contentId={movie.id}
                                mediaType={movie.media_type === 'tv' ? 'tv' : 'movie'}
                                title={movie.title || movie.name}
                                poster={movie.poster_path}
                                showFavorite={false}
                            />
                            <Link
                                href={`/details?type=${movie.media_type === 'tv' ? 'series' : 'movie'}&id=${movie.id}`}
                                className={styles['btn-secondary']}
                            >
                                <Info size={24} />
                                <span>More Info</span>
                            </Link>
                        </div>
                        <MediaProgressBar
                            id={movie.id}
                            type={movie.media_type === 'tv' ? 'tv' : 'movie'}
                        />
                    </div>
                </div>
            </div>

            {/* Navigation Controls */}
            <div className={`${styles['controls-desktop']} absolute bottom-10 right-10 flex gap-2 z-20`}>
                <button onClick={handlePrev} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all">
                    <ChevronLeft size={24} />
                </button>
                <button onClick={handleNext} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all">
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                {movies.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                    />
                ))}
            </div>
        </div>
    );
}

export default memo(Hero);
