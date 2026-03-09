'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import ProgressManager from '@/components/ProgressManager';
import { ArrowLeft } from 'lucide-react';
import { useState, useCallback } from 'react';
import { MediaType } from '@/lib/types';

interface WatchClientProps {
    id: string;
    type: MediaType;
    title: string;
    posterPath?: string | null;
    backdropPath?: string | null;
}

export default function WatchClient({ id, type, title, posterPath, backdropPath }: WatchClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const seasonParam = searchParams.get('season');
    const episodeParam = searchParams.get('episode');

    // Default to season 1, episode 1 if not present
    const season = seasonParam ? parseInt(seasonParam) : 1;
    const episode = episodeParam ? parseInt(episodeParam) : 1;

    // Check if we need to auto-redirect (if params were missing)
    const shouldCheckResume = !seasonParam && !episodeParam && type === 'tv';

    const [startTime, setStartTime] = useState(0);
    const [isPlayerActive, setIsPlayerActive] = useState(false);

    // Initial Start Time Loaded Callback
    const handleStartTimeFound = useCallback((time: number) => {
        setStartTime(time);
        // We can activate player now or just let it init
    }, []);

    const handleBack = () => {
        // "Rewind" approach:
        // The iframe (VidFast) pollutes history with multiple entries (one per episode).
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
                    else router.replace(`/details/${type === 'tv' ? 'series' : 'movie'}/${id}`);
                    return;
                }

                // Go back one step and check again
                window.history.back();
                setTimeout(checkExit, 20); // Quick check
            } else {
                // We successfully exited!
                // No action needed, browser handles render of new page
            }
        };

        checkExit();
    };

    // Also activate player immediately on mount (or after brief delay for start time?)
    // Actually, we want to wait for start time if possible?
    // But existing logic set isPlayerActive(true) after effect.
    // ProgressManager runs effect on mount.
    // If we want to wait, we can set isPlayerActive(true) inside handleStartTimeFound?
    // But if NO progress, handleStartTimeFound never called.
    // So we should just default 0 and render.
    // Ideally, ProgressManager should tell us "done checking".

    // For now, let's keep it simple: Render player immediately (startTime 0). 
    // If handleStartTimeFound fires quickly, it might reload iframe?
    // Changing key or properties reloads iframe.
    // startTime is passed to VideoPlayer.
    // If startTime changes from 0 to 123, VideoPlayer re-renders -> Iframe Reloads.
    // This is EXPECTED for initial resume.
    // But it happens only ONCE.

    // To avoid double load, we can delay rendering until "checked".
    // But for speed, let's just render.

    return (
        <div className="relative w-full h-[85vh] bg-black flex flex-col rounded-3xl overflow-hidden border border-white/5 shadow-2xl mb-8">
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
            />

            {/* Top Navigation Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <button
                    onClick={handleBack}
                    className="pointer-events-auto p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md text-white transition-all flex items-center gap-2 group"
                >
                    <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium pr-1">Back</span>
                </button>
            </div>

            {/* Video Player - Full Screen */}
            <div className={`w-full h-full opacity-100 transition-opacity duration-500`}>
                <VideoPlayer
                    key={`${id}-${type}-${season}-${episode}`}
                    tmdbId={id}
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
