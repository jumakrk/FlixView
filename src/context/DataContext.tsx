'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ProgressRecord, MediaType, MediaData, EpisodeProgress } from '@/lib/types';

interface WatchlistItem {
    mediaId: string;
    mediaType: MediaType;
    title: string;
    poster: string | null;
    addedAt: number;
}

interface DataContextType {
    watchlist: WatchlistItem[];
    favorites: WatchlistItem[];
    progress: ProgressRecord[];

    // Actions
    updateProgress: (data: Partial<ProgressRecord> & { media_id: string, media_type: MediaType }) => Promise<void>;
    addToWatchlist: (item: Omit<WatchlistItem, 'addedAt'>) => Promise<void>;
    removeFromWatchlist: (mediaId: string, mediaType: MediaType) => Promise<void>;
    addToFavorites: (item: Omit<WatchlistItem, 'addedAt'>) => Promise<void>;
    removeFromFavorites: (mediaId: string, mediaType: MediaType) => Promise<void>;

    // Helpers
    getProgress: (mediaId: string, mediaType?: MediaType) => ProgressRecord | undefined;
    isInWatchlist: (mediaId: string, mediaType: MediaType) => boolean;
    isFavorite: (mediaId: string, mediaType: MediaType) => boolean;
    removeProgress: (mediaId: string, mediaType: MediaType) => Promise<void>;
    clearData: (type: 'favorites' | 'watchlist' | 'progress' | 'all') => Promise<void>;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [favorites, setFavorites] = useState<WatchlistItem[]>([]);
    const [progress, setProgress] = useState<ProgressRecord[]>([]);

    // 1. Initial Load from Local File System via Electron IPC
    useEffect(() => {
        if (typeof window !== 'undefined' && window.electron) {
            const loadData = async () => {
                const w = await window.electron.getAllData('watchlist');
                const f = await window.electron.getAllData('favorites');
                const p = await window.electron.getAllData('progress');
                
                setWatchlist(w || []);
                setFavorites(f || []);
                
                // Sort progress by last_watched_at
                const sortedProgress = (p || []).sort((a: any, b: any) => 
                    new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime()
                );
                setProgress(sortedProgress);
            };
            loadData();
        } else {
            // Fallback to localStorage for web (though this app should be run in electron)
            const storedWatchlist = localStorage.getItem('flixview_watchlist');
            const storedFavorites = localStorage.getItem('flixview_favorites');
            const storedProgress = localStorage.getItem('flixview_progress');

            try {
                if (storedWatchlist) setWatchlist(JSON.parse(storedWatchlist));
            } catch (e) {
                console.error("Failed to parse watchlist from localStorage (data may be corrupted):", e);
                localStorage.removeItem('flixview_watchlist');
            }

            try {
                if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
            } catch (e) {
                console.error("Failed to parse favorites from localStorage (data may be corrupted):", e);
                localStorage.removeItem('flixview_favorites');
            }

            try {
                if (storedProgress) setProgress(JSON.parse(storedProgress));
            } catch (e) {
                console.error("Failed to parse progress from localStorage (data may be corrupted):", e);
                localStorage.removeItem('flixview_progress');
            }
        }
    }, []);

    // 2. Persist to LocalStorage as a fallback on Change
    useEffect(() => {
        if (typeof window === 'undefined' || !window.electron) {
            localStorage.setItem('flixview_watchlist', JSON.stringify(watchlist));
        }
    }, [watchlist]);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.electron) {
            localStorage.setItem('flixview_favorites', JSON.stringify(favorites));
        }
    }, [favorites]);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.electron) {
            localStorage.setItem('flixview_progress', JSON.stringify(progress));
        }
    }, [progress]);

    // --- Actions ---

    const updateProgress = async (newItem: Partial<ProgressRecord> & { media_id: string, media_type: MediaType }) => {
        const targetType = (newItem.media_type as string) === 'series' ? 'tv' : newItem.media_type;

        const matchRecord = (p: ProgressRecord) => {
            const pType = (p.media_type as string) === 'series' ? 'tv' : p.media_type;
            return String(p.media_id) === String(newItem.media_id) && pType === targetType;
        };

        const existingRecord = progress.find(matchRecord);

        const nowIso = new Date().toISOString();

        // Stamp the updated episode(s) with a timestamp so we can always find
        // the most-recently-watched one.
        const stampedEpisodes: Record<string, EpisodeProgress> = {};
        if (newItem.episodes) {
            for (const key of Object.keys(newItem.episodes)) {
                const ep = newItem.episodes[key];
                if (ep) stampedEpisodes[key] = { ...ep, last_watched_at: nowIso };
            }
        }

        const updatedEpisodes = {
            ...(existingRecord?.episodes || {}),
            ...stampedEpisodes
        };

        const updatedRecord: ProgressRecord = {
            media_id: newItem.media_id,
            media_type: targetType,
            user_id: existingRecord?.user_id,
            watched_seconds: newItem.watched_seconds ?? existingRecord?.watched_seconds ?? 0,
            duration_seconds: newItem.duration_seconds ?? existingRecord?.duration_seconds ?? 0,
            last_watched_at: nowIso,
            media_data: { ...(existingRecord?.media_data || {}), ...(newItem.media_data || {}) },
            episodes: updatedEpisodes,
            season: newItem.season ?? existingRecord?.season,
            episode: newItem.episode ?? existingRecord?.episode
        };

        setProgress(prev => {
            const index = prev.findIndex(matchRecord);
            const newArr = [...prev];
            if (index > -1) {
                newArr[index] = updatedRecord;
            } else {
                newArr.unshift(updatedRecord);
            }
            return newArr.sort((a, b) => new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime());
        });

        if (typeof window !== 'undefined' && window.electron) {
            await window.electron.saveData('progress', `${newItem.media_id}_${targetType}`, updatedRecord);
        }
    };

    const getProgress = useCallback((mediaId: string, mediaType?: MediaType) => {
        if (!mediaType) return progress.find(p => String(p.media_id) === String(mediaId));

        const targetType = (mediaType as string) === 'series' ? 'tv' : mediaType;
        return progress.find(p => {
            const pType = (p.media_type as string) === 'series' ? 'tv' : p.media_type;
            return String(p.media_id) === String(mediaId) && pType === targetType;
        });
    }, [progress]);

    const isInWatchlist = (mediaId: string, mediaType: MediaType) => {
        return watchlist.some(i => String(i.mediaId) === String(mediaId) && i.mediaType === mediaType);
    };

    const isFavorite = (mediaId: string, mediaType: MediaType) => {
        return favorites.some(i => String(i.mediaId) === String(mediaId) && i.mediaType === mediaType);
    };

    const removeProgress = async (mediaId: string, mediaType: MediaType) => {
        const targetType = (mediaType as string) === 'series' ? 'tv' : mediaType;
        
        setProgress(prev => prev.filter(p => {
            const pType = (p.media_type as string) === 'series' ? 'tv' : p.media_type;
            return !(String(p.media_id) === String(mediaId) && pType === targetType);
        }));

        // Purge the player's internal per-episode cache so ALL episodes reset to 0,
        // not just the one currently reflected in the record pointer. Await it so the
        // cache is wiped before we delete our own record.
        if (typeof window !== 'undefined' && window.electron?.purgePlayerCache) {
            await window.electron.purgePlayerCache(mediaId).catch(console.error);
        }

        if (typeof window !== 'undefined' && window.electron) {
            await window.electron.deleteData('progress', `${mediaId}_${targetType}`);
        }
    };

    const addToWatchlist = async (item: Omit<WatchlistItem, 'addedAt'>) => {
        const newItem = { ...item, addedAt: Date.now() };
        setWatchlist(prev => [...prev.filter(i => !(String(i.mediaId) === String(item.mediaId) && i.mediaType === item.mediaType)), newItem]);
        if (typeof window !== 'undefined' && window.electron) {
            await window.electron.saveData('watchlist', `${item.mediaId}_${item.mediaType}`, newItem);
        }
    };

    const removeFromWatchlist = async (mediaId: string, mediaType: MediaType) => {
        setWatchlist(prev => prev.filter(i => !(String(i.mediaId) === String(mediaId) && i.mediaType === mediaType)));
        if (typeof window !== 'undefined' && window.electron) {
            await window.electron.deleteData('watchlist', `${mediaId}_${mediaType}`);
        }
    };

    const addToFavorites = async (item: Omit<WatchlistItem, 'addedAt'>) => {
        const newItem = { ...item, addedAt: Date.now() };
        setFavorites(prev => [...prev.filter(i => !(String(i.mediaId) === String(item.mediaId) && i.mediaType === item.mediaType)), newItem]);
        if (typeof window !== 'undefined' && window.electron) {
            await window.electron.saveData('favorites', `${item.mediaId}_${item.mediaType}`, newItem);
        }
    };

    const removeFromFavorites = async (mediaId: string, mediaType: MediaType) => {
        setFavorites(prev => prev.filter(i => !(String(i.mediaId) === String(mediaId) && i.mediaType === mediaType)));
        if (typeof window !== 'undefined' && window.electron) {
            await window.electron.deleteData('favorites', `${mediaId}_${mediaType}`);
        }
    };

    const clearData = async (type: 'favorites' | 'watchlist' | 'progress' | 'all') => {
        if (type === 'favorites' || type === 'all') setFavorites([]);
        if (type === 'watchlist' || type === 'all') setWatchlist([]);
        if (type === 'progress' || type === 'all') setProgress([]);

        if (typeof window !== 'undefined' && window.electron) {
            await window.electron.clearAllData(type);
            if (type === 'progress' || type === 'all') {
                if (window.electron.purgePlayerCache) {
                    await window.electron.purgePlayerCache('all'); // ID doesn't matter anymore, it clears by origin
                }
            }
        }
    };

    return (
        <DataContext.Provider value={{
            watchlist, favorites, progress,
            updateProgress, addToWatchlist, removeFromWatchlist, addToFavorites, removeFromFavorites,
            getProgress, isInWatchlist, isFavorite, removeProgress, clearData
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
