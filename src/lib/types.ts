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
            downloadUpdate: () => Promise<void>;
            quitAndInstall: () => Promise<void>;
            getAppVersion: () => Promise<string>;
            purgePlayerCache: (tmdbId: string) => Promise<{ success: boolean; error?: string }>;
        };
    }
}
