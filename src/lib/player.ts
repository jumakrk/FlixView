export type PlayerMediaType = 'movie' | 'tv';

export interface PlayerEmbedOptions {
    tmdbId: string | number;
    type?: PlayerMediaType;
    season?: number;
    episode?: number;
    /** Resume position in seconds. 0 means "start from the beginning". */
    startTime?: number;
}

/** App accent colour, hex without the leading '#' (matches --primary #7c3aed). */
export const PLAYER_ACCENT_COLOR = '7C3AED';

/** Text shown on the player's loading screen. */
export const PLAYER_BRANDING = 'FLIXVIEW';

const PLAYER_BASE_URL = 'https://vidstuck.xyz/embed';

/**
 * Smallest start position the player accepts as "start from the beginning".
 *
 * Measured against the live player: it keeps its own resume position per title
 * and treats `progress=0` as "not provided", falling back to that remembered
 * position (a title previously left at 90s resumed at 90s with `progress=0`,
 * and started at 1s with `progress=1`). Sending 0 therefore cannot reset
 * anything, so a title with nothing to resume starts at 1 second instead —
 * effectively the beginning — and every episode of a removed show starts fresh
 * rather than resuming from the player's own memory.
 */
export const PLAYER_START_FLOOR = 1;

/**
 * Build the VidStuck embed URL.
 *
 * Movies: https://vidstuck.xyz/embed/movie/{tmdbId}
 * TV:     https://vidstuck.xyz/embed/tv/{tmdbId}/{season}/{episode}
 *
 * `progress` is ALWAYS sent and never 0: omitting it (or sending 0) lets the
 * player fall back to the position it remembers for the title, which would
 * silently resurrect progress after the user removed the show from Continue
 * Watching (a removal that resets every episode of every season back to 0).
 */
export function buildPlayerUrl({
    tmdbId,
    type = 'movie',
    season = 1,
    episode = 1,
    startTime = 0
}: PlayerEmbedOptions): string {
    const params = new URLSearchParams({
        color: PLAYER_ACCENT_COLOR,
        branding: PLAYER_BRANDING,
        nextEpisode: 'true',
        autoplayNextEpisode: 'true',
        episodeSelector: 'true',
        overlay: 'true'
    });

    // Guard against NaN / negative positions coming from a corrupt record.
    const requested = Number.isFinite(startTime) ? Math.floor(startTime) : 0;
    const start = requested > 0 ? requested : PLAYER_START_FLOOR;
    params.set('progress', String(start));

    return type === 'movie'
        ? `${PLAYER_BASE_URL}/movie/${tmdbId}?${params.toString()}`
        : `${PLAYER_BASE_URL}/tv/${tmdbId}/${season}/${episode}?${params.toString()}`;
}
