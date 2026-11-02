'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { MediaType, isEpisodicType, getLastWatchedEpisode } from '@/lib/types';
import { isTrustedPlayerOrigin } from '@/lib/player';
import { useRouter } from 'next/navigation';

/**
 * Messages posted by the VidRift player (all flat objects):
 *
 *   vidrift:progress  every 5s while playing: currentTime, duration
 *   vidrift:paused    currentTime (paused by the viewer, or at the end)
 *   vidrift:ended     playback reached the end
 *   vidrift:episode   the player is about to swap itself to season/episode
 *
 * Every message carries tmdbId, mediaType, season and episode. Anime plays
 * through its TMDB title (mediaType "tv"), so on anime the AniList entry and
 * the episode within it come from `anilist: { id, mal, episode }`.
 */
const TRACKED_MESSAGES = new Set(['vidrift:progress', 'vidrift:paused', 'vidrift:ended', 'vidrift:episode']);

interface PlayerMessage {
    type: string;
    currentTime?: number | string;
    duration?: number | string;
    tmdbId?: string | number | null;
    mediaType?: string | null;
    season?: number | string | null;
    episode?: number | string | null;
    anilist?: { id?: number | string | null; episode?: number | string | null } | null;
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

// Minimum playback time before a position is worth remembering, so merely
// opening a title (or one the user just removed from Continue Watching) does
// not immediately recreate a Continue Watching entry.
const MIN_SAVE_SECONDS = 5;

// Minimum gap between two writes of the live position.
const THROTTLE_INTERVAL = 1000;

export default function ProgressManager({
    id, type, season, episode,
    title, posterPath, backdropPath,
    onStartTimeFound,
    checkResume
}: ProgressManagerProps) {
    const { getProgress, updateProgress } = useData();
    const router = useRouter();

    // The episode we believe is currently playing. The player reports the
    // authoritative episode on every message, so internal switches (Up Next,
    // its Next button, its own Episodes list) are always reflected here
    // without guessing.
    const activeSeasonRef = useRef(season);
    const activeEpisodeRef = useRef(episode);

    // Last known playback position, used to finalize the previous episode when
    // the player moves to another one on its own.
    const lastTimeRef = useRef(0);
    const lastDurationRef = useRef(0);

    // Guards against re-writing a finished episode on every subsequent message.
    const completedRef = useRef(false);

    // Avoids writing the exact same snapshot twice in a row (e.g. a pause
    // right after a progress tick).
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
        // Accept messages from the player only.
        if (!isTrustedPlayerOrigin(event.origin || '')) return;

        const data = event.data;
        if (!data || typeof data !== 'object') return;

        const msg = data as PlayerMessage;
        if (!TRACKED_MESSAGES.has(msg.type)) return;

        // Security: only accept events for the content currently on this page.
        // Anime plays through its TMDB title, so it is matched on the AniList
        // entry instead; the episode inside that entry is counted the AniList
        // way (from 1), like the rest of the app.
        let anilistEntryChanged = false;
        let reportedSeason: number | null;
        let reportedEpisode: number | null;

        if (type === 'anime') {
            const anilistId = msg.anilist?.id;
            if (anilistId === null || anilistId === undefined) return;
            // vidrift:episode announces the next episode in TMDB numbering;
            // the progress messages that follow carry the AniList numbering.
            if (msg.type === 'vidrift:episode') return;
            anilistEntryChanged = String(anilistId) !== String(id);
            reportedSeason = 1;
            reportedEpisode = toPositiveInt(msg.anilist?.episode);
        } else {
            if (msg.tmdbId === null || msg.tmdbId === undefined || String(msg.tmdbId) !== String(id)) return;
            if (msg.mediaType && msg.mediaType !== type) return;
            reportedSeason = toPositiveInt(msg.season);
            reportedEpisode = toPositiveInt(msg.episode);
        }

        const currentTime = toSeconds(msg.currentTime);
        // A pause carries no duration; it belongs to the episode last reported.
        const duration = toSeconds(msg.duration)
            || (msg.type === 'vidrift:paused' ? lastDurationRef.current : 0);

        let currentSeason = activeSeasonRef.current;
        let currentEpisode = activeEpisodeRef.current;

        if (isEpisodicType(type) && !anilistEntryChanged
            && reportedSeason !== null && reportedEpisode !== null) {
            currentSeason = reportedSeason;
            currentEpisode = reportedEpisode;
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
                    title: title || undefined,
                    poster_path: posterPath ?? undefined,
                    backdrop_path: backdropPath ?? undefined,
                    media_type: type
                }
            });
            return true;
        };

        // --- Anime moved on to the next AniList entry ---
        // AniList splits long shows into entries (cours). When Up Next rolls
        // past the last episode of this entry the player continues with the
        // next entry, which is a different AniList title. Finish this one,
        // then open the new entry's page so its progress is recorded under it.
        if (anilistEntryChanged) {
            if (msg.type !== 'vidrift:progress') return;
            const prevTime = lastTimeRef.current;
            const prevDur = lastDurationRef.current;
            if (prevDur > 0 && prevTime > 1) {
                const prevEnded = prevTime >= prevDur - 3;
                saveEpisode(activeSeasonRef.current, activeEpisodeRef.current, prevEnded ? prevDur : prevTime, prevDur);
            }
            lastTimeRef.current = 0;
            lastDurationRef.current = 0;
            router.replace(`/watch?type=anime&id=${msg.anilist?.id}&season=1&episode=${reportedEpisode ?? 1}`);
            return;
        }

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

        // Completion is derived from the reported position and,
        // authoritatively, from the player's vidrift:ended. At (or within 3s
        // of) the end we store the full duration so a finished title never
        // resumes from the credits and the next episode is the one resumed.
        const effectiveDuration = duration > 0 ? duration : lastDurationRef.current;
        const finished = msg.type === 'vidrift:ended' || (duration > 0 && currentTime >= duration - 3);

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
    }, [id, type, title, posterPath, backdropPath, updateProgress, router]);

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [handleMessage]);

    return null;
}
