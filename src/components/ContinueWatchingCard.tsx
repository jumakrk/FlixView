'use client';

import { memo } from 'react';
import Link from 'next/link';
import { X, Info } from 'lucide-react';
import { ProgressRecord, getLastWatchedEpisode, isEpisodicType, MediaType } from '@/lib/types';
import { resolveImageUrl } from '@/lib/images';
import { useData } from '@/context/DataContext';
import styles from './MovieCard.module.css'; // Reuse basic card styles but add custom overlays inline or new module

interface ContinueWatchingCardProps {
    record: ProgressRecord;
    className?: string;
}

function ContinueWatchingCard({ record, className }: ContinueWatchingCardProps) {
    const { removeProgress } = useData();

    const mediaData = record.media_data || {};
    const title = mediaData.title || mediaData.name || 'Unknown';

    // Supports both TMDB relative paths and absolute AniList poster URLs.
    const imagePath = mediaData.poster_path || mediaData.posterPath || mediaData.backdrop_path;
    const imageUrl = imagePath ? resolveImageUrl(imagePath, 'w342') : null;

    // Older builds stored TV shows as 'series'.
    const mediaType: MediaType = (record.media_type as string) === 'series' ? 'tv' : record.media_type;
    const episodic = isEpisodicType(mediaType);
    const isAnime = mediaType === 'anime';

    // For episodic content, always resume from the most recently watched
    // episode (computed from per-episode progress), not just a stale
    // season/episode pointer.
    const lastSE = getLastWatchedEpisode(record);
    const resumeSeason = episodic ? lastSE.season : 1;
    const resumeEpisode = episodic ? lastSE.episode : 1;

    // Resume Link
    const resumeParams = new URLSearchParams({
        type: mediaType,
        id: record.media_id,
        source: 'home'
    });
    if (episodic) {
        resumeParams.set('season', String(resumeSeason));
        resumeParams.set('episode', String(resumeEpisode));
    }
    const resumeLink = `/watch?${resumeParams.toString()}`;

    // Info Link
    const detailType = isAnime ? 'anime' : mediaType === 'tv' ? 'series' : 'movie';
    const infoLink = `/details?type=${detailType}&id=${record.media_id}`;

    // Progress Calculation
    // Ensure duration > 0 to avoid NaN
    const pct = record.duration_seconds > 0
        ? Math.min(100, Math.max(0, (record.watched_seconds / record.duration_seconds) * 100))
        : 0;

    const handleRemove = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        removeProgress(record.media_id, mediaType);
    };

    return (
        <div className={`${styles.card} ${className || ''} group relative overflow-hidden rounded-2xl shadow-[0_8px_22px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.07] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:ring-violet-300/40`}>
            {/* Main Resume Link */}
            <Link href={resumeLink} className={styles.link}>
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
                <div className={`${styles.overlay} opacity-100!`} />

                <div className={`${styles.content} opacity-100! [transform:none]!`}>
                    <h3 className={styles.title}>{title}</h3>
                    {episodic && (
                        <p className="text-xs text-white/70 mt-1">
                            {isAnime ? `E${resumeEpisode}` : `S${resumeSeason} E${resumeEpisode}`}
                        </p>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div
                        className="h-full bg-violet-600 shadow-[0_0_10px_rgba(31,128,115,0.5)]"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </Link>

            {/* Actions (Floating above Link) */}

            {/* Info Icon (Top Left) */}
            <Link
                href={infoLink}
                className="absolute top-2 left-2 p-1.5 rounded-full bg-black/60 hover:bg-violet-600 text-white transition-colors z-20 opacity-0 group-hover:opacity-100"
                title="Info"
            >
                <Info size={16} />
            </Link>

            {/* Remove Icon (Top Right) */}
            <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-red-600 text-white transition-colors z-20 opacity-0 group-hover:opacity-100"
                title="Remove from history"
            >
                <X size={16} />
            </button>
        </div>
    );
}

export default memo(ContinueWatchingCard);
