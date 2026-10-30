import { searchContent, type Movie } from './tmdb';
import { searchAnime, animeToMovie, type AniListPage } from './anilist';
import {
    compactSearchText,
    findSpacedVariants,
    hasExactTitleMatch,
    loadSearchWordRanks,
    normalizeSearchQuery,
    shouldTrySpacedSearch,
} from './searchQuery';

const MAX_RESULTS_PER_SECTION = 30;

export interface SearchResults {
    movies: Movie[];
    anime: Movie[];
}

function resultKey(item: Movie): string {
    const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    return `${type}-${item.id}`;
}

function dedupe(items: Movie[]): Movie[] {
    const seen = new Set<string>();
    const unique: Movie[] = [];

    for (const item of items) {
        const key = resultKey(item);
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(item);
    }

    return unique;
}

/** 3 = exact normalised title, 2 = title prefix, 1 = title contains query. */
function titleScore(item: Movie, compactQuery: string): number {
    const titles = [item.title, item.name]
        .filter((value): value is string => Boolean(value))
        .map(compactSearchText);

    if (titles.some((title) => title === compactQuery)) return 3;
    if (titles.some((title) => title.startsWith(compactQuery))) return 2;
    if (titles.some((title) => title.includes(compactQuery))) return 1;
    return 0;
}

/**
 * Merge the original results with retry results, dropping retry noise and
 * putting exact/prefix title matches first. Exported for unit tests.
 */
export function mergeSearchResults(
    base: Movie[],
    retryBatches: Movie[][],
    compactQuery: string
): Movie[] {
    const retryMatches = retryBatches
        .flat()
        .filter((item) => titleScore(item, compactQuery) > 0);

    // Retry results come first so a compact query produces the same order as
    // the correctly spaced query; the original results only fill in any extra
    // titles (and always sit below the stronger normalised matches).
    return dedupe([...retryMatches, ...base])
        .sort((a, b) => titleScore(b, compactQuery) - titleScore(a, compactQuery))
        .slice(0, MAX_RESULTS_PER_SECTION);
}

function plainResults(items: Movie[]): Movie[] {
    return dedupe(items).slice(0, MAX_RESULTS_PER_SECTION);
}

/**
 * Search TMDB (movies/TV) and AniList (anime).
 *
 * If a compact query such as "onepiece" has no exact title match, the query is
 * split into dictionary words and retried. This makes "onepiece", "OnePiece",
 * "Onepiece" and "ONEPIECE" behave exactly like "one piece".
 */
export async function searchEverything(rawQuery: string): Promise<SearchResults> {
    const query = normalizeSearchQuery(rawQuery);
    if (!query) return { movies: [], anime: [] };

    const [movieBase, animePage] = await Promise.all([
        searchContent(query).catch((error) => {
            console.error('Movie search error:', error);
            return [] as Movie[];
        }),
        searchAnime(query).catch((error) => {
            console.error('Anime search error:', error);
            return null;
        }),
    ]);

    const animeBase = animePage ? animePage.media.map(animeToMovie) : [];

    if (!shouldTrySpacedSearch(query)) {
        return { movies: plainResults(movieBase), anime: plainResults(animeBase) };
    }

    // Each provider retries independently: AniList may need the spaced query
    // even when TMDB already found an exact match, and vice versa.
    const moviesNeedRetry = !hasExactTitleMatch(movieBase, query);
    const animeNeedRetry = !hasExactTitleMatch(animeBase, query);

    if (!moviesNeedRetry && !animeNeedRetry) {
        return { movies: plainResults(movieBase), anime: plainResults(animeBase) };
    }

    const wordRanks = await loadSearchWordRanks();
    const variants = findSpacedVariants(query, wordRanks);

    if (variants.length === 0) {
        return { movies: plainResults(movieBase), anime: plainResults(animeBase) };
    }

    const [movieRetryBatches, animeRetryPages] = await Promise.all([
        moviesNeedRetry
            ? Promise.all(
                variants.map((variant) =>
                    searchContent(variant).catch((error) => {
                        console.error(`Movie search retry error (${variant}):`, error);
                        return [] as Movie[];
                    })
                )
            )
            : Promise.resolve([] as Movie[][]),
        animeNeedRetry
            ? Promise.all(
                variants.map((variant) =>
                    searchAnime(variant).catch((error) => {
                        console.error(`Anime search retry error (${variant}):`, error);
                        return null;
                    })
                )
            )
            : Promise.resolve([] as (AniListPage | null)[]),
    ]);

    const animeRetryBatches = animeRetryPages.map((page) =>
        page ? page.media.map(animeToMovie) : []
    );

    return {
        movies: mergeSearchResults(movieBase, movieRetryBatches, compactSearchText(query)),
        anime: mergeSearchResults(animeBase, animeRetryBatches, compactSearchText(query)),
    };
}
