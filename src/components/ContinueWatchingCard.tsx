'use client';

import { memo } from 'react';
import Link from 'next/link';
import { X, Info } from 'lucide-react';
import { ProgressRecord } from '@/lib/types';
import { useData } from '@/context/DataContext';
import styles from './MovieCard.module.css'; // Reuse basic card styles but add custom overlays inline or new module

interface ContinueWatchingCardProps {
    record: ProgressRecord;
    className?: string;
}

function ContinueWatchingCard({ record, className }: ContinueWatchingCardProps) {
    const { removeProgress } = useData();
    const imageBaseUrl = 'https://image.tmdb.org/t/p/w500';

    const mediaData = record.media_data || {};
    const title = mediaData.title || mediaData.name || 'Unknown';
    // Use poster from media_data if available, otherwise just use what we have (we might need to fetch if missing? 
    // DataContext sync sets media_data.posterPath if list item, but progress might rely on client sending it.
    // WatchClient currently sends empty media_data.
    // Ideally we should have poster path. If missing, it's a placeholder.
    // For now assume media_data has it or fallback.
    const imagePath = mediaData.poster_path || mediaData.posterPath || mediaData.backdrop_path;
    const imageUrl = imagePath ? `${imageBaseUrl}${imagePath}` : '/placeholder-movie.jpg';

    const isTv = record.media_type === 'tv';

    // Resume Link
    const resumeLink = isTv
        ? `/watch?type=tv&id=${record.media_id}&season=${record.season || 1}&episode=${record.episode || 1}&source=home`
        : `/watch?type=movie&id=${record.media_id}&source=home`;

    // Info Link
    const infoLink = `/details?type=${isTv ? 'series' : 'movie'}&id=${record.media_id}`;

    // Progress Calculation
    // Ensure duration > 0 to avoid NaN
    const pct = record.duration_seconds > 0
        ? Math.min(100, Math.max(0, (record.watched_seconds / record.duration_seconds) * 100))
        : 0;

    const handleRemove = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        removeProgress(record.media_id, record.media_type);
    };

    return (
        <div className={`${styles.card} ${className || ''} group relative`}>
            {/* Main Resume Link */}
            <Link href={resumeLink} className={styles.link}>
                <div
                    className={styles.image}
                    style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
                <div className={styles.overlay} />

                {/* Content (Title etc) - Optional, maybe just progress bar is cleaner? 
                    User asked for "Progress bar indicator on the bottom side of the poster".
                    And buttons on top.
                    Let's keep title hidden or minimal if they want just a row of posters.
                    But usually titles are good. Reuse styles.content.
                */}
                <div className={styles.content}>
                    <h3 className={styles.title}>{title}</h3>
                    {isTv && record.season && (
                        <p className="text-xs text-white/70 mt-1">S{record.season} E{record.episode}</p>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div
                        className="h-full bg-violet-600 shadow-[0_0_10px_rgba(124,58,237,0.5)]"
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
