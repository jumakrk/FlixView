'use client';

import { cn } from "@/lib/utils";
import { buildPlayerUrl } from "@/lib/player";
import { MediaType } from "@/lib/types";

interface VideoPlayerProps {
    /** TMDB ID for movies/TV, AniList ID for anime. */
    mediaId: string | number;
    type?: MediaType;
    season?: number;
    episode?: number;
    audio?: 'sub' | 'dub';
    className?: string;
    startTime?: number;
}

import { memo, useEffect, useState } from 'react';

function VideoPlayer({
    mediaId,
    type = 'movie',
    season = 1,
    episode = 1,
    audio = 'dub',
    className,
    startTime = 0
}: VideoPlayerProps) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const purgeAndReady = async () => {
            if (typeof window !== 'undefined' && window.electron && window.electron.purgePlayerCache) {
                try {
                    // The player remembers resume positions per title. FlixView
                    // owns progress, so its cache is wiped before every mount.
                    await window.electron.purgePlayerCache('all');
                } catch (e) {
                    console.error('Failed to purge player cache before mount', e);
                }
            }
            if (isMounted) setIsReady(true);
        };

        // WatchClient keys this component per (id, type, season, episode), so a
        // fresh mount already starts with isReady=false — no synchronous
        // setState is needed here.
        purgeAndReady();

        return () => { isMounted = false; };
    }, [mediaId, season, episode, type]);

    // Vidly embed. The URL (aurora theme, app accent colour, autoplay, next
    // episode, disabled audio picker and the always-present resume position) is
    // built in @/lib/player so it can be asserted without a browser.
    const src = buildPlayerUrl({ mediaId, type, season, episode, audio, startTime });

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
                title={`Video Player ${mediaId}`}
                style={{ border: 'none' }}
                scrolling="no"
            />
        </div>
    );
}

export default memo(VideoPlayer);
