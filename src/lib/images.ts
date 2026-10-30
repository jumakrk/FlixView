/**
 * Image helpers.
 *
 * TMDB returns relative paths ("/abc.jpg"), while AniList returns absolute
 * URLs ("https://s4.anilist.co/..."). Components therefore need to accept
 * both formats: the stored data must not be rewritten (existing TMDB progress
 * records keep their relative paths), and AniList posters must render as-is.
 */

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export function isAbsoluteImageUrl(path: string | null | undefined): boolean {
    return typeof path === 'string' && /^https?:\/\//i.test(path);
}

/**
 * Resolve an image path to a usable URL.
 *
 * @param path  TMDB relative path, AniList absolute URL, or null.
 * @param size  TMDB size segment (w500, original, ...). Ignored for absolute URLs.
 */
export function resolveImageUrl(
    path: string | null | undefined,
    size: string = 'w500'
): string {
    if (!path) return '/placeholder-movie.jpg';
    if (isAbsoluteImageUrl(path)) return path;
    return `${TMDB_IMAGE_BASE}/${size}${path.startsWith('/') ? path : `/${path}`}`;
}
