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

// Minimum playback time before a position is worth remembering. The player is
// loaded with an explicit start position (see @/lib/player), so a freshly reset
// title opens a second or two into the episode; without this floor that first
// tick would immediately recreate a Continue Watching entry for a show the user
// just removed.
const MIN_SAVE_SECONDS = 5;

export default function ProgressManager({
    id, type, season, episode,
    title, posterPath, backdropPath,
    onStartTimeFound,
    checkResume
}: ProgressManagerProps) {
    const { getProgress, updateProgress } = useData();
    const router = useRouter();

    // The episode we believe is currently playing. VidStuck reports the
    // authoritative season/episode on EVERY progress message, so internal
    // switches (the inbuilt next button, autoplayNextEpisode, the player's own
    // episode selector) are always reflected here without any guessing.
    const activeSeasonRef = useRef(season);
    const activeEpisodeRef = useRef(episode);

    // Last known playback position, used to finalize the previous episode when
    // the player moves to another one on its own.
    const lastTimeRef = useRef(0);
    const lastDurationRef = useRef(0);

    // Guards against re-writing a finished episode on every subsequent message.
    const completedRef = useRef(false);

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
        completedRef.current = false;

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
    // VidStuck posts a progress message to the parent window roughly once a
    // second. Verified shape (posted from origin https://vidstuck.xyz as a plain
    // object, not a JSON string):
    //   { type: 'VIDEO_PROGRESS', payload: { currentTime, duration,
    //     tmdbId, media_type, season, episode } }
    // The documented flat form (id/type/progress/timestamp) is also tolerated in
    // case the frontend changes.
    const handleMessage = useCallback((event: MessageEvent) => {
        // Accept messages from the VidStuck player only.
        const origin = event.origin || '';
        if (!origin.includes('vidstuck.xyz') && !origin.includes('zxcstream.icu')) return;

        let data = event.data;

        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                return;
            }
        }

        if (!data || typeof data !== 'object') return;

        // Unwrap the envelope ({ type, payload }) and the documented
        // { type, data } form; fall back to the object itself when flat.
        const payload = (data.payload && typeof data.payload === 'object')
            ? data.payload
            : (data.data && typeof data.data === 'object' ? data.data : data);
        const msg = payload as any;

        // Security: only accept events for the content currently on this page.
        const msgId = msg.tmdbId !== undefined ? msg.tmdbId : msg.id;
        if (msgId !== undefined && String(msgId) !== String(id)) return;

        const saveEpisode = (s: number, e: number, time: number, dur: number): boolean => {
            if (time < MIN_SAVE_SECONDS || dur < 1) return false;

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

        const currentTime = parseFloat(msg.currentTime ?? msg.timestamp) || 0;
        const duration = parseFloat(msg.duration) || 0;
        const progressPct = parseFloat(msg.progress);

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
            completedRef.current = false;
        }

        if (duration > 0) {
            lastTimeRef.current = currentTime;
            lastDurationRef.current = duration;
        }

        const save = (): boolean => {
            if (currentTime < MIN_SAVE_SECONDS || duration < 1) return false;
            return saveEpisode(currentSeason, currentEpisode, currentTime, duration);
        };

        // VidStuck exposes no discrete pause/seek/ended events, so completion is
        // derived from the reported position/percentage. At (or within 3s of) the
        // end we store the full duration — matching the old player's "watched"
        // behaviour so a finished title never resumes from the credits, and so
        // autoplayNextEpisode has a completed record to advance from.
        const finished = duration > 0 && (
            currentTime >= duration - 3 ||
            (Number.isFinite(progressPct) && progressPct >= 98)
        );

        if (finished) {
            if (!completedRef.current) {
                completedRef.current = true;
                saveEpisode(currentSeason, currentEpisode, duration, duration);
            }
            return;
        }

        // Throttled periodic save of the live position.
        if (currentTime >= MIN_SAVE_SECONDS) {
            const now = Date.now();
            if (lastUpdateTime.current === 0 || (now - lastUpdateTime.current > THROTTLE_INTERVAL)) {
                if (save()) {
                    lastUpdateTime.current = now;
                }
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
