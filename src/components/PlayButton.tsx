'use client';

import { Play } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useData } from '@/context/DataContext';
import { getLastWatchedEpisode } from '@/lib/types';
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
    const resumeSE = getLastWatchedEpisode(progress);
    const targetSeason = isSpecificEpisode ? (season || 1) : resumeSE.season;
    const targetEpisode = isSpecificEpisode ? (episode || 1) : resumeSE.episode;

    // Resume Label Logic
    let buttonLabel = label;
    if (mounted && !isSpecificEpisode) {
        if (type === 'tv' && resumeSE) {
            if (progress && progress.watched_seconds > 0) {
                buttonLabel = `Resume S${resumeSE.season} E${resumeSE.episode}`;
            }
        } else if (type === 'movie' && progress && progress.watched_seconds > 0) {
            buttonLabel = 'Resume';
        }
    }

    // Check if unreleased
    const isUnreleased = releaseDate ? new Date(releaseDate) > new Date() : false;

    if (isUnreleased && releaseDate) {
        return (
            <div 
                className={cn("flex flex-col items-center md:items-start gap-1", className)}
                style={{ background: 'transparent', padding: 0, border: 'none', width: '100%' }}
            >
                <div 
                    className={cn(
                        "flex flex-col items-center justify-center rounded-xl font-bold bg-black/60 backdrop-blur-xl border border-white/10 cursor-not-allowed transition-all w-full",
                        !iconOnly ? "px-8 py-4 min-w-[200px]" : "p-3"
                    )}
                    style={{ color: 'rgba(255,255,255,0.9)' }}
                >
                    {!iconOnly && (
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500 mb-1">
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
