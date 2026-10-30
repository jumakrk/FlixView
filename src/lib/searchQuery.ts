// Search-query normalisation and "missing space" recovery.
//
// Providers only do exact token matching: TMDB and AniList both return nothing
// useful for "onepiece", "gameofthrones" or "thelastofus". We keep searches
// fast by first asking the providers for exactly what the user typed; only when
// that has no exact title match do we split a compact query into dictionary
// words and retry ("one piece", "game of thrones", ...).
//
// The dictionary is a lazily fetched list of common English words derived from
// hermitdave/FrequencyWords (OpenSubtitles, CC BY-SA 4.0). It lives in
// public/search-words.txt so it never inflates the initial JS bundle.

const SHORT_WORDS = new Set([
    'an', 'as', 'at', 'by', 'do', 'go', 'he', 'if', 'in', 'is', 'it',
    'la', 'me', 'my', 'no', 'of', 'on', 'or', 'so', 'to', 'tv', 'up',
    'us', 'we',
]);

// The frequency list contains glued phrases such as "ofthe" and "inthe".
// They produce nonsense splits ("house ofthe dragon"), so drop them.
const GLUED_WORDS = new Set([
    'andthe', 'atthe', 'forthe', 'fromthe', 'inthe', 'isthe', 'itsthe',
    'ofthe', 'oftheir', 'ofthem', 'onthe', 'tothe', 'withthe',
]);

const EXTRA_WORDS = ['fullmetal'];

export function normalizeSearchQuery(query: string): string {
    return query.replace(/\s+/g, ' ').trim();
}

/** Case-, accent-, punctuation- and space-insensitive form used for matching. */
export function compactSearchText(value: string | null | undefined): string {
    if (!value) return '';
    return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

/**
 * True when a query is a single compact word that could be hiding spaces.
 * Hyphenated queries already tokenise correctly, so they are left alone.
 */
export function shouldTrySpacedSearch(query: string): boolean {
    const normalized = normalizeSearchQuery(query);
    return normalized.length >= 4
        && normalized.length <= 32
        && /^[a-z0-9]+$/i.test(normalized)
        && /[a-z]/i.test(normalized);
}

interface TitleLike {
    title?: string | null;
    name?: string | null;
}

/** Does any provider result already have the query as its exact title? */
export function hasExactTitleMatch(items: TitleLike[], query: string): boolean {
    const compact = compactSearchText(query);
    if (!compact) return false;

    return items.some((item) => {
        const titles = [item.title, item.name].filter((value): value is string => Boolean(value));
        return titles.some((title) => compactSearchText(title) === compact);
    });
}

/**
 * Build a word -> frequency-rank map from the dictionary text. Lower ranks are
 * more common words, which makes the segmenter prefer natural splits.
 */
export function buildSearchWordRanks(raw: string): Map<string, number> {
    const ranks = new Map<string, number>();
    let rank = 0;

    for (const token of raw.split(/\s+/)) {
        const word = token.trim().toLowerCase();
        if (!word) continue;

        rank += 1;
        if (!/^[a-z]+$/.test(word)) continue;
        if (word.length < 2 || word.length > 24) continue;
        if (word.length === 2 && !SHORT_WORDS.has(word)) continue;
        if (GLUED_WORDS.has(word)) continue;

        if (!ranks.has(word)) ranks.set(word, rank);
    }

    for (const word of EXTRA_WORDS) {
        if (!ranks.has(word)) ranks.set(word, 1);
    }

    return ranks;
}

interface SegmentPath {
    words: string[];
    cost: number;
}

/**
 * Return the best few short segmentations of a compact title. This is a
 * k-best word-break DP: every word adds a base cost (so fewer words win) plus
 * a tiny frequency penalty (so "demon slayer" beats "demons layer").
 */
export function segmentCompactTitle(
    compact: string,
    ranks: Map<string, number>,
    limit = 2
): string[][] {
    if (!/^[a-z0-9]+$/.test(compact) || compact.length < 4 || compact.length > 32) {
        return [];
    }

    const length = compact.length;
    const maxWordLength = Math.min(24, length);
    const best: SegmentPath[][] = Array.from({ length: length + 1 }, () => []);
    best[0] = [{ words: [], cost: 0 }];

    for (let start = 0; start < length; start++) {
        if (best[start].length === 0) continue;

        for (const path of best[start]) {
            for (let size = 2; size <= maxWordLength && start + size <= length; size++) {
                const word = compact.slice(start, start + size);
                if (word.length === 2 && !SHORT_WORDS.has(word)) continue;

                const rank = ranks.get(word);
                if (rank === undefined) continue;

                const next: SegmentPath = {
                    words: [...path.words, word],
                    cost: path.cost + 10 + Math.min(rank, 1_000_000) / 1_000_000,
                };
                const bucket = best[start + size];
                const key = next.words.join(' ');
                if (bucket.some((existing) => existing.words.join(' ') === key)) continue;

                bucket.push(next);
                bucket.sort((a, b) => a.cost - b.cost);
                // Keep a little more than requested so the global top N is not
                // lost when several prefixes converge on the same position.
                if (bucket.length > 6) bucket.length = 6;
            }
        }
    }

    const unique = new Map<string, SegmentPath>();
    for (const path of best[length]) {
        unique.set(path.words.join(' '), path);
    }

    return [...unique.values()]
        .sort((a, b) => a.cost - b.cost)
        .slice(0, limit)
        .map((path) => path.words);
}

/** Compute up to two spaced retry queries for a compact input. */
export function findSpacedVariants(query: string, ranks: Map<string, number>): string[] {
    if (!shouldTrySpacedSearch(query)) return [];

    const compact = compactSearchText(query);
    if (!compact) return [];

    const variants: string[] = [];
    for (const words of segmentCompactTitle(compact, ranks, 4)) {
        const variant = words.join(' ');
        if (variant === compact || variants.includes(variant)) continue;
        variants.push(variant);
        if (variants.length === 2) break;
    }

    return variants;
}

let wordRanksPromise: Promise<Map<string, number>> | null = null;

/** Lazily load the dictionary; failures simply disable the retry path. */
export function loadSearchWordRanks(): Promise<Map<string, number>> {
    if (!wordRanksPromise) {
        wordRanksPromise = fetch('/search-words.txt')
            .then((response) => (response.ok ? response.text() : ''))
            .then(buildSearchWordRanks)
            .catch(() => new Map<string, number>());
    }

    return wordRanksPromise;
}
