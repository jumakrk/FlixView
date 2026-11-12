'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Tv } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { AnimeEpisodeMeta, fetchAnimeEpisodeMeta } from '@/lib/anilist';
import { resolveImageUrl } from '@/lib/images';
import { getLastWatchedEpisode } from '@/lib/types';
import { cn } from '@/lib/utils';
import PlayButton from './PlayButton';
import Countdown from './Countdown';
// Same look as the TV show episode selector.
import styles from './SeasonSelector.module.css';

interface AnimeEpisodeListProps {
    animeId: string;
    /** Episodes that can be played now (aired so far for airing shows). */
    totalEpisodes: number;
    /** Highlighted episode (the one playing on the watch page). */
    currentEpisode?: number;
    /** Anime title, used as the subtitle on each card. */
    title: string;
    /** Banner or cover, shown for episodes without their own thumbnail. */
    fallbackImage?: string | null;
    /** Next episode for airing shows, shown as a "Coming Soon" card. */
    nextAiringEpisode?: { episode: number; timeUntilAiring: number } | null;
    listClassName?: string;
}

// Episodes are grouped like TV seasons so long-running shows (1000+ episodes)
// stay fast: one range is rendered at a time and picked from the dropdown.
const RANGE_SIZE = 100;

interface EpisodeRange {
    start: number;
    end: number;
}

function buildRanges(total: number): EpisodeRange[] {
    const ranges: EpisodeRange[] = [];
    for (let start = 1; start <= total; start += RANGE_SIZE) {
        ranges.push({ start, end: Math.min(total, start + RANGE_SIZE - 1) });
    }
    return ranges.length ? ranges : [{ start: 1, end: 1 }];
}

function rangeIndexFor(episode: number, ranges: EpisodeRange[]): number {
    const index = ranges.findIndex(range => episode >= range.start && episode <= range.end);
    return index === -1 ? 0 : index;
}

export default function AnimeEpisodeList({
    animeId,
    totalEpisodes,
    currentEpisode,
    title,
    fallbackImage,
    nextAiringEpisode,
    listClassName,
}: AnimeEpisodeListProps) {
    const { getProgress } = useData();
    const record = getProgress(animeId, 'anime');

    const count = Math.max(1, totalEpisodes);
    const ranges = useMemo(() => buildRanges(count), [count]);

    // Open on the episode being watched, else the last one watched.
    const focusEpisode = currentEpisode ?? getLastWatchedEpisode(record)?.episode ?? 1;
    const [rangeIndex, setRangeIndex] = useState(() => rangeIndexFor(focusEpisode, ranges));
    const range = ranges[Math.min(rangeIndex, ranges.length - 1)];

    const [meta, setMeta] = useState<Record<number, AnimeEpisodeMeta>>({});
    useEffect(() => {
        let cancelled = false;
        fetchAnimeEpisodeMeta(animeId).then(result => {
            if (!cancelled) setMeta(result);
        });
        return () => { cancelled = true; };
    }, [animeId]);

    const episodes = useMemo(
        () => Array.from({ length: range.end - range.start + 1 }, (_, index) => range.start + index),
        [range]
    );

    // AniList reports "time until airing" relative to when it was fetched,
    // which is (close enough to) when this list mounted.
    const [mountedAt] = useState(() => Date.now());

    // The upcoming episode belongs at the end of the last range.
    const upcoming = nextAiringEpisode && nextAiringEpisode.episode === count + 1 && rangeIndex === ranges.length - 1
        ? {
            episode: nextAiringEpisode.episode,
            airsAt: new Date(mountedAt + nextAiringEpisode.timeUntilAiring * 1000).toISOString(),
        }
        : null;

    const fallback = fallbackImage ? resolveImageUrl(fallbackImage, 'w500') : null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Episodes</h2>
                {ranges.length > 1 && (
                    <div className={styles.selectWrapper}>
                        <select
                            value={rangeIndex}
                            onChange={(event) => setRangeIndex(parseInt(event.target.value, 10))}
                            className={styles.select}
                            aria-label="Episode range"
                        >
                            {ranges.map((item, index) => (
                                <option key={item.start} value={index}>
                                    Episodes {item.start}–{item.end}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className={styles.selectIcon} size={18} />
                    </div>
                )}
            </div>

            <div className={cn(styles.episodeList, listClassName)} data-lenis-prevent={listClassName ? '' : undefined}>
                {episodes.map((episodeNumber) => {
                    const episodeMeta = meta[episodeNumber];
                    const image = episodeMeta?.thumbnail || fallback;
                    const progress = record?.episodes?.[`s1e${episodeNumber}`];
                    const percentWatched = progress && progress.duration_seconds > 0
                        ? Math.min(100, Math.max(0, (progress.watched_seconds / progress.duration_seconds) * 100))
                        : 0;
                    const isCurrent = currentEpisode === episodeNumber;

                    return (
                        <div
                            key={episodeNumber}
                            className={cn(styles.episodeCard, isCurrent && 'border-violet-500/50! bg-violet-600/10!')}
                        >
                            <div className={styles.episodeImageContainer}>
                                {image ? (
                                    // AniList/Crunchyroll thumbnails come from several CDNs.
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={image}
                                        alt={episodeMeta?.title || `Episode ${episodeNumber}`}
                                        loading="lazy"
                                        className={cn(styles.episodeImage, !episodeMeta?.thumbnail && 'opacity-60')}
                                    />
                                ) : (
                                    <div className={styles.episodePlaceholder}>
                                        <Tv size={32} className="opacity-20" />
                                    </div>
                                )}
                                <div className={cn(styles.episodeOverlay, isCurrent && styles.episodeOverlayVisible)}>
                                    <PlayButton
                                        id={animeId}
                                        type="anime"
                                        season={1}
                                        episode={episodeNumber}
                                        className={styles.miniPlayBtn}
                                        iconOnly
                                    />
                                </div>
                            </div>
                            <div className={styles.episodeInfo}>
                                <div className={styles.episodeHeader}>
                                    <span className={styles.episodeNumber}>
                                        E{episodeNumber}{isCurrent ? ' · Now Playing' : ''}
                                    </span>
                                    <h3 className={styles.episodeName}>
                                        {episodeMeta?.title || `Episode ${episodeNumber}`}
                                    </h3>
                                </div>
                                <p className={styles.episodeOverview}>{title}</p>

                                {percentWatched > 0 && (
                                    <div className="mt-1 flex items-center gap-3">
                                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-violet-500 shadow-[0_0_8px_rgba(47,138,127,0.8)] rounded-full"
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

                {upcoming && (
                    <div className={styles.episodeCard}>
                        <div className={styles.episodeImageContainer}>
                            {fallback ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={fallback} alt="" loading="lazy" className={cn(styles.episodeImage, 'grayscale opacity-50')} />
                            ) : (
                                <div className={styles.episodePlaceholder}>
                                    <Tv size={32} className="opacity-20" />
                                </div>
                            )}
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Coming Soon</span>
                                <Countdown targetDate={upcoming.airsAt} compact />
                            </div>
                        </div>
                        <div className={styles.episodeInfo}>
                            <div className={styles.episodeHeader}>
                                <span className={styles.episodeNumber}>E{upcoming.episode}</span>
                                <h3 className={styles.episodeName}>Episode {upcoming.episode}</h3>
                            </div>
                            <p className={styles.episodeOverview}>{title}</p>
                            <div className={styles.episodeMeta}>
                                <span className="text-yellow-500 font-bold">
                                    {new Date(upcoming.airsAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
