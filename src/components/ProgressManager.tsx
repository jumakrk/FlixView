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

    // Throttling Ref
    const lastUpdateTime = useRef(0);
    const THROTTLE_INTERVAL = 5000; // 5 seconds
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
        const { origin, data } = event;
        const vidupOrigins = [
            'https://vidup.to', 'https://vidup.io', 'https://vidup.me', 'https://vidup.net'
        ];

        if (!vidupOrigins.includes(origin) || !data) return;

        if (data.type === 'PLAYER_EVENT') {
            // Extract season/episode from player data if available (trusted source for auto-play)
            const { event: playerEvent, currentTime, duration, season: playerSeason, episode: playerEpisode } = data.data;

            // Use player reported S/E if available, otherwise fallback to props
            // Ensuring we save the ACTUAL episode being played
            const currentSeason = playerSeason || season;
            const currentEpisode = playerEpisode || episode;

            const save = (): boolean => {
                if (!currentTime || currentTime < 1 || !duration) return false;

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

            if (playerEvent === 'timeupdate') {
                const now = Date.now();
                // Allow save if it's the first time (lastUpdateTime is 0) OR if interval passed
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
                    router.replace(`/watch?type=tv&id=${id}&season=${season}&episode=${episode + 1}`);
                }
            } else if (playerEvent === 'episode') {
                const { season: newSeason, episode: newEpisode } = data.data as any;
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
