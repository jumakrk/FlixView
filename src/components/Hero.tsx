'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, Info, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Movie } from '@/lib/tmdb';
import styles from './Hero.module.css';
import InteractionButtons from './InteractionButtons';
import PlayButton from './PlayButton';
import MediaProgressBar from '@/components/MediaProgressBar';
import Glass from './ui/Glass';

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

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w1280';
const THUMB_BASE = 'https://image.tmdb.org/t/p/w300';
const LOGO_BASE = 'https://image.tmdb.org/t/p/w500';

/** Seconds each slide stays up before the hero advances by itself. */
const SLIDE_SECONDS = 10;
const EASE = [0.16, 1, 0.3, 1] as const;

const textVariants = {
    hidden: { opacity: 0, y: 26 },
    shown: (order: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.75, ease: EASE, delay: 0.12 + order * 0.07 },
    }),
};

function Hero({ movies }: HeroProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);

    // Parallax: the backdrop drifts down and the copy fades as the hero
    // scrolls away.
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const backdropY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
    const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-14%']);
    const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

    const count = movies.length;

    const goTo = useCallback((index: number) => {
        if (count === 0) return;
        setCurrentIndex(((index % count) + count) % count);
    }, [count]);

    // Autoplay, restarted whenever the slide changes and held while the
    // pointer is over the hero.
    useEffect(() => {
        if (paused || count < 2) return;
        const timer = setTimeout(() => goTo(currentIndex + 1), SLIDE_SECONDS * 1000);
        return () => clearTimeout(timer);
    }, [paused, count, currentIndex, goTo]);

    const touchStart = useRef<number | null>(null);
    const onTouchStart = (event: React.TouchEvent) => {
        touchStart.current = event.targetTouches[0].clientX;
    };
    const onTouchEnd = (event: React.TouchEvent) => {
        if (touchStart.current === null) return;
        const distance = touchStart.current - event.changedTouches[0].clientX;
        touchStart.current = null;
        if (distance > 50) goTo(currentIndex + 1);
        else if (distance < -50) goTo(currentIndex - 1);
    };

    if (!movies || count === 0) return null;
    const movie = movies[currentIndex];
    const mediaType = movie.media_type === 'tv' ? 'tv' : 'movie';
    const date = movie.release_date || movie.first_air_date;

    // The "up next" stack shows the slides after the current one, in order.
    const upNext = Array.from({ length: Math.min(3, count - 1) }, (_, offset) => (currentIndex + 1 + offset) % count);

    return (
        <div
            ref={heroRef}
            className={styles.hero}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Backdrop: crossfades between slides, with a slow zoom on each. */}
            <motion.div className={styles.backdropLayer} style={{ y: backdropY }}>
                <AnimatePresence initial={false}>
                    <motion.div
                        key={movie.id}
                        className={styles.backdrop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.1, ease: 'easeInOut' }}
                    >
                        <div
                            className={styles.backdropImage}
                            style={{ backgroundImage: `url(${IMAGE_BASE}${movie.backdrop_path})` }}
                        />
                    </motion.div>
                </AnimatePresence>
            </motion.div>
            <div className={styles.shade} />

            <motion.div className={styles.content} style={{ y: contentY, opacity: contentOpacity }}>
                <motion.div
                    key={`copy-${movie.id}`}
                    className={styles.copy}
                    initial="hidden"
                    animate="shown"
                >
                    <motion.div custom={0} variants={textVariants}>
                        <span className={styles.eyebrow}>
                            <span className={styles.liveDot} />
                            Trending now
                        </span>
                    </motion.div>

                    <motion.div custom={1} variants={textVariants} className={styles.title}>
                        {movie.logo_path ? (
                            <div className={styles.logoBox}>
                                <Image
                                    src={`${LOGO_BASE}${movie.logo_path}`}
                                    alt={movie.title || movie.name || ''}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className={styles.logoImage}
                                    priority
                                />
                            </div>
                        ) : (
                            <span>{movie.title || movie.name}</span>
                        )}
                    </motion.div>

                    <motion.div custom={2} variants={textVariants} className={styles.meta}>
                        <span className={styles.rating}>
                            <Star size={15} fill="currentColor" />
                            {(movie.vote_average || 0).toFixed(1)}
                        </span>
                        <span>{date ? new Date(date).getFullYear() : 'N/A'}</span>
                        <span className={styles.typeChip}>{mediaType === 'tv' ? 'Series' : 'Movie'}</span>
                        {movie.genre_ids?.slice(0, 3).map((genreId) => (
                            <span key={genreId} className={styles.genre}>{GENRE_MAP[genreId] || 'Genre'}</span>
                        ))}
                    </motion.div>

                    <motion.p custom={3} variants={textVariants} className={styles.description}>
                        {movie.overview}
                    </motion.p>

                    {/* Wide enough for the action row to stay on one line even
                        when Play is replaced by the release countdown. */}
                    <motion.div custom={4} variants={textVariants} className="flex w-full max-w-xl flex-col">
                        <div className={styles.actions}>
                            <PlayButton
                                id={movie.id}
                                type={mediaType}
                                className={styles.playButton}
                                releaseDate={date}
                            />
                            <InteractionButtons
                                contentId={movie.id}
                                mediaType={mediaType}
                                title={movie.title || movie.name}
                                poster={movie.poster_path}
                                showFavorite={false}
                            />
                            <Glass
                                as={Link}
                                preset="bar"
                                href={`/details?type=${mediaType === 'tv' ? 'series' : 'movie'}&id=${movie.id}`}
                                className={styles.infoButton}
                                data-ripple
                            >
                                <Info size={20} />
                                <span>More Info</span>
                            </Glass>
                        </div>
                        <MediaProgressBar id={movie.id} type={mediaType} />
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Up next: the following slides as glass cards. */}
            {count > 1 && (
                <div className={styles.upNext}>
                    <span className={styles.upNextLabel}>Up next</span>
                    <AnimatePresence mode="popLayout" initial={false}>
                        {upNext.map((index) => {
                            const item = movies[index];
                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -30, scale: 0.92 }}
                                    transition={{ duration: 0.55, ease: EASE }}
                                >
                                    <Glass
                                        as="button"
                                        preset="card"
                                        type="button"
                                        onClick={() => goTo(index)}
                                        className={styles.upNextCard}
                                    >
                                        <span
                                            className={styles.upNextThumb}
                                            style={{ backgroundImage: `url(${THUMB_BASE}${item.backdrop_path})` }}
                                        />
                                        <span className={styles.upNextText}>
                                            <span className={styles.upNextTitle}>{item.title || item.name}</span>
                                            <span className={styles.upNextMeta}>
                                                {item.media_type === 'tv' ? 'Series' : 'Movie'}
                                                {' · '}
                                                <Star size={11} fill="currentColor" className="inline -mt-0.5" /> {(item.vote_average || 0).toFixed(1)}
                                            </span>
                                        </span>
                                    </Glass>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Slide controls: arrows and timed indicators. */}
            {count > 1 && (
                <div className={styles.controls}>
                    <Glass as="button" preset="button" type="button" onClick={() => goTo(currentIndex - 1)} className={styles.arrow} aria-label="Previous title">
                        <ChevronLeft size={20} />
                    </Glass>
                    <div className={styles.indicators}>
                        {movies.map((item, index) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => goTo(index)}
                                className={`${styles.indicator} ${index === currentIndex ? styles.indicatorActive : ''}`}
                                aria-label={`Show ${item.title || item.name}`}
                            >
                                {index === currentIndex && (
                                    <span
                                        key={`${item.id}-${paused}`}
                                        className={styles.indicatorFill}
                                        style={{ animationDuration: `${SLIDE_SECONDS}s`, animationPlayState: paused ? 'paused' : 'running' }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                    <Glass as="button" preset="button" type="button" onClick={() => goTo(currentIndex + 1)} className={styles.arrow} aria-label="Next title">
                        <ChevronRight size={20} />
                    </Glass>
                </div>
            )}
        </div>
    );
}

export default memo(Hero);
