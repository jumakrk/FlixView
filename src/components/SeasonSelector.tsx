'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SeasonDetails, Episode, fetchSeasonDetails } from '@/lib/tmdb';
import { useData } from '@/context/DataContext';
import styles from './SeasonSelector.module.css';
import { ChevronDown, Play, Tv } from 'lucide-react';
import PlayButton from './PlayButton';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Countdown from './Countdown';

interface SeasonSelectorProps {
    seriesId: string;
    seasons: {
        id: number;
        name: string;
        season_number: number;
        episode_count: number;
    }[];
    initialSeasonNumber?: number;
    listClassName?: string;
}

export default function SeasonSelector({ seriesId, seasons, initialSeasonNumber = 1, listClassName }: SeasonSelectorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSeason = parseInt(searchParams.get('season') || initialSeasonNumber.toString());
    const { getProgress } = useData();

    const [selectedSeason, setSelectedSeason] = useState(currentSeason);
    const [seasonData, setSeasonData] = useState<SeasonDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadSeason() {
            setLoading(true);
            const data = await fetchSeasonDetails(seriesId, selectedSeason);
            setSeasonData(data);
            setLoading(false);
        }
        loadSeason();
    }, [seriesId, selectedSeason]);

    const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSeason = parseInt(e.target.value);
        setSelectedSeason(newSeason);

        const params = new URLSearchParams(searchParams.toString());
        params.set('season', newSeason.toString());
        router.push(`?${params.toString()}`, { scroll: false });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Episodes</h2>
                <div className={styles.selectWrapper}>
                    <select
                        value={selectedSeason}
                        onChange={handleSeasonChange}
                        className={styles.select}
                    >
                        {seasons.map((s) => (
                            <option key={s.id} value={s.season_number}>
                                {s.name} ({s.episode_count} Episodes)
                            </option>
                        ))}
                    </select>
                    <ChevronDown className={styles.selectIcon} size={18} />
                </div>
            </div>

            {loading ? (
                <div className={styles.loading}>
                    <div className={styles.skeleton} />
                    <div className={styles.skeleton} />
                    <div className={styles.skeleton} />
                </div>
            ) : (
                <div className={cn(styles.episodeList, listClassName)}>
                    {seasonData?.episodes.map((episode) => {
                        const isComingSoon = !episode.air_date || new Date(episode.air_date) > new Date();

                        // Calculate Watch Progress
                        const tvProgress = getProgress(seriesId, 'tv');
                        const epKey = `s${selectedSeason}e${episode.episode_number}`;
                        const epProgress = tvProgress?.episodes?.[epKey];
                        
                        let watchedSecs = 0;
                        let durationSecs = 0;

                        if (epProgress && epProgress.duration_seconds > 0) {
                            watchedSecs = epProgress.watched_seconds;
                            durationSecs = epProgress.duration_seconds;
                        } else if (tvProgress?.season === selectedSeason && tvProgress?.episode === episode.episode_number && (tvProgress?.duration_seconds || 0) > 0) {
                            watchedSecs = tvProgress.watched_seconds;
                            durationSecs = tvProgress.duration_seconds;
                        }

                        let percentWatched = 0;
                        if (durationSecs > 0) {
                            percentWatched = Math.min(100, Math.max(0, (watchedSecs / durationSecs) * 100));
                        }

                        return (
                            <div key={episode.id} className={styles.episodeCard}>
                                <div className={styles.episodeImageContainer}>
                                    {episode.still_path ? (
                                        <Image
                                            src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                                            alt={episode.name || 'Episode Still'}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className={`${styles.episodeImage} ${isComingSoon ? 'grayscale opacity-50' : ''}`}
                                        />
                                    ) : (
                                        <div className={styles.episodePlaceholder}>
                                            <Tv size={32} className="opacity-20" />
                                        </div>
                                    )}
                                    
                                    {isComingSoon ? (
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] gap-1.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Coming Soon</span>
                                            {episode.air_date && <Countdown targetDate={episode.air_date} compact />}
                                        </div>
                                    ) : (
                                        <div className={styles.episodeOverlay}>
                                            <PlayButton
                                                id={seriesId}
                                                type="tv"
                                                season={selectedSeason}
                                                episode={episode.episode_number}
                                                className={styles.miniPlayBtn}
                                                iconOnly
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className={styles.episodeInfo}>
                                    <div className={styles.episodeHeader}>
                                        <span className={styles.episodeNumber}>
                                            S{selectedSeason} E{episode.episode_number}
                                        </span>
                                        <h3 className={styles.episodeName}>{episode.name}</h3>
                                    </div>
                                    <p className={styles.episodeOverview}>
                                        {episode.overview || 'No overview available for this episode.'}
                                    </p>
                                    <div className={styles.episodeMeta}>
                                        <span className={isComingSoon ? 'text-yellow-500 font-bold' : ''}>
                                            {episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'TBA'}
                                        </span>
                                        {!isComingSoon && episode.vote_average > 0 && (
                                            <span className={styles.episodeRating}>
                                                ★ {episode.vote_average.toFixed(1)}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Progress Bar under meta */}
                                    {percentWatched > 0 && !isComingSoon && (
                                        <div className="mt-4 flex items-center gap-3">
                                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)] rounded-full" 
                                                    style={{ width: `${percentWatched}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black text-violet-400 min-w-[32px] text-right">
                                                {Math.round(percentWatched)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
