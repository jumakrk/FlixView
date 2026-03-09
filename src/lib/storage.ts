export type MediaType = 'movie' | 'tv';

export interface WatchProgress {
    mediaId: string;
    mediaType: MediaType;
    seasonNumber?: number;
    episodeNumber?: number;
    currentTime: number;
    duration: number;
    lastUpdated: number;
}

export interface WatchlistItem {
    mediaId: string;
    mediaType: MediaType;
    title: string;
    poster: string | null;
    addedAt: number;
}

const KEYS = {
    WATCHLIST: 'flixview_watchlist',
    FAVORITES: 'flixview_favorites',
    // PROGRESS_PREFIX: 'progress_' // Deprecated
};
interface ProgressData {
    watched: number;
    duration: number;
}

interface EpisodeEntry {
    season: number;
    episode: number;
    progress: ProgressData;
    last_updated: number;
}

interface ShowEntry {
    id: number;
    type: 'tv';
    title?: string;
    poster_path?: string;
    progress: ProgressData; // Overall show progress (maybe just latest ep?)
    last_season_watched: number;
    last_episode_watched: number;
    show_progress: Record<string, EpisodeEntry>; // Key "s{S}e{E}"
    last_updated: number;
}

interface MovieEntry {
    id: number;
    type: 'movie';
    title?: string;
    poster_path?: string;
    progress: ProgressData;
    last_updated: number;
}

type MediaEntry = ShowEntry | MovieEntry;

const getStorageKey = (mediaId: string, mediaType: MediaType) => {
    // User format: "t{id}" for tv, "m{id}" for movie?
    // User example: "t63174".
    const prefix = mediaType === 'tv' ? 't' : 'm';
    return `${prefix}${mediaId}`;
};

export const saveProgress = (progress: Omit<WatchProgress, 'lastUpdated'>) => {
    try {
        const storageKey = getStorageKey(progress.mediaId, progress.mediaType);
        const now = Date.now();

        let entry: MediaEntry;
        const existing = localStorage.getItem(storageKey);

        if (existing) {
            entry = JSON.parse(existing);
        } else {
            // Create new
            if (progress.mediaType === 'tv') {
                entry = {
                    id: parseInt(progress.mediaId),
                    type: 'tv',
                    last_season_watched: progress.seasonNumber || 1,
                    last_episode_watched: progress.episodeNumber || 1,
                    progress: { watched: progress.currentTime, duration: progress.duration },
                    last_updated: now,
                    show_progress: {}
                } as ShowEntry;
            } else {
                entry = {
                    id: parseInt(progress.mediaId),
                    type: 'movie',
                    progress: { watched: progress.currentTime, duration: progress.duration },
                    last_updated: now
                } as MovieEntry;
            }
        }

        // Update Entry
        entry.last_updated = now;
        if (entry.type === 'tv' && progress.seasonNumber && progress.episodeNumber) {
            const showEntry = entry as ShowEntry;
            const epKey = `s${progress.seasonNumber}e${progress.episodeNumber}`;

            showEntry.show_progress[epKey] = {
                season: progress.seasonNumber,
                episode: progress.episodeNumber,
                progress: { watched: progress.currentTime, duration: progress.duration },
                last_updated: now
            };

            // Allow updating pointers if this is indeed the latest action
            // Simplest logic: Always update "last watched" to the one currently being saved, 
            // as this function is called on TimeUpdate or Sync.
            showEntry.last_season_watched = progress.seasonNumber;
            showEntry.last_episode_watched = progress.episodeNumber;
            showEntry.progress = { watched: progress.currentTime, duration: progress.duration }; // Current active
        } else if (entry.type === 'movie') {
            const movieEntry = entry as MovieEntry;
            movieEntry.progress = { watched: progress.currentTime, duration: progress.duration };
        }

        localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (e) {
        console.error('Failed to save progress', e);
    }
};

export const loadProgress = (mediaId: string, mediaType: MediaType, season?: number, episode?: number): WatchProgress | null => {
    try {
        const storageKey = getStorageKey(mediaId, mediaType);
        const data = localStorage.getItem(storageKey);
        if (!data) return null;

        const entry = JSON.parse(data) as MediaEntry;

        if (entry.type === 'tv') {
            const showEntry = entry as ShowEntry;
            // If specific season/episode requested, try to find it
            if (season && episode) {
                const epKey = `s${season}e${episode}`;
                const epData = showEntry.show_progress[epKey];
                if (epData) {
                    return {
                        mediaId: mediaId,
                        mediaType: 'tv',
                        seasonNumber: epData.season,
                        episodeNumber: epData.episode,
                        currentTime: epData.progress.watched,
                        duration: epData.progress.duration,
                        lastUpdated: epData.last_updated
                    };
                }
                return null; // Requested ep not found
            } else {
                // Return "Last Watched"
                const lastS = showEntry.last_season_watched;
                const lastE = showEntry.last_episode_watched;
                const epKey = `s${lastS}e${lastE}`;
                const epData = showEntry.show_progress[epKey];
                if (epData) {
                    return {
                        mediaId: mediaId,
                        mediaType: 'tv',
                        seasonNumber: epData.season,
                        episodeNumber: epData.episode,
                        currentTime: epData.progress.watched,
                        duration: epData.progress.duration,
                        lastUpdated: epData.last_updated
                    };
                }
                return null;
            }
        } else {
            const movieEntry = entry as MovieEntry;
            return {
                mediaId: mediaId,
                mediaType: 'movie',
                currentTime: movieEntry.progress.watched,
                duration: movieEntry.progress.duration,
                lastUpdated: movieEntry.last_updated
            };
        }
    } catch (e) {
        return null;
    }
};

export const getAllProgress = (): WatchProgress[] => {
    try {
        const items: WatchProgress[] = [];
        Object.keys(localStorage).forEach(key => {
            // Check keys starting with 't' or 'm' followed by digits? 
            // User format is "t123" or "m123".
            // To incorporate legacy keys or just strict new keys? strict new.
            if (/^[tm]\d+$/.test(key)) {
                const data = localStorage.getItem(key);
                if (data) {
                    const entry = JSON.parse(data) as MediaEntry;
                    if (entry.type === 'movie') {
                        items.push({
                            mediaId: entry.id.toString(),
                            mediaType: 'movie',
                            currentTime: entry.progress.watched,
                            duration: entry.progress.duration,
                            lastUpdated: entry.last_updated
                        });
                    } else if (entry.type === 'tv') {
                        // For TV, return the LAST WATCHED episode as the main entry
                        const showEntry = entry as ShowEntry;
                        const lastS = showEntry.last_season_watched;
                        const lastE = showEntry.last_episode_watched;
                        const epKey = `s${lastS}e${lastE}`;
                        const epData = showEntry.show_progress[epKey];
                        if (epData) {
                            items.push({
                                mediaId: entry.id.toString(),
                                mediaType: 'tv',
                                seasonNumber: epData.season,
                                episodeNumber: epData.episode,
                                currentTime: epData.progress.watched,
                                duration: epData.progress.duration,
                                lastUpdated: epData.last_updated
                            });
                        }
                    }
                }
            }
        });
        return items.sort((a, b) => b.lastUpdated - a.lastUpdated);
    } catch (e) {
        return [];
    }
};

export const deleteProgress = (mediaId: string, mediaType: MediaType, season?: number, episode?: number) => {
    try {
        const storageKey = getStorageKey(mediaId, mediaType);

        if (mediaType === 'movie') {
            localStorage.removeItem(storageKey);
        } else {
            // For TV, complicated. Do we delete ONLY the episode or the whole show?
            // "Clear Cache" wipes everything.
            // "X" button usually implies "Remove from Continue Watching".
            // If user removes from Continue Watching, we usually delete the whole show entry or just the 'latest' flag?
            // Usually delete the whole show entry to hide it.
            // But if we delete specific episode progress?
            // Let's assume deleteProgress is mainly used for "Clear from Row" (id/type only) or "Finished Reset".

            // If season/episode provided (Reset logic from WatchClient):
            if (season && episode) {
                const data = localStorage.getItem(storageKey);
                if (data) {
                    const showEntry = JSON.parse(data) as ShowEntry;
                    const epKey = `s${season}e${episode}`;
                    delete showEntry.show_progress[epKey];
                    // If we deleted the 'last watched', we should probably find the next latest?
                    // For now, let's just save. If 'last_season/ep' points to missing data, loadProgress handles it (returns null).
                    localStorage.setItem(storageKey, JSON.stringify(showEntry));
                }
            } else {
                // Delete entire show (x button)
                localStorage.removeItem(storageKey);
            }
        }
    } catch (e) {
        console.error('Failed to delete progress', e);
    }
};

// --- Watchlist & Favorites ---

const getList = (key: string): WatchlistItem[] => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
};

const saveList = (key: string, list: WatchlistItem[]) => {
    try {
        localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
        console.error(`Failed to save list ${key}`, e);
    }
};

export const getWatchlist = () => getList(KEYS.WATCHLIST);
export const addToWatchlist = (item: Omit<WatchlistItem, 'addedAt'>) => {
    const list = getWatchlist();
    if (!list.some(i => i.mediaId === item.mediaId && i.mediaType === item.mediaType)) {
        list.push({ ...item, addedAt: Date.now() });
        saveList(KEYS.WATCHLIST, list);
    }
};
export const removeFromWatchlist = (mediaId: string, mediaType: MediaType) => {
    const list = getWatchlist();
    const newList = list.filter(i => !(i.mediaId === mediaId && i.mediaType === mediaType));
    saveList(KEYS.WATCHLIST, newList);
};

export const getFavorites = () => getList(KEYS.FAVORITES);
export const addToFavorites = (item: Omit<WatchlistItem, 'addedAt'>) => {
    const list = getFavorites();
    if (!list.some(i => i.mediaId === item.mediaId && i.mediaType === item.mediaType)) {
        list.push({ ...item, addedAt: Date.now() });
        saveList(KEYS.FAVORITES, list);
    }
};
export const removeFromFavorites = (mediaId: string, mediaType: MediaType) => {
    const list = getFavorites();
    const newList = list.filter(i => !(i.mediaId === mediaId && i.mediaType === mediaType));
    saveList(KEYS.FAVORITES, newList);
};

// --- Clear User Data ---

export const clearAllUserData = () => {
    try {
        localStorage.clear();
    } catch (e) {
        console.error('Failed to clear user data', e);
    }
};
