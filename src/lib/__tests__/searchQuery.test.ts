import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    buildSearchWordRanks,
    compactSearchText,
    findSpacedVariants,
    hasExactTitleMatch,
    normalizeSearchQuery,
    segmentCompactTitle,
    shouldTrySpacedSearch,
} from '../searchQuery';
import { mergeSearchResults } from '../search';
import type { Movie } from '../tmdb';

const WORD_LIST = `
    the of and to in on at by as is it my we us up do go no so an or if la me
    one piece game thrones matrix spider man stranger things house dragon last
    squid attack titan death note fast furious mission impossible pirates
    caribbean fullmetal alchemist full metal demon slayer layer breaking bad
    harry potter lord rings star wars hero academia
    ofthe ac
`;

const ranks = buildSearchWordRanks(WORD_LIST);
const realRanks = buildSearchWordRanks(
    readFileSync(resolve(process.cwd(), 'public/search-words.txt'), 'utf8')
);

function movie(id: number, title: string, popularity = 0): Movie {
    return {
        id,
        title,
        name: title,
        overview: '',
        backdrop_path: '/backdrop.jpg',
        poster_path: '/poster.jpg',
        vote_average: 7,
        vote_count: 10,
        popularity,
        media_type: 'movie',
    };
}

describe('compactSearchText', () => {
    it('ignores case, spacing, punctuation and accents', () => {
        expect(compactSearchText('One Piece')).toBe('onepiece');
        expect(compactSearchText('ONEPIECE')).toBe('onepiece');
        expect(compactSearchText('Onepiece')).toBe('onepiece');
        expect(compactSearchText('Amélie')).toBe('amelie');
    });
});

describe('shouldTrySpacedSearch', () => {
    it('only retries compact single-word inputs', () => {
        expect(shouldTrySpacedSearch('onepiece')).toBe(true);
        expect(shouldTrySpacedSearch('OnePiece')).toBe(true);
        expect(shouldTrySpacedSearch('one piece')).toBe(false);
        expect(shouldTrySpacedSearch('spider-man')).toBe(false);
        expect(shouldTrySpacedSearch('1917')).toBe(false);
        expect(shouldTrySpacedSearch('up')).toBe(false);
    });
});

describe('buildSearchWordRanks', () => {
    it('filters glued phrases and non-whitelisted two-letter noise', () => {
        expect(ranks.has('ofthe')).toBe(false);
        expect(ranks.has('ac')).toBe(false);
        expect(ranks.has('of')).toBe(true);
        expect(ranks.has('fullmetal')).toBe(true);
    });
});

describe('findSpacedVariants', () => {
    it.each([
        ['onepiece', 'one piece'],
        ['OnePiece', 'one piece'],
        ['Onepiece', 'one piece'],
        ['ONEPIECE', 'one piece'],
        ['gameofthrones', 'game of thrones'],
        ['thematrix', 'the matrix'],
        ['houseofthedragon', 'house of the dragon'],
        ['thelastofus', 'the last of us'],
        ['attackontitan', 'attack on titan'],
        ['myheroacademia', 'my hero academia'],
    ])('splits %s into %s', (query, expected) => {
        expect(findSpacedVariants(query, ranks)).toContain(expected);
    });

    it('splits the shipped dictionary the same way', () => {
        expect(findSpacedVariants('onepiece', realRanks)).toContain('one piece');
        expect(findSpacedVariants('gameofthrones', realRanks)).toContain('game of thrones');
        expect(findSpacedVariants('thelastofus', realRanks)).toContain('the last of us');
        expect(findSpacedVariants('houseofthedragon', realRanks)).toContain('house of the dragon');
        expect(findSpacedVariants('myheroacademia', realRanks)).toContain('my hero academia');
    });

    it('does not retry a query that already has spacing', () => {
        expect(findSpacedVariants('one piece', ranks)).toEqual([]);
    });

    it('offers alternate splits for ambiguous titles', () => {
        const variants = findSpacedVariants('demonslayer', ranks);
        expect(variants).toContain('demon slayer');
    });
});

describe('segmentCompactTitle', () => {
    it('returns no paths for very short or punctuated input', () => {
        expect(segmentCompactTitle('abc', ranks)).toEqual([]);
        expect(segmentCompactTitle('one-piece', ranks)).toEqual([]);
    });

    it('prefers the fewest natural words', () => {
        expect(segmentCompactTitle('onepiece', ranks, 1)).toEqual([['one', 'piece']]);
    });
});

describe('hasExactTitleMatch', () => {
    it('matches normalised titles exactly, not partial titles', () => {
        expect(hasExactTitleMatch([{ title: 'One Piece' }], 'onepiece')).toBe(true);
        expect(hasExactTitleMatch([{ title: 'Cursed One-Piece' }], 'onepiece')).toBe(false);
    });
});

describe('normalizeSearchQuery', () => {
    it('collapses repeated whitespace', () => {
        expect(normalizeSearchQuery('  one   piece  ')).toBe('one piece');
    });
});

describe('mergeSearchResults', () => {
    it('deduplicates, drops unrelated retries and ranks exact matches first', () => {
        const base = [movie(1, 'Cursed One-Piece', 5)];
        const retry = [
            movie(2, 'One Piece', 100),
            movie(3, 'One Piece Film Red', 50),
            movie(4, 'Layer Cake', 1000),
            movie(2, 'One Piece', 100),
        ];

        expect(mergeSearchResults(base, [retry], 'onepiece').map((item) => item.id)).toEqual([
            2,
            3,
            1,
        ]);
    });
});
