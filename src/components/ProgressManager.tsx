'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { MediaType, getLastWatchedEpisode } from '@/lib/types';
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
    // Total episodes in the current season (used by other parts of the app).
    maxEpisode?: number;
}

export default function ProgressManager({
    id, type, season, episode,
    title, posterPath, backdropPath,
    onStartTimeFound,
    checkResume
}: ProgressManagerProps) {
    const { getProgress, updateProgress } = useData();
    const router = useRouter();

    // The episode we believe is currently playing. VidUp reports the
    // authoritative season/episode on EVERY PLAYER_EVENT, so internal switches
    // (the inbuilt next button, autoNext, the player's own episode selector)
    // are always reflected here without any guessing.
    const activeSeasonRef = useRef(season);
    const activeEpisodeRef = useRef(episode);

    // Last known playback position, used to finalize the previous episode when
    // the player moves to another one on its own.
    const lastTimeRef = useRef(0);
    const lastDurationRef = useRef(0);

    // Auto-Redirect Effect: if the user opens the show with no S/E, jump to the
    // most recently watched episode.
    useEffect(() => {
        if (checkResume && type === 'tv') {
            const record = getProgress(id, type);
            const lastSE = getLastWatchedEpisode(record);
            if (lastSE.season !== season || lastSE.episode !== episode) {
                router.replace(`/watch?type=tv&id=${id}&season=${lastSE.season}&episode=${lastSE.episode}`);
            }
        }
    }, [checkResume, id, type, season, episode, getProgress, router]);

    // Throttling Ref
    const lastUpdateTime = useRef(0);
    const THROTTLE_INTERVAL = 1000;
    // Tracks which (season, episode) we already loaded the start time for.
    const loadedStartKey = useRef('');

    // 1. Initial Load of Progress — reload whenever the episode changes.
    useEffect(() => {
        const key = `s${season}e${episode}`;
        if (loadedStartKey.current === key) return;
        loadedStartKey.current = key;

        // Adopt the URL episode as the one now playing. This runs on every
        // explicit episode change (and on first mount) and resets the playback
        // telemetry, so a freshly loaded player is never mistaken for an
        // internal episode switch.
        activeSeasonRef.current = season;
        activeEpisodeRef.current = episode;
        lastTimeRef.current = 0;
        lastDurationRef.current = 0;
        lastUpdateTime.current = 0;

        const record = getProgress(id, type);
        let current = 0;
        let duration = 0;

        if (record) {
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
        }

        if (current > 0 && duration > 0) {
            const pct = (current / duration) * 100;
            if (pct > 0.01 && pct < 99.9) {
                onStartTimeFound(current);
                return;
            }
        }

        // Always return an explicit value (0 when there is nothing to resume) so
        // a previous episode's startTime can never bleed into this one.
        onStartTimeFound(0);
    }, [id, type, season, episode, getProgress, onStartTimeFound]);

    // 2. Event Listener
    const handleMessage = useCallback((event: MessageEvent) => {
        // Accept messages from the VidUp player (with or without www).
        const origin = event.origin || '';
        if (!origin.includes('vidup.to')) return;

        let data = event.data;

        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                return;
            }
        }

        if (!data || typeof data !== 'object') return;

        // VidUp protocol:
        //   { type: 'PLAYER_EVENT', data: { event, currentTime, duration,
        //     tmdbId, mediaType, season, episode, playing, muted, volume } }
        if (data.type !== 'PLAYER_EVENT' || !data.data || typeof data.data !== 'object') return;
        const msg = data.data as any;

        // Security: only accept events for the content currently on this page.
        // VidUp reports tmdbId (falls back to id for older embeds).
        const msgId = msg.tmdbId !== undefined ? msg.tmdbId : msg.id;
        if (msgId !== undefined && String(msgId) !== String(id)) return;

        const saveEpisode = (s: number, e: number, time: number, dur: number): boolean => {
            if (time < 1 || dur < 1) return false;

            const epKey = `s${s}e${e}`;
            const episodesUpdate = type === 'tv' ? {
                [epKey]: {
                    season_number: s,
                    episode_number: e,
                    watched_seconds: time,
                    duration_seconds: dur
                }
            } : undefined;

            updateProgress({
                media_id: id,
                media_type: type,
                season: type === 'tv' ? s : undefined,
                episode: type === 'tv' ? e : undefined,
                watched_seconds: time,
                duration_seconds: dur,
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

        const currentTime = typeof msg.currentTime === 'number' ? msg.currentTime : (parseFloat(msg.currentTime) || 0);
        const duration = typeof msg.duration === 'number' ? msg.duration : (parseFloat(msg.duration) || 0);
        const playerEvent = msg.event || '';

        // The player tells us which episode it is actually playing.
        const reportedSeason = msg.season !== undefined ? parseInt(msg.season) : NaN;
        const reportedEpisode = msg.episode !== undefined ? parseInt(msg.episode) : NaN;
        const hasReportedSE = !isNaN(reportedSeason) && !isNaN(reportedEpisode) && reportedSeason > 0 && reportedEpisode > 0;

        const currentSeason = hasReportedSE ? reportedSeason : activeSeasonRef.current;
        const currentEpisode = hasReportedSE ? reportedEpisode : activeEpisodeRef.current;

        // --- Internal episode switch (autoNext / inbuilt next button / in-player selector) ---
        // The player moved to a different episode on its own. Finalize the
        // previous episode, then adopt the new one. We deliberately do NOT
        // remount the player or touch the URL — the player is already playing
        // the new episode seamlessly, and our per-episode records are the
        // source of truth for Continue Watching and resume.
        if (type === 'tv' && (currentSeason !== activeSeasonRef.current || currentEpisode !== activeEpisodeRef.current)) {
            const prevSeason = activeSeasonRef.current;
            const prevEpisode = activeEpisodeRef.current;
            const prevTime = lastTimeRef.current;
            const prevDur = lastDurationRef.current;

            // If the switch happened right after the previous episode ended,
            // mark it complete (watched = full duration).
            const prevEnded = prevDur > 0 && prevTime >= prevDur - 3;

            if (prevDur > 0 && prevTime > 1) {
                saveEpisode(prevSeason, prevEpisode, prevEnded ? prevDur : prevTime, prevDur);
            }

            activeSeasonRef.current = currentSeason;
            activeEpisodeRef.current = currentEpisode;
            lastTimeRef.current = 0;
            lastDurationRef.current = 0;
            lastUpdateTime.current = 0; // Allow an immediate save for the new episode
        }

        if (duration > 0) {
            lastTimeRef.current = currentTime;
            lastDurationRef.current = duration;
        }

        const save = (force = false): boolean => {
            if (!force && (currentTime < 1 || duration < 1)) return false;
            return saveEpisode(currentSeason, currentEpisode, currentTime, duration);
        };

        if (currentTime > 0) {
            const now = Date.now();
            if (lastUpdateTime.current === 0 || (now - lastUpdateTime.current > THROTTLE_INTERVAL)) {
                if (save()) {
                    lastUpdateTime.current = now;
                }
            }
        }

        // Persist immediately on pause/seeked so the latest position survives
        // when the user leaves the player or jumps around.
        if (playerEvent === 'pause' || playerEvent === 'seeked') {
            save(true);
        }

        // Episode finished: mark it complete. The player's autoNext (still
        // enabled) advances internally; the next PLAYER_EVENT carries the new
        // episode and the switch branch above records it correctly. If the
        // ended event reports a zero position, fall back to the last known one.
        if (playerEvent === 'ended') {
            const endedTime = currentTime > 1 ? currentTime : (lastDurationRef.current > 0 ? lastDurationRef.current : 0);
            if (endedTime > 1 && lastDurationRef.current > 1) {
                saveEpisode(currentSeason, currentEpisode, endedTime, lastDurationRef.current);
            } else {
                save(true);
            }
        }
    }, [id, type, title, posterPath, backdropPath, updateProgress]);

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [handleMessage]);

    return null;
}
