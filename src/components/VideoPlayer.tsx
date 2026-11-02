'use client';

import { cn } from "@/lib/utils";
import { buildPlayerUrl, isTrustedPlayerOrigin, PLAYER_ORIGIN } from "@/lib/player";
import { MediaType } from "@/lib/types";

interface VideoPlayerProps {
    /** TMDB ID for movies/TV, AniList ID for anime. */
    mediaId: string | number;
    type?: MediaType;
    season?: number;
    episode?: number;
    audio?: 'sub' | 'dub';
    /** AniList movies use the player's episode-less route. */
    isAnimeMovie?: boolean;
    className?: string;
    /** Resume position in seconds, sent once the player has loaded. */
    startTime?: number;
    /** The player's own Back / Exit button was pressed (vidrift:exit). */
    onExit?: () => void;
}

import { memo, useCallback, useEffect, useRef, useState } from 'react';

// Keys the embedded player handles itself (play/pause, seek, volume, fullscreen,
// mute). Pressed while focus is on the page, they would scroll it instead.
const PLAYER_KEYS = new Set([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'f', 'F', 'k', 'K', 'm', 'M']);

function isTypingTarget(element: Element | null): boolean {
    if (!element) return false;
    const tag = element.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (element as HTMLElement).isContentEditable;
}

function VideoPlayer({
    mediaId,
    type = 'movie',
    season = 1,
    episode = 1,
    audio = 'dub',
    isAnimeMovie = false,
    className,
    startTime = 0,
    onExit,
}: VideoPlayerProps) {
    const [isReady, setIsReady] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Latest values for the message/load handlers, which must not be
    // re-created (and re-register listeners) on every render.
    const startTimeRef = useRef(startTime);
    const onExitRef = useRef(onExit);
    useEffect(() => {
        startTimeRef.current = startTime;
        onExitRef.current = onExit;
    }, [startTime, onExit]);

    // The iframe fires `load` again every time the player swaps itself to
    // another episode (Up Next, its Episodes list). Only the first load of
    // this mount is the title the resume position belongs to.
    const resumeSentRef = useRef(false);

    const postToPlayer = useCallback((message: Record<string, unknown>) => {
        iframeRef.current?.contentWindow?.postMessage(message, PLAYER_ORIGIN);
    }, []);

    // Keyboard focus belongs to the player so Space / arrows / F control
    // playback right away, without a click (which would also pause it).
    const focusPlayer = useCallback(() => {
        const frame = iframeRef.current;
        if (!frame) return;
        frame.focus();
        frame.contentWindow?.focus();
    }, []);

    const sendFullscreenState = useCallback(() => {
        const on = !!containerRef.current && document.fullscreenElement === containerRef.current;
        postToPlayer({ type: 'vidrift:fullscreen-state', on });
    }, [postToPlayer]);

    const handleLoad = useCallback(() => {
        focusPlayer();
        // fs=parent: the player needs to know whether our box is fullscreen,
        // including after it swapped itself to the next episode.
        sendFullscreenState();
        if (!resumeSentRef.current) {
            resumeSentRef.current = true;
            // Always sent, 0 included, so FlixView's own progress decides where
            // the title starts (a title removed from Continue Watching starts
            // from the beginning). Safe before the video is ready.
            const position = startTimeRef.current;
            postToPlayer({
                type: 'vidrift:resume',
                currentTime: Number.isFinite(position) && position > 0 ? Math.floor(position) : 0,
            });
        }
    }, [focusPlayer, sendFullscreenState, postToPlayer]);

    // If focus has drifted back to the page (e.g. after clicking a button),
    // a player key must not scroll the page: hand focus back to the player.
    // That first keystroke only moves focus; every following one goes
    // straight to the player.
    useEffect(() => {
        if (!isReady) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!PLAYER_KEYS.has(event.key) || event.ctrlKey || event.metaKey || event.altKey) return;
            if (isTypingTarget(document.activeElement)) return;
            event.preventDefault();
            focusPlayer();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isReady, focusPlayer]);

    // Messages from the player that the page acts on: its Exit button and
    // fullscreen requests (fs=parent). Fullscreen is applied to the box around
    // the iframe, so the player can load the next episode without leaving
    // fullscreen. Progress messages are handled by ProgressManager.
    useEffect(() => {
        if (!isReady) return;
        const handleMessage = (event: MessageEvent) => {
            if (!isTrustedPlayerOrigin(event.origin || '')) return;
            if (event.source !== iframeRef.current?.contentWindow) return;
            const data = event.data as { type?: string; on?: boolean } | null;
            if (!data || typeof data !== 'object') return;

            if (data.type === 'vidrift:exit') {
                onExitRef.current?.();
            } else if (data.type === 'vidrift:fullscreen') {
                const container = containerRef.current;
                if (!container) return;
                // Called straight from the handler so the viewer's click in
                // the player still counts as the gesture fullscreen needs.
                if (data.on && document.fullscreenElement !== container) {
                    container.requestFullscreen().catch(error => console.error('Fullscreen failed:', error));
                } else if (!data.on && document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                }
            }
        };
        window.addEventListener('message', handleMessage);
        document.addEventListener('fullscreenchange', sendFullscreenState);
        return () => {
            window.removeEventListener('message', handleMessage);
            document.removeEventListener('fullscreenchange', sendFullscreenState);
        };
    }, [isReady, sendFullscreenState]);

    useEffect(() => {
        let isMounted = true;
        const purgeAndReady = async () => {
            if (typeof window !== 'undefined' && window.electron && window.electron.purgePlayerCache) {
                try {
                    // The player may remember positions and choices per title.
                    // FlixView owns progress, so its storage is wiped before
                    // every mount.
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

    // VidRift embed. The URL (brand, accent colour, font, exit button,
    // page-owned fullscreen, dub for anime) is built in @/lib/player so it can
    // be asserted without a browser. The resume position is not part of it.
    const src = buildPlayerUrl({ mediaId, type, season, episode, audio, isAnimeMovie });

    if (!isReady) {
        return (
            <div className={cn("relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center", className)}>
                <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={cn("relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5", className)}>
            <iframe
                ref={iframeRef}
                onLoad={handleLoad}
                src={src}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                referrerPolicy="strict-origin-when-cross-origin"
                title={`Video Player ${mediaId}`}
                style={{ border: 'none' }}
                scrolling="no"
            />
        </div>
    );
}

export default memo(VideoPlayer);
