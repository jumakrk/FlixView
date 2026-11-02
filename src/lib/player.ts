import type { MediaType } from './types';

export type PlayerMediaType = MediaType;

export interface PlayerEmbedOptions {
    /** TMDB ID for movies/TV, AniList ID for anime. */
    mediaId: string | number;
    type?: PlayerMediaType;
    season?: number;
    episode?: number;
    /** Anime audio track. Defaults to the English dub. */
    audio?: 'sub' | 'dub';
    /** AniList movies have no episodes and use the episode-less route. */
    isAnimeMovie?: boolean;
}

/** App accent colour, hex without the leading '#' (matches --primary #7c3aed). */
export const PLAYER_ACCENT_COLOR = '7C3AED';

/** Name shown on the player's loading card. */
export const PLAYER_BRAND = 'FLIXVIEW';

/** The app's typeface (Outfit, a Google Font), so the player matches the UI. */
export const PLAYER_FONT = 'Outfit';

/**
 * Size of the player's controls, icons and labels. 1 matches the app's own UI:
 * the iframe lives in the same page, so it shares the app's display-scale
 * compensation and its text renders at the same size as the app's.
 */
export const PLAYER_UI_SCALE = '1';

/** Origin the player is served from; also the postMessage target. */
export const PLAYER_ORIGIN = 'https://embed.vidrift.net';

const PLAYER_BASE_URL = `${PLAYER_ORIGIN}/embed`;

/**
 * Hosts the embedded provider may post messages from. embed.vidrift.in is the
 * provider's older domain and serves the same player. Mirrors PLAYER_ORIGINS
 * in main/constants.js.
 */
const PLAYER_ORIGIN_HOSTS = ['vidrift.net', 'vidrift.in'];

/**
 * True when a postMessage origin belongs to the embedded player.
 * The origin is parsed and compared by hostname, so lookalike domains such
 * as "vidrift.net.evil.com" are rejected.
 */
export function isTrustedPlayerOrigin(origin: string): boolean {
    let hostname: string;
    try {
        hostname = new URL(origin).hostname;
    } catch {
        return false;
    }
    return PLAYER_ORIGIN_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`));
}

/**
 * Build a VidRift embed URL.
 *
 * Movies: https://embed.vidrift.net/embed/movie/{tmdbId}
 * TV:     https://embed.vidrift.net/embed/tv/{tmdbId}/{season}/{episode}
 * Anime:  https://embed.vidrift.net/embed/anilist/{anilistId}/{episode}
 *         (anime movies: /embed/anilist/{anilistId}). The player redirects
 *         this onto the matching TMDB title and keeps every parameter.
 *
 * The player is skinned to match FlixView: brand name and accent colour on the
 * loading card, the app's font, sentence-case labels and controls sized like
 * the app's UI, with the default gradient behind them. Its own Back/Exit control replaces
 * the app's (vidrift:exit), and fullscreen is owned by the page (fs=parent) so
 * the next episode can load without leaving fullscreen.
 *
 * There is no start-time parameter: resume positions are sent with
 * vidrift:resume once the iframe has loaded (see VideoPlayer).
 */
export function buildPlayerUrl({
    mediaId,
    type = 'movie',
    season = 1,
    episode = 1,
    audio = 'dub',
    isAnimeMovie = false,
}: PlayerEmbedOptions): string {
    const params = new URLSearchParams({
        brand: PLAYER_BRAND,
        brandColor: PLAYER_ACCENT_COLOR,
        font: PLAYER_FONT,
        uiScale: PLAYER_UI_SCALE,
        caps: '0',
        showTitle: '1',
        exit: '1',
        autoplay: '1',
        muted: '0',
        fs: 'parent',
    });

    if (type === 'anime' && audio === 'dub') {
        params.set('dub', '1');
    }

    const query = params.toString();

    if (type === 'movie') {
        return `${PLAYER_BASE_URL}/movie/${mediaId}?${query}`;
    }

    if (type === 'anime') {
        // Anime is addressed by its AniList ID and counted the AniList way.
        return isAnimeMovie
            ? `${PLAYER_BASE_URL}/anilist/${mediaId}?${query}`
            : `${PLAYER_BASE_URL}/anilist/${mediaId}/${episode}?${query}`;
    }

    return `${PLAYER_BASE_URL}/tv/${mediaId}/${season}/${episode}?${query}`;
}
