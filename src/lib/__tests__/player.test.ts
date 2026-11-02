import { describe, expect, it } from 'vitest';
import {
    buildPlayerUrl,
    isTrustedPlayerOrigin,
    PLAYER_ACCENT_COLOR,
    PLAYER_BRAND,
    PLAYER_FONT,
    PLAYER_UI_SCALE,
} from '../player';

describe('isTrustedPlayerOrigin', () => {
    it('accepts the provider hosts, including the older .in domain', () => {
        expect(isTrustedPlayerOrigin('https://embed.vidrift.net')).toBe(true);
        expect(isTrustedPlayerOrigin('https://embed.vidrift.in')).toBe(true);
        expect(isTrustedPlayerOrigin('https://vidrift.net')).toBe(true);
    });

    it('rejects lookalike and unrelated origins', () => {
        expect(isTrustedPlayerOrigin('https://embed.vidrift.net.evil.com')).toBe(false);
        expect(isTrustedPlayerOrigin('https://evil-vidrift.net')).toBe(false);
        expect(isTrustedPlayerOrigin('https://vidly.pro')).toBe(false);
        expect(isTrustedPlayerOrigin('')).toBe(false);
        expect(isTrustedPlayerOrigin('null')).toBe(false);
    });
});

describe('buildPlayerUrl', () => {
    it('builds movie URLs skinned to match the app', () => {
        const url = new URL(buildPlayerUrl({ mediaId: 550 }));
        expect(url.origin).toBe('https://embed.vidrift.net');
        expect(url.pathname).toBe('/embed/movie/550');
        expect(url.searchParams.get('brand')).toBe(PLAYER_BRAND);
        expect(url.searchParams.get('brandColor')).toBe(PLAYER_ACCENT_COLOR);
        expect(url.searchParams.get('font')).toBe(PLAYER_FONT);
        expect(url.searchParams.get('uiScale')).toBe(PLAYER_UI_SCALE);
        expect(url.searchParams.get('caps')).toBe('0');
        expect(url.searchParams.get('exit')).toBe('1');
        expect(url.searchParams.get('fs')).toBe('parent');
        expect(url.searchParams.get('autoplay')).toBe('1');
        expect(url.searchParams.get('muted')).toBe('0');
    });

    it('leaves out options that are off by default or not wanted', () => {
        const url = new URL(buildPlayerUrl({ mediaId: 550 }));
        for (const name of ['brandLogo', 'watermark', 'controlBg', 'hide', 'mobileSheets', 'dub']) {
            expect(url.searchParams.has(name)).toBe(false);
        }
    });

    it('builds TV URLs with season and episode', () => {
        const url = new URL(buildPlayerUrl({ mediaId: '1399', type: 'tv', season: 3, episode: 7 }));
        expect(url.pathname).toBe('/embed/tv/1399/3/7');
    });

    it('builds anime URLs from the AniList id and starts on the dub', () => {
        const url = new URL(buildPlayerUrl({ mediaId: 21, type: 'anime', episode: 150 }));
        expect(url.pathname).toBe('/embed/anilist/21/150');
        expect(url.searchParams.get('dub')).toBe('1');
        expect(url.searchParams.get('brand')).toBe(PLAYER_BRAND);
    });

    it('uses the episode-less AniList route for anime movies', () => {
        const url = new URL(buildPlayerUrl({ mediaId: 199, type: 'anime', isAnimeMovie: true }));
        expect(url.pathname).toBe('/embed/anilist/199');
    });

    it('honours an explicit sub audio track for anime', () => {
        const url = new URL(buildPlayerUrl({ mediaId: 21, type: 'anime', audio: 'sub' }));
        expect(url.searchParams.has('dub')).toBe(false);
    });
});
