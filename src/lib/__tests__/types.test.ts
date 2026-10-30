import { describe, expect, it } from 'vitest';
import { getLastWatchedEpisode, ProgressRecord } from '../types';

const record = (overrides: Partial<ProgressRecord> = {}): ProgressRecord => ({
    media_id: '1399',
    media_type: 'tv',
    watched_seconds: 0,
    duration_seconds: 0,
    last_watched_at: '2026-01-01T00:00:00.000Z',
    media_data: {},
    ...overrides,
});

describe('getLastWatchedEpisode', () => {
    it('defaults to S1E1 without a record', () => {
        expect(getLastWatchedEpisode(undefined)).toEqual({ season: 1, episode: 1 });
    });

    it('defaults to S1E1 for an empty record', () => {
        expect(getLastWatchedEpisode(record())).toEqual({ season: 1, episode: 1 });
    });

    it('prefers the episode with the most recent last_watched_at', () => {
        const rec = record({
            episodes: {
                s1e1: {
                    season_number: 1,
                    episode_number: 1,
                    watched_seconds: 100,
                    duration_seconds: 100,
                    last_watched_at: '2026-01-01T00:00:00.000Z',
                },
                s1e2: {
                    season_number: 1,
                    episode_number: 2,
                    watched_seconds: 50,
                    duration_seconds: 100,
                    last_watched_at: '2026-01-02T00:00:00.000Z',
                },
            },
        });
        expect(getLastWatchedEpisode(rec)).toEqual({ season: 1, episode: 2 });
    });

    it('ignores episodes with no watched progress', () => {
        const rec = record({
            season: 2,
            episode: 4,
            episodes: {
                s2e4: { season_number: 2, episode_number: 4, watched_seconds: 0, duration_seconds: 100 },
            },
        });
        expect(getLastWatchedEpisode(rec)).toEqual({ season: 2, episode: 4 });
    });

    it('falls back to the season/episode pointer when episodes are missing', () => {
        const rec = record({ season: 5, episode: 9 });
        expect(getLastWatchedEpisode(rec)).toEqual({ season: 5, episode: 9 });
    });

    it('falls back to the highest episode with progress when no pointer exists', () => {
        const rec = record({
            episodes: {
                s1e1: { season_number: 1, episode_number: 1, watched_seconds: 100, duration_seconds: 100 },
                s1e5: { season_number: 1, episode_number: 5, watched_seconds: 30, duration_seconds: 100 },
                s2e1: { season_number: 2, episode_number: 1, watched_seconds: 10, duration_seconds: 100 },
            },
        });
        expect(getLastWatchedEpisode(rec)).toEqual({ season: 2, episode: 1 });
    });
});
