'use client';

import { cn } from "@/lib/utils";

interface VideoPlayerProps {
    tmdbId: string | number;
    type?: 'movie' | 'tv';
    season?: number;
    episode?: number;
    className?: string;
    startTime?: number;
}

import { memo } from 'react';

// ... (props interface)

function VideoPlayer({
    tmdbId,
    type = 'movie',
    season = 1,
    episode = 1,
    className,
    startTime = 0
}: VideoPlayerProps) {

    // ... (logic)
    const baseUrl = 'https://vidup.to';
    // Parameters: title, poster, autoPlay, theme purple, server Deltta, hideServer, fullscreenButton, chromecast false, sub en
    const commonQuery = 'title=true&poster=true&autoPlay=true&theme=7c3aed&server=Deltta&hideServer=true&fullscreenButton=true&chromecast=false&sub=en';
    
    // VidUp URL Patterns
    const src = type === 'movie'
        ? `${baseUrl}/movie/${tmdbId}?${commonQuery}&startAt=${startTime}`
        : `${baseUrl}/tv/${tmdbId}/${season}/${episode}?${commonQuery}&startAt=${startTime}&nextButton=true&autoNext=true`;

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
