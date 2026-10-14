'use client';

import { cn } from "@/lib/utils";
import { buildPlayerUrl } from "@/lib/player";

interface VideoPlayerProps {
    tmdbId: string | number;
    type?: 'movie' | 'tv';
    season?: number;
    episode?: number;
    className?: string;
    startTime?: number;
}

import { memo, useEffect, useState } from 'react';

function VideoPlayer({
    tmdbId,
    type = 'movie',
    season = 1,
    episode = 1,
    className,
    startTime = 0
}: VideoPlayerProps) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const purgeAndReady = async () => {
            if (typeof window !== 'undefined' && window.electron && window.electron.purgePlayerCache) {
                try {
                    await window.electron.purgePlayerCache('all');
                } catch (e) {
                    console.error('Failed to purge player cache before mount', e);
                }
            }
            if (isMounted) setIsReady(true);
        };
        
        setIsReady(false);
        purgeAndReady();
        
        return () => { isMounted = false; };
    }, [tmdbId, season, episode, type]);

    // VidStuck embed. The URL (accent colour, branding, in-player episode
    // controls, overlay and the always-present resume position) is built in
    // @/lib/player so it can be asserted without a browser.
    const src = buildPlayerUrl({ tmdbId, type, season, episode, startTime });

    if (!isReady) {
        return (
            <div className={cn("relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center", className)}>
                <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className={cn("relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5", className)}>
            <iframe
                src={src}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                referrerPolicy="origin"
                title={`Video Player ${tmdbId}`}
                style={{ border: 'none' }}
                scrolling="no"
            />
        </div>
    );
}

export default memo(VideoPlayer);
