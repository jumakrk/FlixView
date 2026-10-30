import type { MediaType } from './types';

export type PlayerMediaType = MediaType;

export interface PlayerEmbedOptions {
    /** TMDB ID for movies/TV, AniList ID for anime. */
    mediaId: string | number;
    type?: PlayerMediaType;
    season?: number;
    episode?: number;
    /** Anime audio track. Defaults to the dubbed stream. */
    audio?: 'sub' | 'dub';
    /** Resume position in seconds. 0 means "start from the beginning". */
    startTime?: number;
}

/** App accent colour, hex without the leading '#' (matches --primary #7c3aed). */
export const PLAYER_ACCENT_COLOR = '7C3AED';

const PLAYER_BASE_URL = 'https://vidly.pro';

/**
 * Hosts the embedded provider may post progress messages from. Mirrors
 * PLAYER_ORIGINS in main/constants.js.
 */
const PLAYER_ORIGIN_HOSTS = ['vidly.pro'];

/**
 * True when a postMessage origin belongs to the embedded player.
 * The origin is parsed and compared by hostname, so lookalike domains such
 * as "vidly.pro.evil.com" are rejected.
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
 * Smallest start position the player accepts as "start from the beginning".
 *
 * The player keeps its own resume position per title and treats `t=0` (or a
 * missing `t`) as "not provided", falling back to that remembered position.
 * Sending 1 therefore starts an otherwise unwatched title at one second —
 * effectively the beginning — while still overriding any stale player-side
 * position after the user removed the title from Continue Watching or cleared
 * their data.
 */
export const PLAYER_START_FLOOR = 1;

/**
 * Build a Vidly embed URL.
 *
 * Movies: https://vidly.pro/movie/{tmdbId}
 * TV:     https://vidly.pro/tv/{tmdbId}/{season}/{episode}
 * Anime:  https://vidly.pro/anime/{anilistId}/{episode}/{sub|dub}
 *
 * `t` is ALWAYS sent and never 0: omitting it (or sending 0) lets the player
 * fall back to the position it remembers for the title, which would silently
 * resurrect progress after the user removed the show from Continue Watching
 * (a removal that resets every episode of every season back to 0).
 *
 * The aurora theme + app accent colour keep the player visually consistent with
 * FlixView. The audio picker is explicitly disabled: the stream should start
 * playing immediately instead of asking the user to choose a language track.
 */
export function buildPlayerUrl({
    mediaId,
    type = 'movie',
    season = 1,
    episode = 1,
    audio = 'dub',
    startTime = 0
}: PlayerEmbedOptions): string {
    const params = new URLSearchParams({
        theme: 'aurora',
        color: PLAYER_ACCENT_COLOR,
        autoplay: '1',
        nextEpisode: '1',
        audioPicker: '0'
    });

    // Guard against NaN / negative positions coming from a corrupt record.
    const requested = Number.isFinite(startTime) ? Math.floor(startTime) : 0;
    const start = requested > 0 ? requested : PLAYER_START_FLOOR;
    params.set('t', String(start));

    const query = params.toString();

    if (type === 'movie') {
        return `${PLAYER_BASE_URL}/movie/${mediaId}?${query}`;
    }

    if (type === 'anime') {
        // Anime is always addressed by its AniList ID and defaults to the dub.
        return `${PLAYER_BASE_URL}/anime/${mediaId}/${episode}/${audio}?${query}`;
    }

    return `${PLAYER_BASE_URL}/tv/${mediaId}/${season}/${episode}?${query}`;
}
