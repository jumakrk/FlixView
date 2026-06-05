'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { MediaType } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface ProgressManagerProps {
    id: string;
    type: MediaType;
    season: number;
    episode: number;
    title: string;
    posterPath?: string | null;
    backdropPath?: string | null;
    onStartTimeFound: (time: number) => void;
    checkResume?: boolean;
}

export default function ProgressManager({
    id, type, season, episode,
    title, posterPath, backdropPath,
    onStartTimeFound,
    checkResume
}: ProgressManagerProps) {
    const { getProgress, updateProgress } = useData();
    const router = useRouter();

    // Auto-Redirect Effect
    useEffect(() => {
        if (checkResume && type === 'tv') {
            const record = getProgress(id, type);
            if (record && record.season && record.episode) {
                // If we have history, and user didn't specify S/E (implied by checkResume), redirect!
                if (record.season !== 1 || record.episode !== 1) {
                    // Prevent infinite loop if already there? 
                    // checkResume is passed as !seasonParam && !episodeParam.
                    // If we redirect, params will be present, so checkResume becomes false on next load.
                    // Wait, next load is a FULL page reload or client nav?
                    // Client nav. WatchClient unmounts/remounts.
                    // New WatchClient instance will have params. checkResume = false.
                    // Correct.
                    router.replace(`/watch?type=tv&id=${id}&season=${record.season}&episode=${record.episode}`);
                }
            }
        }
    }, [checkResume, id, type, getProgress, router]);

    // Active Polling for players that don't emit timeupdate natively (like Cinemaos)
    useEffect(() => {
        const interval = setInterval(() => {
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                if (iframe.src.includes('cinemaos.tech')) {
                    iframe.contentWindow?.postMessage({ command: 'getStatus' }, '*');
                }
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Throttling Ref
    const lastUpdateTime = useRef(0);
    const THROTTLE_INTERVAL = 1000; // 1 second
    const hasLoadedStart = useRef(false);

    // 1. Initial Load of Progress
    useEffect(() => {
        if (hasLoadedStart.current) return;

        const record = getProgress(id, type);
        if (record) {
            let current = 0;
            let duration = 0;

            if (type === 'movie') {
                current = record.watched_seconds;
                duration = record.duration_seconds;
            } else {
                const epKey = `s${season}e${episode}`;
                const epProgress = record.episodes?.[epKey];
                if (epProgress) {
                    current = epProgress.watched_seconds;
                    duration = epProgress.duration_seconds;
                }
            }

            if (current > 0 && duration > 0) {
                const pct = (current / duration) * 100;
                if (pct > 0.01 && pct < 99.9) {
                    onStartTimeFound(current);
                }
            }
        }
        hasLoadedStart.current = true;
    }, [id, type, season, episode, getProgress, onStartTimeFound]);


    // 2. Event Listener
    const handleMessage = useCallback((event: MessageEvent) => {
        const { origin } = event;
        let data = event.data;
        
        // Parse data if it's a string (VidKing format)
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                // Ignore parsing errors for non-JSON strings
                return;
            }
        }

        const vidfastOrigins = [
            'https://vidfast.pro', 'https://vidfast.in', 'https://vidfast.io', 
            'https://vidfast.me', 'https://vidfast.net', 'https://vidfast.pm', 'https://vidfast.xyz'
        ];

        const trustedOrigins = [
            'https://vidnest.fun', 'https://vidrush.net', 'https://player.vidrush.net',
            'https://vidup.to', 'https://vidup.io', 'https://vidup.me', 'https://vidrock.ru',
            'https://www.vidking.net', 'https://peachify.top', 'https://cinemaos.tech',
            ...vidfastOrigins
        ];

        if (!trustedOrigins.includes(origin) || !data) return;

        // Special VidRock progress synchronization
        if (origin === 'https://vidrock.ru' && data?.type === 'MEDIA_DATA') {
            try {
                localStorage.setItem('vidRockProgress', JSON.stringify(data.data));
            } catch (e) {
                console.error('Failed to sync VidRock progress:', e);
            }
            return;
        }

        // Special VidFast progress synchronization
        if (vidfastOrigins.includes(origin) && data?.type === 'MEDIA_DATA') {
            try {
                localStorage.setItem('vidFastProgress', JSON.stringify(data.data));
            } catch (e) {
                console.error('Failed to sync VidFast progress:', e);
            }
            return;
        }

        // Special VidUp progress synchronization
        if (origin.includes('vidup') && data?.type === 'MEDIA_DATA') {
            try {
                localStorage.setItem('vidUpProgress', JSON.stringify(data.data));
            } catch (e) {
                console.error('Failed to sync VidUp progress:', e);
            }
            return;
        }

        // Special Peachify progress synchronization
        if (origin === 'https://peachify.top' && data?.type === 'MEDIA_DATA') {
            try {
                localStorage.setItem('peachifyProgress', JSON.stringify(data.data));
            } catch (e) {
                console.error('Failed to sync Peachify progress:', e);
            }
            return;
        }

        // Special Cinemaos progress synchronization
        if (origin === 'https://cinemaos.tech' && data?.type === 'MEDIA_DATA') {
            try {
                localStorage.setItem('cinemaosProgress', JSON.stringify(data.data));
            } catch (e) {
                console.error('Failed to sync Cinemaos progress:', e);
            }
            return;
        }

        // Detection: 
        // - VidNest: { event, currentTime, ... }
        // - VidUp: { type: 'PLAYER_EVENT', data: { event, ... } }
        // - VidRush: { type: 'WATCH_PROGRESS', data: { eventType, ... } }
        const isVidNest = data.event && data.currentTime !== undefined;
        const isVidUp = data.type === 'PLAYER_EVENT' && data.data;
        const isVidRush = data.type === 'WATCH_PROGRESS' && data.data;

        if (isVidNest || isVidUp || isVidRush) {
            const playerEvent = isVidNest ? data.event : (isVidRush ? data.data.eventType : data.data.event);
            const currentTime = isVidNest ? data.currentTime : data.data.currentTime;
            const duration = isVidNest ? data.duration : data.data.duration;
            const playerSeason = isVidNest ? data.season : (isVidUp ? data.data.season : undefined);
            const playerEpisode = isVidNest ? data.episode : (isVidUp ? data.data.episode : undefined);
            const playerTmdbId = isVidNest ? String(data.tmdbId) : (isVidRush ? String(data.data.mediaId) : (isVidUp && (data.data.tmdbId || data.data.id) ? String(data.data.tmdbId || data.data.id) : id));

            // Security check: ensure tmdbId matches current page id (if reported)
            if (playerTmdbId && playerTmdbId !== id) return;

            // Use player reported S/E if available, otherwise fallback to props
            const currentSeason = playerSeason || season;
            const currentEpisode = playerEpisode || episode;

            if (type === 'tv' && (String(currentSeason) !== String(season) || String(currentEpisode) !== String(episode))) {
                // The iframe navigated to a new episode internally (auto-next or built-in button).
                // We MUST sync the host app's URL to match the iframe, and force a clean re-mount.
                // This ensures startAt parameter logic works properly for every episode.
                const source = new URLSearchParams(window.location.search).get('source');
                const sourceParam = source ? `&source=${source}` : '';
                router.replace(`/watch?type=tv&id=${id}&season=${currentSeason}&episode=${currentEpisode}${sourceParam}`);
                return;
            }

            const save = (): boolean => {
                if (currentTime === undefined || currentTime === null || currentTime <= 0 || !duration) return false;

                const epKey = `s${currentSeason}e${currentEpisode}`;

                const episodesUpdate = type === 'tv' ? {
                    [epKey]: {
                        season_number: currentSeason,
                        episode_number: currentEpisode,
                        watched_seconds: currentTime,
                        duration_seconds: duration
                    }
                } : undefined;

                updateProgress({
                    media_id: id,
                    media_type: type,
                    season: type === 'tv' ? currentSeason : undefined,
                    episode: type === 'tv' ? currentEpisode : undefined,
                    watched_seconds: currentTime,
                    duration_seconds: duration,
                    episodes: episodesUpdate,
                    media_data: {
                        title,
                        poster_path: posterPath ?? undefined,
                        backdrop_path: backdropPath ?? undefined,
                        media_type: type
                    }
                });
                return true;
            };

            if (playerEvent === 'timeupdate' || playerEvent === 'playerstatus') {
                const now = Date.now();
                if (lastUpdateTime.current === 0 || (now - lastUpdateTime.current > THROTTLE_INTERVAL)) {
                    if (save()) {
                        lastUpdateTime.current = now;
                    }
                }
            } else if (playerEvent === 'pause' || playerEvent === 'ended') {
                save();
            }

            // Navigation Logic
            if (playerEvent === 'ended' || playerEvent === 'next') {
                if (type === 'tv') {
                    router.replace(`/watch?type=tv&id=${id}&season=${currentSeason}&episode=${currentEpisode + 1}`);
                }
            } else if (playerEvent === 'episode' || (isVidNest && playerEvent === 'change-episode')) {
                const newSeason = isVidNest ? data.season : (data.data as any).season;
                const newEpisode = isVidNest ? data.episode : (data.data as any).episode;
                if (newSeason && newEpisode && (newSeason !== season || newEpisode !== episode)) {
                    router.replace(`/watch?type=tv&id=${id}&season=${newSeason}&episode=${newEpisode}`);
                }
            }
        }
    }, [id, type, season, episode, title, posterPath, backdropPath, router, updateProgress]);

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    return null; // Logic only
}
