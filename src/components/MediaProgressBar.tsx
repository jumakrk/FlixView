'use client';

import { useData } from '@/context/DataContext';
import { getLastWatchedEpisode, isEpisodicType, MediaType } from '@/lib/types';
import { cn } from '@/lib/utils'; // Keep className utility

interface MediaProgressBarProps {
    id: string | number;
    type: MediaType;
    className?: string;
    season?: number;
    episode?: number;
}

export default function MediaProgressBar({ id, type, className, season, episode }: MediaProgressBarProps) {
    const { getProgress } = useData();

    // Derived from context on every render — DataContext updates trigger a
    // re-render, so no local state/effects are needed here.
    const record = getProgress(id.toString(), type);

    let progressPct = 0;
    let label: string | null = null;

    if (record) {
        let current = 0;
        let duration = 0;

        if (isEpisodicType(type)) {
            if (season && episode) {
                // Specific episode requested (episode list context) — no label.
                const epProgress = record.episodes?.[`s${season}e${episode}`];
                if (epProgress) {
                    current = epProgress.watched_seconds;
                    duration = epProgress.duration_seconds;
                }
            } else {
                // Overall show (resume point) — label the resume point.
                current = record.watched_seconds;
                duration = record.duration_seconds;
                if (record.season && record.episode) {
                    label = type === 'anime'
                        ? `E${record.episode}`
                        : `S${record.season} E${record.episode}`;
                } else if (type === 'anime') {
                    const lastSE = getLastWatchedEpisode(record);
                    label = `E${lastSE.episode}`;
                }
            }
        } else {
            // Movie
            current = record.watched_seconds;
            duration = record.duration_seconds;
        }

        if (duration > 0 && current > 0) {
            progressPct = Math.min((current / duration) * 100, 100);
        }
    }

    if (progressPct <= 0) return null;

    return (
        <div className={cn("flex items-center gap-3 w-full mt-3", className)}>
            <div className="flex-1 h-1 bg-gray-700/50 rounded-full backdrop-blur-sm overflow-hidden">
                <div
                    className="h-full bg-violet-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                />
            </div>
            <span className="text-xs font-medium text-gray-400 min-w-fit text-right whitespace-nowrap">
                {label && <span className="text-violet-400 mr-1">{label} |</span>}
                {Math.round(progressPct)}%
            </span>
        </div>
    );
}
