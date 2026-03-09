'use client';

import { Play } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useData } from '@/context/DataContext';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

import Countdown from './Countdown';

interface PlayButtonProps {
    id: string | number;
    type?: 'movie' | 'tv';
    className?: string;
    label?: string;
    season?: number;
    episode?: number;
    iconOnly?: boolean;
    releaseDate?: string;
}

export default function PlayButton({
    id,
    type = 'movie',
    className,
    label = 'Play',
    season,
    episode,
    iconOnly = false,
    releaseDate
}: PlayButtonProps) {
    const { openPlayer } = usePlayer();
    const { getProgress } = useData();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Check for existing progress
    const progress = getProgress(id.toString(), type);

    // Determine target Season/Episode
    const isSpecificEpisode = season !== undefined || episode !== undefined;
    const targetSeason = isSpecificEpisode ? (season || 1) : (progress?.season || 1);
    const targetEpisode = isSpecificEpisode ? (episode || 1) : (progress?.episode || 1);

    // Resume Label Logic
    let buttonLabel = label;
    if (mounted && !isSpecificEpisode) {
        if (type === 'tv' && progress?.season && progress?.episode) {
            if (progress.watched_seconds > 0) {
                buttonLabel = `Resume S${progress.season} E${progress.episode}`;
            }
        } else if (type === 'movie' && progress && progress.watched_seconds > 0) {
            buttonLabel = 'Resume';
        }
    }

    // Check if unreleased
    const isUnreleased = releaseDate ? new Date(releaseDate) > new Date() : false;

    if (isUnreleased && releaseDate) {
        return (
            <div className={cn("flex flex-col items-center md:items-start gap-1", className && !className.includes('playBtn') && className)}>
                <div 
                    className={cn(
                        "flex flex-col items-center justify-center rounded-xl font-bold bg-white/5 backdrop-blur-xl border border-white/10 text-white/40 cursor-not-allowed transition-all",
                        !iconOnly ? "px-8 py-4 min-w-[200px]" : "p-3"
                    )}
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
                >
                    {!iconOnly && (
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/60 mb-1">
                            Coming Soon
                        </span>
                    )}
                    <Countdown targetDate={releaseDate} compact={iconOnly} />
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => openPlayer(id.toString(), type, targetSeason, targetEpisode)}
            className={cn(
                "relative flex items-center gap-2 rounded-xl font-bold transition-all group whitespace-nowrap",
                className,
                !iconOnly && "px-6 py-3",
                // Highlight "resume" buttons differently? Optional.
                // Current style: Primary action.
            )}
        >
            <div className="flex items-center gap-2">
                <Play size={iconOnly ? 20 : 24} fill="currentColor" />
                {!iconOnly && buttonLabel}
            </div>
        </button>
    );
}
