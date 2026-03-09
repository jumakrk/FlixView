'use client';

import { useEffect, useState } from 'react';
import { useData } from '@/context/DataContext';
import { cn } from '@/lib/utils'; // Keep className utility

interface MediaProgressBarProps {
    id: string | number;
    type: 'movie' | 'tv';
    className?: string;
    season?: number;
    episode?: number;
}

export default function MediaProgressBar({ id, type, className, season, episode }: MediaProgressBarProps) {
    const { getProgress } = useData();
    const [progressPct, setProgressPct] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [label, setLabel] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const record = getProgress(id.toString(), type);

        if (record) {
            let current = 0;
            let duration = 0;
            let currentLabel = null;

            if (type === 'tv') {
                if (season && episode) {
                    // Check specific episode
                    const epKey = `s${season}e${episode}`;
                    const epProgress = record.episodes?.[epKey];
                    if (epProgress) {
                        current = epProgress.watched_seconds;
                        duration = epProgress.duration_seconds;
                        // If specific episode requested, we usually don't need label as context implies it
                        // But user requested "S2 E3 | 20%" for details page specifically
                        // Details page passes "Main Show ID" but MIGHT NOT pass season/episode props?
                        // If S/E props passed, we are likely in Episode List => Dont show label?
                        // If S/E props NOT passed, we are in Hero/Details Header => Show Label (Resume Point)
                        if (!season && !episode) {
                            // Actually this block is 'if season && episode'. So we are specific.
                        }
                    }
                } else {
                    // Check overall show (resume point)
                    current = record.watched_seconds;
                    duration = record.duration_seconds;

                    // Derive label from resume point
                    if (record.season && record.episode) {
                        currentLabel = `S${record.season} E${record.episode}`;
                    }
                }
            } else {
                // Movie
                current = record.watched_seconds;
                duration = record.duration_seconds;
            }

            if (duration > 0 && current > 0) {
                setProgressPct(Math.min((current / duration) * 100, 100));
                setLabel(currentLabel);
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        } else {
            setIsVisible(false);
        }
    }, [id, type, season, episode, getProgress, mounted]);

    if (!isVisible || progressPct <= 0) return null;

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
