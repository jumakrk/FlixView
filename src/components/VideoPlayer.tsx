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
    const purpleTheme = '7c3aed';
    const timeParam = `&startAt=${startTime}`;
    // User requested: PURPLE THEME, AUTOPLAY TRUE, SERVER Alpha, hideServer true, sub en, title true, poster true, chromecast false
    const sharedParams = `&autoPlay=true&theme=${purpleTheme}&server=Alpha&hideServer=true&sub=en&title=true&poster=true&chromecast=false${timeParam}`;

    const src = type === 'movie'
        ? `${baseUrl}/movie/${tmdbId}?${sharedParams.substring(1)}`
        : `${baseUrl}/tv/${tmdbId}/${season}/${episode}?${sharedParams.substring(1)}&nextButton=true&autoNext=true`;

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
            />
        </div>
    );
}

export default memo(VideoPlayer);
