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
    const baseUrl = 'https://vidrock.ru';
    // Theme white, Autoplay true, Autonext true, download false, next button true, episode selector true, lang en
    const commonQuery = 'autoplay=true&autonext=true&theme=ffffff&download=false&nextbutton=true&episodeselector=true&lang=en';
    
    // VidRock URL Patterns
    const src = type === 'movie'
        ? `${baseUrl}/movie/${tmdbId}?${commonQuery}`
        : `${baseUrl}/tv/${tmdbId}/${season}/${episode}?${commonQuery}`;

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
