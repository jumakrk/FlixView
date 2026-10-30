import { describe, expect, it } from 'vitest';
import {
    buildPlayerUrl,
    isTrustedPlayerOrigin,
    PLAYER_ACCENT_COLOR,
    PLAYER_START_FLOOR,
} from '../player';

describe('isTrustedPlayerOrigin', () => {
    it('accepts the provider hosts and their subdomains', () => {
        expect(isTrustedPlayerOrigin('https://vidly.pro')).toBe(true);
        expect(isTrustedPlayerOrigin('https://www.vidly.pro')).toBe(true);
        expect(isTrustedPlayerOrigin('https://cdn.vidly.pro')).toBe(true);
    });

    it('rejects lookalike and unrelated origins', () => {
        expect(isTrustedPlayerOrigin('https://vidly.pro.evil.com')).toBe(false);
        expect(isTrustedPlayerOrigin('https://evil-vidly.pro')).toBe(false);
        expect(isTrustedPlayerOrigin('https://example.com')).toBe(false);
        expect(isTrustedPlayerOrigin('')).toBe(false);
        expect(isTrustedPlayerOrigin('null')).toBe(false);
    });
});

describe('buildPlayerUrl', () => {
    it('builds movie URLs with the app theme and the audio picker disabled', () => {
        const url = new URL(buildPlayerUrl({ mediaId: 550 }));
        expect(url.origin).toBe('https://vidly.pro');
        expect(url.pathname).toBe('/movie/550');
        expect(url.searchParams.get('theme')).toBe('aurora');
        expect(url.searchParams.get('color')).toBe(PLAYER_ACCENT_COLOR);
        expect(url.searchParams.get('autoplay')).toBe('1');
        expect(url.searchParams.get('nextEpisode')).toBe('1');
        expect(url.searchParams.get('audioPicker')).toBe('0');
    });

    it('builds TV URLs with season and episode', () => {
        const url = new URL(buildPlayerUrl({ mediaId: '1399', type: 'tv', season: 3, episode: 7 }));
        expect(url.pathname).toBe('/tv/1399/3/7');
    });

    it('builds anime URLs with the AniList id and defaults to dub', () => {
        const url = new URL(buildPlayerUrl({ mediaId: 154587, type: 'anime', episode: 12 }));
        expect(url.pathname).toBe('/anime/154587/12/dub');
        expect(url.searchParams.get('theme')).toBe('aurora');
        expect(url.searchParams.get('autoplay')).toBe('1');
        expect(url.searchParams.get('nextEpisode')).toBe('1');
        expect(url.searchParams.get('audioPicker')).toBe('0');
    });

    it('honours an explicit anime audio track', () => {
        const url = new URL(buildPlayerUrl({ mediaId: 154587, type: 'anime', audio: 'sub' }));
        expect(url.pathname).toBe('/anime/154587/1/sub');
    });

    it('floors fractional resume positions', () => {
        const url = new URL(buildPlayerUrl({ mediaId: 550, startTime: 125.9 }));
        expect(url.searchParams.get('t')).toBe('125');
    });

    it('never sends t=0, which the player would treat as "not provided"', () => {
        for (const startTime of [0, -10, Number.NaN, Number.POSITIVE_INFINITY]) {
            const url = new URL(buildPlayerUrl({ mediaId: 550, startTime }));
            expect(url.searchParams.get('t')).toBe(String(PLAYER_START_FLOOR));
        }
    });
});
