'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { MediaType, isEpisodicType, getLastWatchedEpisode } from '@/lib/types';
import { isTrustedPlayerOrigin } from '@/lib/player';
import { useRouter } from 'next/navigation';

/**
 * Shape of the messages posted by Vidly.
 *
 * VIDLY_PLAYER_EVENT:
 *   { type: 'VIDLY_PLAYER_EVENT', data: { event, currentTime, duration,
 *     tmdbId, mediaType, season, episode } }
 * SYNC_HISTORY:
 *   { type: 'SYNC_HISTORY', data: { media_id, media_type, title, duration,
 *     watched, poster, season, episode } }
 *
 * `season`/`episode` are null for movies; anime reports `season: null` and a
 * real `episode`. `tmdbId` is null for anime (the AniList ID is only present
 * on SYNC_HISTORY as `media_id`).
 */
interface VidlyMessageData {
    event?: string;
    currentTime?: number | string;
    duration?: number | string;
    tmdbId?: string | number | null;
    mediaId?: string | number | null;
    media_id?: string | number | null;
    mediaType?: string | null;
    media_type?: string | null;
    title?: string;
    poster?: string | null;
    watched?: number | string;
    season?: number | string | null;
    episode?: number | string | null;
}

function toSeconds(value: number | string | null | undefined): number {
    const n = typeof value === 'number' ? value : parseFloat(value ?? '');
    return Number.isFinite(n) ? n : 0;
}

function toPositiveInt(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = typeof value === 'number' ? value : parseInt(String(value), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeMediaType(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    return value === 'series' ? 'tv' : value;
}

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

// How often a live `timeupdate` is written to disk.
const THROTTLE_INTERVAL = 1000;

export default function ProgressManager({
    id, type, season, episode,
    title, posterPath, backdropPath,
    onStartTimeFound,
    checkResume
}: ProgressManagerProps) {
    const { getProgress, updateProgress } = useData();
    const router = useRouter();

    // The episode we believe is currently playing. Vidly reports the
    // authoritative episode on every message, so internal switches (the
    // inbuilt next button, nextEpisode, the player's own episode selector) are
    // always reflected here without guessing.
    const activeSeasonRef = useRef(season);
    const activeEpisodeRef = useRef(episode);

    // Last known playback position, used to finalize the previous episode when
    // the player moves to another one on its own.
    const lastTimeRef = useRef(0);
    const lastDurationRef = useRef(0);

    // Guards against re-writing a finished episode on every subsequent message.
    const completedRef = useRef(false);

    // Avoids writing the exact same snapshot twice when Vidly sends both
    // VIDLY_PLAYER_EVENT and SYNC_HISTORY for the same tick.
    const recentSaveRef = useRef<{ key: string; at: number } | null>(null);

    // Throttling for live timeupdate writes.
    const lastUpdateTime = useRef(0);

    // Auto-Redirect Effect: if the user opens the show with no S/E, jump to the
    // most recently watched episode.
    useEffect(() => {
        if (checkResume && isEpisodicType(type)) {
            const record = getProgress(id, type);
            const lastSE = getLastWatchedEpisode(record);
            if (lastSE.season !== season || lastSE.episode !== episode) {
                router.replace(`/watch?type=${type}&id=${id}&season=${lastSE.season}&episode=${lastSE.episode}`);
            }
        }
    }, [checkResume, id, type, season, episode, getProgress, router]);

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
        recentSaveRef.current = null;

        const record = getProgress(id, type);
        let current = 0;
        let duration = 0;

        if (record) {
            if (!isEpisodicType(type)) {
                current = record.watched_seconds;
                duration = record.duration_seconds;
            } else {
                const epKey = `s${season}e${episode}`;
                const epProgress = record.episodes?.[epKey];
                if (epProgress) {
                    current = epProgress.watched_seconds;
                    duration = epProgress.duration_seconds;
                } else if (record.season === season && record.episode === episode && record.duration_seconds > 0) {
                    // Compatibility with older records that only stored the
                    // show-level pointer and position (no episodes map). This is
                    // how pre-existing TV progress is resumed without loss.
                    current = record.watched_seconds;
                    duration = record.duration_seconds;
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
        // Accept messages from the Vidly player only.
        if (!isTrustedPlayerOrigin(event.origin || '')) return;

        let data = event.data;

        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch {
                return;
            }
        }

        if (!data || typeof data !== 'object') return;

        const envelope = data as { type?: string; data?: unknown; payload?: unknown };
        if (envelope.type !== 'VIDLY_PLAYER_EVENT' && envelope.type !== 'SYNC_HISTORY') return;

        const payload = (envelope.data && typeof envelope.data === 'object')
            ? envelope.data
            : (envelope.payload && typeof envelope.payload === 'object' ? envelope.payload : null);
        if (!payload) return;

        const msg = payload as VidlyMessageData;

        // Security: only accept events for the content currently on this page.
        // Anime events carry `tmdbId: null`, so a null ID is accepted for the
        // page's own type; SYNC_HISTORY still supplies the AniList media_id.
        const msgId = msg.tmdbId ?? msg.mediaId ?? msg.media_id;
        if (msgId !== null && msgId !== undefined && String(msgId) !== String(id)) return;

        const msgType = normalizeMediaType(msg.mediaType ?? msg.media_type);
        if (msgType && msgType !== type) return;

        const currentTime = toSeconds(msg.currentTime ?? msg.watched);
        const duration = toSeconds(msg.duration);
        const progressPct = envelope.type === 'VIDLY_PLAYER_EVENT'
            ? toSeconds((msg as { progress?: number | string }).progress)
            : 0;

        const reportedSeason = toPositiveInt(msg.season);
        const reportedEpisode = toPositiveInt(msg.episode);

        let currentSeason = activeSeasonRef.current;
        let currentEpisode = activeEpisodeRef.current;

        if (isEpisodicType(type)) {
            if (type === 'anime') {
                // AniList/Vidly anime is a single flat episode list.
                currentSeason = 1;
                if (reportedEpisode !== null) currentEpisode = reportedEpisode;
            } else if (reportedSeason !== null && reportedEpisode !== null) {
                currentSeason = reportedSeason;
                currentEpisode = reportedEpisode;
            }
        }

        const saveEpisode = (s: number, e: number, time: number, dur: number): boolean => {
            if (time < MIN_SAVE_SECONDS || dur < 1) return false;

            const epKey = `s${s}e${e}`;
            const episodesUpdate = isEpisodicType(type) ? {
                [epKey]: {
                    season_number: s,
                    episode_number: e,
                    watched_seconds: time,
                    duration_seconds: dur
                }
            } : undefined;

            const key = `${epKey}:${Math.round(time)}:${Math.round(dur)}`;
            const now = Date.now();
            if (recentSaveRef.current
                && recentSaveRef.current.key === key
                && now - recentSaveRef.current.at < 1500) {
                return true;
            }
            recentSaveRef.current = { key, at: now };

            updateProgress({
                media_id: id,
                media_type: type,
                season: isEpisodicType(type) ? s : undefined,
                episode: isEpisodicType(type) ? e : undefined,
                watched_seconds: time,
                duration_seconds: dur,
                episodes: episodesUpdate,
                media_data: {
                    // Fall back to Vidly's own metadata if the page could not
                    // supply it (SYNC_HISTORY includes title and poster).
                    title: title || msg.title || undefined,
                    poster_path: posterPath ?? msg.poster ?? undefined,
                    backdrop_path: backdropPath ?? undefined,
                    media_type: type
                }
            });
            return true;
        };

        // --- Internal episode switch (autoNext / inbuilt next button / in-player selector) ---
        // The player moved to a different episode on its own. Finalize the
        // previous episode, then adopt the new one. We deliberately do NOT
        // remount the player or touch the URL — the player is already playing
        // the new episode seamlessly, and our per-episode records are the
        // source of truth for Continue Watching and resume.
        if (isEpisodicType(type)
            && (currentSeason !== activeSeasonRef.current || currentEpisode !== activeEpisodeRef.current)) {
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

        // Completion is derived from the reported position/percentage and,
        // authoritatively, from Vidly's `ended` event. At (or within 3s of) the
        // end we store the full duration so a finished title never resumes
        // from the credits and nextEpisode has a completed record to advance.
        const effectiveDuration = duration > 0 ? duration : lastDurationRef.current;
        const finished = msg.event === 'ended' || (duration > 0 && (
            currentTime >= duration - 3 ||
            (Number.isFinite(progressPct) && progressPct >= 98)
        ));

        if (finished) {
            if (!completedRef.current && effectiveDuration > 0) {
                completedRef.current = true;
                saveEpisode(currentSeason, currentEpisode, effectiveDuration, effectiveDuration);
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
