'use client';

import { useState, useEffect } from 'react';
import { fetchDetails, fetchCredits, fetchRecommendations, fetchMovieLogo, fetchCollection, fetchPersonCredits } from '@/lib/tmdb';
import styles from './Details.module.css';
import { Star, Clock, Calendar, Tv } from 'lucide-react';
import Link from 'next/link';
import SectionRow from '@/components/SectionRow';
import PlayButton from '@/components/PlayButton';
import SeasonSelector from '@/components/SeasonSelector';
import BackButton from '@/components/BackButton';
import MediaProgressBar from '@/components/MediaProgressBar';
import Image from 'next/image';
import InteractionButtons from '@/components/InteractionButtons';

export default function DetailsClient({ id, type }: { id: string; type: string }) {
    const mediaType = (type === 'series' || type === 'tv') ? 'tv' : 'movie';

    const [details, setDetails] = useState<any>(null);
    const [credits, setCredits] = useState<any[]>([]);
    const [similar, setSimilar] = useState<any[]>([]);
    const [logoPath, setLogoPath] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // Phase 1: Core Details
                const [detailsData, creditsData, recommendationsData, logoResult] = await Promise.all([
                    fetchDetails(id, mediaType),
                    fetchCredits(id, mediaType),
                    fetchRecommendations(id, mediaType),
                    fetchMovieLogo(parseInt(id), mediaType)
                ]);

                setDetails(detailsData);
                setCredits(creditsData);
                setLogoPath(logoResult);

                // Phase 2: Advanced Recommendations (Sequels & Cast Synergy)
                let advancedRecs = [...recommendationsData];

                // 2a. Fetch Collection (Sequels/Prequels)
                if (detailsData.belongs_to_collection) {
                    const collectionParts = await fetchCollection(detailsData.belongs_to_collection.id);
                    // Filter out current movie and merge
                    const sequels = collectionParts.filter((m: any) => m.id !== parseInt(id));
                    advancedRecs = [...sequels, ...advancedRecs];
                }

                // 2b. Fetch Top 3 Cast Synergy (Other popular movies they star in)
                const topCast = creditsData.slice(0, 3);
                const castCreditsResults = await Promise.all(
                    topCast.map(person => fetchPersonCredits(person.id.toString()))
                );

                castCreditsResults.forEach((personCredits: any) => {
                    if (personCredits && personCredits.cast) {
                        // Sort by popularity and take top 5 per person
                        const popularCastRoles = personCredits.cast
                            .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
                            .slice(0, 5);
                        advancedRecs = [...advancedRecs, ...popularCastRoles];
                    }
                });

                // Phase 3: Deduplicate & Filter
                const seenIds = new Set([`${mediaType}-${id}`]);
                const uniqueRecs = advancedRecs.filter(item => {
                    const itemType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
                    const key = `${itemType}-${item.id}`;
                    if (seenIds.has(key)) return false;
                    seenIds.add(key);
                    return item.poster_path || item.backdrop_path;
                });

                setSimilar(uniqueRecs.slice(0, 20));
            } catch (error) {
                console.error('Failed to fetch details:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id, mediaType]);

    if (loading || !details) {
        return (
            <div className={styles.detailsContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="mt-4 text-violet-400 font-medium">Loading details...</span>
                </div>
            </div>
        );
    }

    const imageBaseUrl = 'https://image.tmdb.org/t/p/original';
    const profileBaseUrl = 'https://image.tmdb.org/t/p/w185';
    const logoBaseUrl = 'https://image.tmdb.org/t/p/w500';

    const releaseDate = details.release_date || details.first_air_date;
    const isUpcoming = releaseDate ? new Date(releaseDate) > new Date() : false;
    const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';

    return (
        <div className={styles.detailsContainer}>
            <BackButton className={styles.backButton} />
            {/* Hero Section */}
            <div className={styles.hero}>
                <div
                    className={styles.backdrop}
                    style={{ backgroundImage: `url(${imageBaseUrl}${details.backdrop_path})` }}
                />
                <div className={styles.overlay} />

                <div className={styles.heroContent}>
                    {logoPath ? (
                        <div className={styles.logoContainer}>
                            <Image
                                src={`${logoBaseUrl}${logoPath}`}
                                alt={details.title || details.name || 'Movie Logo'}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className={styles.logo}
                            />
                        </div>
                    ) : (
                        <h1 className={styles.title}>{details.title || details.name}</h1>
                    )}

                    <div className={styles.meta}>
                        <div className={styles.rating}>
                            <Star size={18} fill="currentColor" />
                            <span>{details.vote_average.toFixed(1)}</span>
                        </div>
                        <span className={styles.separator}>•</span>
                        <span>{releaseYear}</span>
                        <span className={styles.separator}>•</span>
                        {details.runtime ? (
                            <div className="flex items-center gap-1">
                                <Clock size={16} />
                                <span>{Math.floor(details.runtime / 60)}h {details.runtime % 60}m</span>
                            </div>
                        ) : details.number_of_seasons ? (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <div className="flex items-center gap-1">
                                    <Tv size={16} />
                                    <span>{details.number_of_seasons} {details.number_of_seasons === 1 ? 'Season' : 'Seasons'}</span>
                                </div>
                                <span className={styles.separator}>•</span>
                                <div className="flex items-center gap-1">
                                    <Calendar size={16} />
                                    <span>{details.number_of_episodes} Episodes</span>
                                </div>
                            </div>
                        ) : null}
                        <span className={styles.separator}>•</span>
                        <span className={styles.badge}>{mediaType === 'tv' ? 'Series' : 'Movie'}</span>
                    </div>

                    {isUpcoming && (
                        <span className="inline-block mt-2 text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 uppercase tracking-widest">
                            Upcoming Release
                        </span>
                    )}

                    {details.tagline && <p className={styles.tagline}>{details.tagline}</p>}
                    <p className={styles.overview}>{details.overview}</p>

                    <div className={styles.mainActions}>
                        <div className="flex flex-col w-full max-w-sm">
                            <div className="flex items-center gap-4">
                                <PlayButton
                                    id={id}
                                    type={mediaType}
                                    className={styles.playBtn}
                                    label="Play"
                                    releaseDate={details.release_date || details.first_air_date}
                                />
                                <InteractionButtons
                                    contentId={parseInt(id)}
                                    mediaType={mediaType}
                                    title={details.title || details.name}
                                    poster={details.poster_path}
                                />
                            </div>
                            <MediaProgressBar id={id} type={mediaType} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className={styles.mainContent}>
                {/* Cast Section */}
                {credits && credits.length > 0 && (
                    <section>
                        <h2 className={styles.sectionTitle}>Top Cast</h2>
                        <div className={styles.castRail}>
                            {credits.map((person) => (
                                <Link key={person.id} href={`/person?id=${person.id}`} className={styles.castCard}>
                                    <div className={styles.castImageContainer}>
                                        <Image
                                            src={person.profile_path ? `${profileBaseUrl}${person.profile_path}` : '/placeholder-avatar.svg'}
                                            alt={person.name || 'Cast Member'}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className={`${styles.castImage} ${!person.profile_path ? 'opacity-50' : ''}`}
                                        />
                                    </div>
                                    <span className={styles.castName}>{person.name}</span>
                                    <span className={styles.characterName}>{person.character}</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Series Seasons & Episodes */}
                {mediaType === 'tv' && details.seasons && (
                    <SeasonSelector
                        seriesId={id}
                        seasons={details.seasons.filter((s: any) => s.season_number > 0)}
                    />
                )}

                {/* More Details Grid */}
                <section>
                    <h2 className={styles.sectionTitle}>Details</h2>
                    <div className={styles.detailsGrid}>
                        <div>
                            <span className={styles.detailItemLabel}>Status</span>
                            <span className={styles.detailItemValue}>{details.status || 'Released'}</span>
                        </div>
                        <div>
                            <span className={styles.detailItemLabel}>Genres</span>
                            <span className={styles.detailItemValue}>
                                {details.genres?.map((g: any) => g.name).join(', ')}
                            </span>
                        </div>
                        {details.homepage && (
                            <div>
                                <span className={styles.detailItemLabel}>Official Site</span>
                                <a href={details.homepage} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
                                    Visit Website
                                </a>
                            </div>
                        )}
                        {mediaType === 'tv' && (
                            <div>
                                <span className={styles.detailItemLabel}>Total Episodes</span>
                                <span className={styles.detailItemValue}>{details.number_of_episodes}</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Similar Content */}
                {similar && similar.length > 0 && (
                    <SectionRow
                        title="You Might Also Like"
                        movies={similar.slice(0, 15)}
                    />
                )}
            </div>
        </div>
    );
}
