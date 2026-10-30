'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import ProgressManager from '@/components/ProgressManager';
import { ArrowLeft } from 'lucide-react';
import { useState, useCallback } from 'react';
import { MediaType, isEpisodicType } from '@/lib/types';

interface WatchClientProps {
    id: string;
    type: MediaType;
    title: string;
    posterPath?: string | null;
    backdropPath?: string | null;
    maxEpisode?: number;
}

export default function WatchClient({ id, type, title, posterPath, backdropPath, maxEpisode }: WatchClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const seasonParam = searchParams.get('season');
    const episodeParam = searchParams.get('episode');

    // Default to season 1, episode 1 if not present
    const season = seasonParam ? parseInt(seasonParam) : 1;
    const episode = episodeParam ? parseInt(episodeParam) : 1;

    // Check if we need to auto-redirect (if params were missing)
    const shouldCheckResume = !seasonParam && !episodeParam && isEpisodicType(type);

    const [startTime, setStartTime] = useState(0);

    // Initial Start Time Loaded Callback
    const handleStartTimeFound = useCallback((time: number) => {
        setStartTime(time);
        // We can activate player now or just let it init
    }, []);

    const handleBack = () => {
        // "Rewind" approach:
        // The player iframe can pollute history with multiple entries (one per episode).
        // Standard router.back() gets trapped in these entries.
        // router.replace() creates duplicate history entries (Details -> Details), requiring double clicks.
        // Solution: Recursively call back() until we are no longer on the watch page.

        const maxAttempts = 50; // Safety limit
        let attempts = 0;

        // Helper to check if we have escaped
        const checkExit = () => {
            attempts++;
            // If we are still on a watch URL
            if (window.location.pathname.includes('/watch/')) {
                if (attempts > maxAttempts) {
                    // Fail safe: Force replace if we are stuck deeply
                    const source = searchParams.get('source');
                    if (source === 'home') router.replace('/');
                    else router.replace(`/details?type=${type === 'tv' ? 'series' : type}&id=${id}`);
                    return;
                }

                // Go back one step and check again
                window.history.back();
                setTimeout(checkExit, 20); // Quick check
            }
        };

        checkExit();
    };

    return (
        <div className="w-full mb-8">
            {/* Logic Component (Hidden) */}
            <ProgressManager
                id={id}
                type={type}
                season={season}
                episode={episode}
                title={title}
                posterPath={posterPath}
                backdropPath={backdropPath}
                onStartTimeFound={handleStartTimeFound}
                checkResume={shouldCheckResume}
                maxEpisode={maxEpisode}
            />

            {/* Player chrome lives above the video so it never covers the
                stream's own top controls (or the title). */}
            <div className="flex items-center justify-between gap-4 px-1 pb-3">
                <button
                    onClick={handleBack}
                    aria-label="Back to details"
                    className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-sm font-semibold text-white/85 backdrop-blur-md transition-colors hover:border-violet-400/40 hover:bg-white/10 hover:text-white"
                >
                    <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                    <span>Back</span>
                </button>

                <div className="hidden min-w-0 items-center gap-2 text-xs font-medium text-white/45 sm:flex">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(124,58,237,0.8)]" />
                    <span className="shrink-0 uppercase tracking-[0.16em]">Now playing</span>
                    <span className="h-3 w-px bg-white/15" />
                    <span className="truncate text-white/70">{title}</span>
                    {isEpisodicType(type) && (
                        <span className="shrink-0 text-white/40">· S{season} E{episode}</span>
                    )}
                </div>
            </div>

            {/* Video Player — no top gradient overlay so the provider's own
                controls stay fully visible. */}
            <div className="relative h-[calc(85vh-56px)] min-h-[380px] max-h-[960px] w-full overflow-hidden rounded-3xl border border-white/5 bg-black shadow-2xl">
                <VideoPlayer
                    key={`${id}-${type}-${season}-${episode}`}
                    mediaId={id}
                    type={type}
                    season={season}
                    episode={episode}
                    className="w-full h-full rounded-none border-none"
                    startTime={startTime}
                />
            </div>
        </div>
    );
}
