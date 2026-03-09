export type MediaType = 'movie' | 'tv';

export interface EpisodeProgress {
    season_number: number;
    episode_number: number;
    watched_seconds: number;
    duration_seconds: number;
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

declare global {
    interface Window {
        electron: {
            saveProgress: (fileName: string, data: any) => Promise<{ success: boolean; error?: string }>;
            loadProgress: (fileName: string) => Promise<any>;
            deleteProgress: (fileName: string) => Promise<{ success: boolean; error?: string }>;
            getAllProgress: () => Promise<any[]>;
            clearAllProgress: () => Promise<{ success: boolean; error?: string }>;

            // Auto Updater
            onUpdateAvailable: (callback: (info: any) => void) => void;
            onUpdateError: (callback: (error: string) => void) => void;
            onDownloadProgress: (callback: (progress: any) => void) => void;
            onUpdateDownloaded: (callback: (info: any) => void) => void;
            quitAndInstall: () => Promise<void>;
            getAppVersion: () => Promise<string>;
        };
    }
}
