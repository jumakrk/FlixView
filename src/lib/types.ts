export type MediaType = 'movie' | 'tv';

export interface EpisodeProgress {
    season_number: number;
    episode_number: number;
    watched_seconds: number;
    duration_seconds: number;
    last_watched_at?: string;
}

export interface MediaData {
    title?: string;
    poster_path?: string;
    [key: string]: any;
}

export interface ProgressRecord {
    user_id?: string; // Optional on client before sync
    media_id: string; // Changed to string to match existing app ID usage
    media_type: MediaType;
    watched_seconds: number; // For movies, or last watched episode for TV
    duration_seconds: number;
    last_watched_at: string; // ISO String
    media_data: MediaData;

    // Track last watched episode for TV
    season?: number;
    episode?: number;

    // Key: "s{season}e{episode}" e.g., "s1e5"
    episodes?: Record<string, EpisodeProgress>;
}

// Compute the most-recently-watched episode for a TV record.
// Falls back to the record's season/episode pointer, then to the highest
// episode with any watched progress, and finally to S1E1.
export function getLastWatchedEpisode(record: ProgressRecord | undefined): { season: number; episode: number } {
    if (!record) return { season: 1, episode: 1 };

    const episodes = record.episodes || {};

    // 1. Highest last_watched_at timestamp wins.
    let best: EpisodeProgress | null = null;
    for (const key of Object.keys(episodes)) {
        const ep = episodes[key];
        if (!ep || ep.watched_seconds <= 0) continue;
        if (!best) { best = ep; continue; }
        const bestTime = best.last_watched_at ? new Date(best.last_watched_at).getTime() : 0;
        const curTime = ep.last_watched_at ? new Date(ep.last_watched_at).getTime() : 0;
        if (curTime >= bestTime) best = ep;
    }

    if (best && best.season_number && best.episode_number) {
        return { season: best.season_number, episode: best.episode_number };
    }

    // 2. Fall back to the explicit pointer.
    if (record.season && record.episode) {
        return { season: record.season, episode: record.episode };
    }

    // 3. Highest season/episode with any progress.
    let maxSeason = 1;
    let maxEpisode = 1;
    for (const key of Object.keys(episodes)) {
        const ep = episodes[key];
        if (!ep || ep.watched_seconds <= 0) continue;
        if (ep.season_number > maxSeason || (ep.season_number === maxSeason && ep.episode_number > maxEpisode)) {
            maxSeason = ep.season_number;
            maxEpisode = ep.episode_number;
        }
    }

    return { season: maxSeason, episode: maxEpisode };
}

declare global {
    interface Window {
        electron: {
            saveData: (type: string, fileName: string, data: any) => Promise<{ success: boolean; error?: string }>;
            loadData: (type: string, fileName: string) => Promise<any>;
            deleteData: (type: string, fileName: string) => Promise<{ success: boolean; error?: string }>;
            getAllData: (type: string) => Promise<any[]>;
            clearAllData: (type: string) => Promise<{ success: boolean; error?: string }>;
            
            exportData: () => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
            importData: () => Promise<{ success: boolean; canceled?: boolean; error?: string }>;


            // Auto Updater
            onUpdateAvailable: (callback: (info: any) => void) => void;
            onUpdateError: (callback: (error: string) => void) => void;
            onDownloadProgress: (callback: (progress: any) => void) => void;
            onUpdateDownloaded: (callback: (info: any) => void) => void;
            onUpdateNotAvailable: (callback: () => void) => void;
            checkForUpdates: () => Promise<void>;
            downloadUpdate: () => Promise<void>;
            quitAndInstall: () => Promise<void>;
            getAppVersion: () => Promise<string>;
            getPlatform: () => Promise<string>;
            purgePlayerCache: (tmdbId: string) => Promise<{ success: boolean; error?: string }>;
        };
    }
}
