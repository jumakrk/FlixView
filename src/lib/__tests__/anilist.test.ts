import { describe, expect, it } from 'vitest';
import { parseStreamingEpisodes } from '../anilist';

describe('parseStreamingEpisodes', () => {
    it('maps "Episode N - Title" entries by number regardless of order', () => {
        const result = parseStreamingEpisodes([
            { title: 'Episode 130 - Scent of Danger!', thumbnail: 'https://img/130.jpg' },
            { title: 'Episode 62 - The First Line of Defense?', thumbnail: 'https://img/62.jpg' },
        ]);

        expect(result[130]).toEqual({ title: 'Scent of Danger!', thumbnail: 'https://img/130.jpg' });
        expect(result[62]).toEqual({ title: 'The First Line of Defense?', thumbnail: 'https://img/62.jpg' });
    });

    it('keeps the number when there is no title and accepts other separators', () => {
        const result = parseStreamingEpisodes([
            { title: 'Episode 3', thumbnail: null },
            { title: 'episode 4: Lowercase Works', thumbnail: 'https://img/4.jpg' },
        ]);

        expect(result[3]).toEqual({ title: null, thumbnail: null });
        expect(result[4].title).toBe('Lowercase Works');
    });

    it('skips entries without a readable number and keeps the first duplicate', () => {
        const result = parseStreamingEpisodes([
            { title: 'Special - Recap', thumbnail: 'x' },
            { title: 'Episode 0 - Prologue', thumbnail: 'x' },
            { title: 'Episode 5 - First', thumbnail: 'a' },
            { title: 'Episode 5 - Second', thumbnail: 'b' },
        ]);

        expect(Object.keys(result)).toEqual(['5']);
        expect(result[5].title).toBe('First');
    });

    it('handles missing data', () => {
        expect(parseStreamingEpisodes(null)).toEqual({});
        expect(parseStreamingEpisodes(undefined)).toEqual({});
    });
});
