// AniList GraphQL client.
//
// All anime metadata in FlixView comes from AniList (TMDB is never used for
// anime). The catalog queries below are public: AniList does not require an
// API key to read anime. A key, when supplied, is only used for authenticated
// requests (e.g. future list syncing); if AniList rejects it, requests
// transparently fall back to the public endpoint.
//
// An invalid/expired token is rejected with `400 Invalid token`; requests then
// retry unauthenticated, so leave NEXT_PUBLIC_ANILIST_API_KEY unset to use the
// public API directly (approximately 30 requests/minute).

import type { Movie } from './tmdb';

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';
const ANILIST_API_KEY = process.env.NEXT_PUBLIC_ANILIST_API_KEY || '';

export type AnimeFormat = 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';

export interface AniListMedia {
    id: number;
    idMal?: number | null;
    title: {
        romaji?: string | null;
        english?: string | null;
        native?: string | null;
        userPreferred?: string | null;
    };
    description?: string | null;
    format?: AnimeFormat | null;
    status?: string | null;
    episodes?: number | null;
    duration?: number | null;
    season?: string | null;
    seasonYear?: number | null;
    averageScore?: number | null;
    meanScore?: number | null;
    popularity?: number | null;
    coverImage?: {
        extraLarge?: string | null;
        large?: string | null;
        color?: string | null;
    } | null;
    bannerImage?: string | null;
    genres?: string[] | null;
    studios?: {
        nodes?: { id: number; name: string }[] | null;
    } | null;
    nextAiringEpisode?: {
        episode: number;
        timeUntilAiring: number;
    } | null;
    recommendations?: {
        nodes?: { mediaRecommendation: AniListMedia | null }[] | null;
    } | null;
}

interface AniListPageInfo {
    total: number;
    currentPage: number;
    hasNextPage: boolean;
}

interface AniListResponse<T> {
    data?: T;
    errors?: { message: string; status?: number }[];
}

const MEDIA_FIELDS = `
    id
    idMal
    title { romaji english native userPreferred }
    description
    format
    status
    episodes
    duration
    season
    seasonYear
    averageScore
    meanScore
    popularity
    coverImage { extraLarge large color }
    bannerImage
    genres
    studios(isMain: true) { nodes { id name } }
    nextAiringEpisode { episode timeUntilAiring }
`;

// AniList's resolver returns a 500 when `format_in` or `status` is sent as an
// explicit null, so the page query is assembled from the filters that are
// actually present instead of binding every filter as a nullable variable.

const MEDIA_BY_ID_QUERY = `
    query AnimeById($id: Int) {
        Media(id: $id, type: ANIME) {
            ${MEDIA_FIELDS}
        }
    }
`;

const MEDIA_BY_IDS_QUERY = `
    query AnimeByIds($ids: [Int]) {
        Page(page: 1, perPage: 50) {
            media(type: ANIME, id_in: $ids) {
                ${MEDIA_FIELDS}
            }
        }
    }
`;

const RECOMMENDATIONS_QUERY = `
    query AnimeRecommendations($id: Int) {
        Media(id: $id, type: ANIME) {
            recommendations(sort: RATING_DESC, perPage: 14) {
                nodes {
                    mediaRecommendation {
                        ${MEDIA_FIELDS}
                    }
                }
            }
        }
    }
`;

let authDisabled = false;

function isInvalidToken(body: AniListResponse<unknown> | null): boolean {
    return !!body?.errors?.some(error =>
        error.status === 400 && /invalid token/i.test(error.message)
    );
}

async function post(query: string, variables: Record<string, unknown>, withAuth: boolean): Promise<Response> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };
    if (withAuth && ANILIST_API_KEY) {
        headers.Authorization = `Bearer ${ANILIST_API_KEY}`;
    }

    return fetch(ANILIST_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
        next: { revalidate: 3600 },
    });
}

async function anilistRequest<T>(
    query: string,
    variables: Record<string, unknown> = {}
): Promise<T> {
    const canAuth = !!ANILIST_API_KEY && !authDisabled;
    let response = await post(query, variables, canAuth);

    if (canAuth && response.status === 400) {
        const body = await response.clone().json().catch(() => null) as AniListResponse<T> | null;
        if (isInvalidToken(body)) {
            // The configured token is not valid for this AniList account.
            // Public catalog data needs no auth, so retry once without it and
            // remember not to send the token again for this session/build.
            authDisabled = true;
            response = await post(query, variables, false);
        }
    }

    const body = await response.json().catch(() => null) as AniListResponse<T> | null;

    if (!response.ok || !body || body.errors?.length) {
        const message = body?.errors?.map(error => error.message).join(', ')
            || `AniList request failed (${response.status})`;
        throw new Error(message);
    }

    if (!body.data) {
        throw new Error('AniList returned an empty response');
    }

    return body.data;
}

export interface AniListPage {
    pageInfo: AniListPageInfo;
    media: AniListMedia[];
}

export interface AnimePageOptions {
    page?: number;
    perPage?: number;
    sort?: string;
    format?: AnimeFormat;
    formatIn?: AnimeFormat[];
    season?: string;
    seasonYear?: number;
    status?: string;
    search?: string;
    genre?: string;
    /** Leave out titles with this status (e.g. NOT_YET_RELEASED). */
    statusNot?: string;
}

export async function fetchAnimePage(options: AnimePageOptions = {}): Promise<AniListPage> {
    const {
        page = 1,
        perPage = 20,
        sort = 'POPULARITY_DESC',
        format,
        formatIn,
        season,
        seasonYear,
        status,
        search,
        genre,
        statusNot,
    } = options;

    const variableDefs = ['$page: Int', '$perPage: Int', '$sort: [MediaSort]'];
    const args = ['type: ANIME', 'isAdult: false', 'sort: $sort'];
    const variables: Record<string, unknown> = {
        page,
        perPage,
        sort: [sort],
    };

    if (format) {
        variableDefs.push('$format: MediaFormat');
        args.push('format: $format');
        variables.format = format;
    }

    if (formatIn && formatIn.length > 0) {
        variableDefs.push('$formatIn: [MediaFormat]');
        args.push('format_in: $formatIn');
        variables.formatIn = formatIn;
    }

    if (season) {
        variableDefs.push('$season: MediaSeason');
        args.push('season: $season');
        variables.season = season;
    }

    if (seasonYear) {
        variableDefs.push('$seasonYear: Int');
        args.push('seasonYear: $seasonYear');
        variables.seasonYear = seasonYear;
    }

    if (status) {
        variableDefs.push('$status: MediaStatus');
        args.push('status: $status');
        variables.status = status;
    }

    if (statusNot) {
        variableDefs.push('$statusNot: MediaStatus');
        args.push('status_not: $statusNot');
        variables.statusNot = statusNot;
    }

    if (genre) {
        variableDefs.push('$genre: String');
        args.push('genre: $genre');
        variables.genre = genre;
    }

    if (search) {
        variableDefs.push('$search: String');
        args.push('search: $search');
        variables.search = search;
    }

    const query = `
        query AnimePage(${variableDefs.join(', ')}) {
            Page(page: $page, perPage: $perPage) {
                pageInfo { total currentPage hasNextPage }
                media(${args.join(', ')}) {
                    ${MEDIA_FIELDS}
                }
            }
        }
    `;

    const data = await anilistRequest<{ Page: AniListPage }>(query, variables);

    return data.Page;
}

export async function fetchAnimeById(id: string | number): Promise<AniListMedia | null> {
    const numericId = parseInt(String(id), 10);
    if (!Number.isFinite(numericId)) return null;

    try {
        const data = await anilistRequest<{ Media: AniListMedia | null }>(MEDIA_BY_ID_QUERY, {
            id: numericId,
        });
        return data.Media;
    } catch (error) {
        console.error('fetchAnimeById:', error);
        return null;
    }
}

export interface AnimeEpisodeMeta {
    title: string | null;
    thumbnail: string | null;
}

const STREAMING_EPISODES_QUERY = `
    query AnimeEpisodes($id: Int) {
        Media(id: $id, type: ANIME) {
            streamingEpisodes { title thumbnail }
        }
    }
`;

/**
 * Map AniList streaming entries ("Episode 12 - The Title") to episode numbers.
 * Entries arrive in no guaranteed order and some carry no number, so only
 * entries whose number can be read are kept; the first one for a number wins.
 */
export function parseStreamingEpisodes(
    entries: { title?: string | null; thumbnail?: string | null }[] | null | undefined
): Record<number, AnimeEpisodeMeta> {
    const byEpisode: Record<number, AnimeEpisodeMeta> = {};
    for (const entry of entries || []) {
        const match = entry.title?.match(/^\s*Episode\s+(\d+)\s*(?:[-:–—]\s*(.*))?$/i);
        if (!match) continue;
        const episode = parseInt(match[1], 10);
        if (!Number.isFinite(episode) || episode < 1 || byEpisode[episode]) continue;
        byEpisode[episode] = {
            title: match[2]?.trim() || null,
            thumbnail: entry.thumbnail || null,
        };
    }
    return byEpisode;
}

/** Per-episode titles and thumbnails, when AniList has streaming data. */
export async function fetchAnimeEpisodeMeta(id: string | number): Promise<Record<number, AnimeEpisodeMeta>> {
    const numericId = parseInt(String(id), 10);
    if (!Number.isFinite(numericId)) return {};

    try {
        const data = await anilistRequest<{ Media: { streamingEpisodes?: { title?: string | null; thumbnail?: string | null }[] | null } | null }>(
            STREAMING_EPISODES_QUERY,
            { id: numericId }
        );
        return parseStreamingEpisodes(data.Media?.streamingEpisodes);
    } catch (error) {
        console.error('fetchAnimeEpisodeMeta:', error);
        return {};
    }
}

export async function fetchAnimeByIds(ids: (string | number)[]): Promise<AniListMedia[]> {
    const numericIds = ids
        .map(id => parseInt(String(id), 10))
        .filter(id => Number.isFinite(id));
    if (numericIds.length === 0) return [];

    try {
        const data = await anilistRequest<{ Page: AniListPage }>(MEDIA_BY_IDS_QUERY, {
            ids: numericIds,
        });
        const byId = new Map(data.Page.media.map(media => [media.id, media]));
        // Preserve the caller's order (watchlist/favorites render newest first).
        return numericIds
            .map(id => byId.get(id))
            .filter((media): media is AniListMedia => !!media);
    } catch (error) {
        console.error('fetchAnimeByIds:', error);
        return [];
    }
}

export async function fetchAnimeRecommendations(id: string | number): Promise<AniListMedia[]> {
    const numericId = parseInt(String(id), 10);
    if (!Number.isFinite(numericId)) return [];

    try {
        const data = await anilistRequest<{
            Media: { recommendations?: { nodes?: { mediaRecommendation: AniListMedia | null }[] | null } | null } | null;
        }>(RECOMMENDATIONS_QUERY, { id: numericId });

        return (data.Media?.recommendations?.nodes || [])
            .map(node => node.mediaRecommendation)
            .filter((media): media is AniListMedia => !!media);
    } catch (error) {
        console.error('fetchAnimeRecommendations:', error);
        return [];
    }
}

export async function searchAnime(query: string, page: number = 1): Promise<AniListPage> {
    return fetchAnimePage({
        search: query,
        page,
        perPage: 24,
        sort: 'SEARCH_MATCH',
    });
}

/** Current anime season, used for the "Popular This Season" rail. */
export function getCurrentAnimeSeason(): { season: string; seasonYear: number } {
    const now = new Date();
    const month = now.getMonth() + 1;
    const season = month <= 3 ? 'WINTER'
        : month <= 6 ? 'SPRING'
        : month <= 9 ? 'SUMMER'
        : 'FALL';
    return { season, seasonYear: now.getFullYear() };
}

export function animeTitle(media: AniListMedia): string {
    return media.title.english
        || media.title.userPreferred
        || media.title.romaji
        || media.title.native
        || 'Unknown Anime';
}

export function stripAnimeHtml(html: string | null | undefined): string {
    if (!html) return '';
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&rsquo;/g, '’')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/** Number of playable episodes. Movies are a single episode. */
export function animeEpisodeCount(media: AniListMedia | null | undefined): number {
    if (!media) return 1;
    if (media.format === 'MOVIE' || media.format === 'MUSIC') return 1;
    if (media.episodes && media.episodes > 0) return media.episodes;
    if (media.nextAiringEpisode?.episode && media.nextAiringEpisode.episode > 1) {
        return media.nextAiringEpisode.episode - 1;
    }
    return 1;
}

export function isAnimeMovie(media: AniListMedia | null | undefined): boolean {
    return media?.format === 'MOVIE' || media?.format === 'MUSIC';
}

/**
 * Convert AniList media into the app's existing card shape. Poster/backdrop
 * fields intentionally contain absolute URLs; every image component resolves
 * both relative TMDB paths and absolute URLs (see @/lib/images).
 */
export function animeToMovie(media: AniListMedia): Movie {
    const title = animeTitle(media);
    const releaseDate = media.seasonYear ? `${media.seasonYear}-01-01` : undefined;

    return {
        id: media.id,
        title,
        name: title,
        overview: stripAnimeHtml(media.description),
        poster_path: media.coverImage?.extraLarge || media.coverImage?.large || null,
        backdrop_path: media.bannerImage || media.coverImage?.extraLarge || null,
        release_date: releaseDate,
        first_air_date: releaseDate,
        vote_average: (media.averageScore ?? media.meanScore ?? 0) / 10,
        vote_count: media.popularity ?? 0,
        popularity: media.popularity ?? 0,
        media_type: 'anime',
        genre_ids: [],
    };
}

export function animeListToMovies(media: AniListMedia[]): Movie[] {
    return media.map(animeToMovie);
}
