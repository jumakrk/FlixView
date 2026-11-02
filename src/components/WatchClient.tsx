'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import ProgressManager from '@/components/ProgressManager';
import { useState, useCallback } from 'react';
import { MediaType, isEpisodicType } from '@/lib/types';

interface WatchClientProps {
    id: string;
    type: MediaType;
    title: string;
    posterPath?: string | null;
    backdropPath?: string | null;
    maxEpisode?: number;
    /** AniList movies have no episodes. */
    isAnimeMovie?: boolean;
}

export default function WatchClient({ id, type, title, posterPath, backdropPath, maxEpisode, isAnimeMovie }: WatchClientProps) {
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
            if (/^\/watch(\/|$)/.test(window.location.pathname)) {
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
        <div className="w-full mb-8 pt-4">
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

            {/* Video Player. Its own top bar shows the title and a Back arrow
                (exit=1), which leaves the watch page through handleBack, so
                the page draws no chrome above it and the player gets the
                space. No overlay covers the player's controls. */}
            <div className="relative h-[85vh] min-h-[380px] max-h-[1000px] w-full overflow-hidden rounded-3xl border border-white/5 bg-black shadow-2xl">
                <VideoPlayer
                    key={`${id}-${type}-${season}-${episode}`}
                    mediaId={id}
                    type={type}
                    season={season}
                    episode={episode}
                    isAnimeMovie={isAnimeMovie}
                    className="w-full h-full rounded-none border-none"
                    startTime={startTime}
                    onExit={handleBack}
                />
            </div>
        </div>
    );
}
