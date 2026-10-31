'use client';

import { useEffect, useState } from 'react';
import { Film, Star, Tv } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchAnimeLogo } from '@/lib/tmdb';
import {
    AniListMedia,
    animeEpisodeCount,
    animeListToMovies,
    animeTitle,
    fetchAnimeById,
    fetchAnimeRecommendations,
    isAnimeMovie,
    stripAnimeHtml,
} from '@/lib/anilist';
import { resolveImageUrl } from '@/lib/images';
import styles from './[type]/[id]/Details.module.css';
import BackButton from '@/components/BackButton';
import PlayButton from '@/components/PlayButton';
import InteractionButtons from '@/components/InteractionButtons';
import MediaProgressBar from '@/components/MediaProgressBar';
import AnimeEpisodeList from '@/components/AnimeEpisodeList';
import SectionRow from '@/components/SectionRow';
import ExpandableDescription from '@/components/ExpandableDescription';

export default function AnimeDetailsClient({ id }: { id: string }) {
    const [media, setMedia] = useState<AniListMedia | null>(null);
    const [recommendations, setRecommendations] = useState<AniListMedia[]>([]);
    const [logoPath, setLogoPath] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setNotFound(false);
            setLogoPath(null);
            try {
                const mediaData = await fetchAnimeById(id);
                if (cancelled) return;

                if (!mediaData) {
                    setNotFound(true);
                    return;
                }

                setMedia(mediaData);

                // Decorative logo only; the AniList title remains the source of
                // truth and is used as a graceful fallback.
                fetchAnimeLogo(
                    [animeTitle(mediaData), mediaData.title.english, mediaData.title.romaji],
                    mediaData.seasonYear
                )
                    .then((logo) => {
                        if (!cancelled) setLogoPath(logo);
                    })
                    .catch(() => {});

                const recommended = await fetchAnimeRecommendations(id);
                if (!cancelled) setRecommendations(recommended);
            } catch (error) {
                console.error('Failed to load anime details:', error);
                if (!cancelled) setNotFound(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [id]);

    if (loading) {
        return (
            <div className={styles.detailsContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="mt-4 text-violet-400 font-medium">Loading anime...</span>
                </div>
            </div>
        );
    }

    if (notFound || !media) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">Anime not found</h1>
                <p className="text-gray-400">AniList could not find an anime with ID {id}.</p>
                <Link href="/anime" className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 font-semibold transition-colors">
                    Browse Anime
                </Link>
            </div>
        );
    }

    const title = animeTitle(media);
    const movie = isAnimeMovie(media);
    const totalEpisodes = animeEpisodeCount(media);
    const poster = media.coverImage?.extraLarge || media.coverImage?.large;
    const backdrop = media.bannerImage || poster;
    const score = (media.averageScore ?? media.meanScore ?? 0) / 10;
    const studio = media.studios?.nodes?.[0]?.name;
    const formatLabel = (media.format || 'ANIME').replace(/_/g, ' ');
    const seasonLabel = [media.season ? media.season[0] + media.season.slice(1).toLowerCase() : null, media.seasonYear]
        .filter(Boolean)
        .join(' ');
    const releaseDate = media.seasonYear ? `${media.seasonYear}-01-01` : undefined;

    return (
        <div className={styles.detailsContainer}>
            <BackButton className={styles.backButton} />

            {/* Hero Section */}
            <div className={styles.hero}>
                <div
                    className={styles.backdrop}
                    style={{ backgroundImage: `url(${resolveImageUrl(backdrop, 'original')})` }}
                />
                <div className={styles.overlay} />

                <div className={styles.heroContent}>
                    {logoPath ? (
                        <div className={styles.logoContainer}>
                            <Image
                                src={`https://image.tmdb.org/t/p/w500${logoPath}`}
                                alt={title}
                                fill
                                priority
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className={styles.logo}
                            />
                        </div>
                    ) : (
                        <h1 className={styles.title}>{title}</h1>
                    )}

                    <div className={styles.meta}>
                        {score > 0 && (
                            <div className={styles.rating}>
                                <Star size={18} fill="currentColor" />
                                <span>{score.toFixed(1)}</span>
                            </div>
                        )}
                        {media.seasonYear && (
                            <span>{media.seasonYear}</span>
                        )}
                        <span className={styles.separator}>•</span>
                        {movie ? (
                            <span className="flex items-center gap-1"><Film size={16} /> Movie</span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <Tv size={16} /> {totalEpisodes} {totalEpisodes === 1 ? 'Episode' : 'Episodes'}
                            </span>
                        )}
                        {media.status && (
                            <>
                                <span className={styles.separator}>•</span>
                                <span>{media.status.replace(/_/g, ' ')}</span>
                            </>
                        )}
                        <span className={styles.separator}>•</span>
                        <span className={styles.badge}>{movie ? 'Anime Movie' : 'Anime'}</span>
                    </div>

                    <ExpandableDescription
                        text={stripAnimeHtml(media.description)}
                        title={title}
                        className={styles.overview}
                    />

                    <div className={styles.mainActions}>
                        <div className="flex flex-col w-full max-w-md">
                            <div className="flex flex-wrap items-center gap-4">
                                <PlayButton
                                    id={id}
                                    type="anime"
                                    className={styles.playBtn}
                                    label="Play"
                                    releaseDate={media.status === 'NOT_YET_RELEASED' ? releaseDate : undefined}
                                />
                                <InteractionButtons
                                    contentId={media.id}
                                    mediaType="anime"
                                    title={title}
                                    poster={poster}
                                />
                            </div>
                            <MediaProgressBar id={id} type="anime" />
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.mainContent}>
                {/* Episode list (movies have exactly one playable "episode") */}
                {!movie && (
                    <AnimeEpisodeList
                        animeId={id}
                        totalEpisodes={totalEpisodes}
                        title={title}
                        fallbackImage={backdrop}
                        nextAiringEpisode={media.nextAiringEpisode}
                    />
                )}

                {/* Details Grid */}
                <section>
                    <h2 className={styles.sectionTitle}>Details</h2>
                    <div className={styles.detailsGrid}>
                        <div>
                            <span className={styles.detailItemLabel}>Status</span>
                            <span className={styles.detailItemValue}>
                                {media.status ? media.status.replace(/_/g, ' ') : 'Unknown'}
                            </span>
                        </div>
                        <div>
                            <span className={styles.detailItemLabel}>Format</span>
                            <span className={styles.detailItemValue}>{formatLabel}</span>
                        </div>
                        <div>
                            <span className={styles.detailItemLabel}>Episodes</span>
                            <span className={styles.detailItemValue}>{movie ? 'Movie' : totalEpisodes}</span>
                        </div>
                        {media.duration ? (
                            <div>
                                <span className={styles.detailItemLabel}>Duration</span>
                                <span className={styles.detailItemValue}>{media.duration} min</span>
                            </div>
                        ) : null}
                        {seasonLabel && (
                            <div>
                                <span className={styles.detailItemLabel}>Season</span>
                                <span className={styles.detailItemValue}>{seasonLabel}</span>
                            </div>
                        )}
                        {studio && (
                            <div>
                                <span className={styles.detailItemLabel}>Studio</span>
                                <span className={styles.detailItemValue}>{studio}</span>
                            </div>
                        )}
                        <div>
                            <span className={styles.detailItemLabel}>Genres</span>
                            <span className={styles.detailItemValue}>
                                {media.genres?.join(', ') || 'N/A'}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Recommendations from AniList */}
                {recommendations.length > 0 && (
                    <SectionRow
                        title="You Might Also Like"
                        movies={animeListToMovies(recommendations)}
                        viewAllHref={null}
                    />
                )}
            </div>
        </div>
    );
}
