'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';
import { ProgressRecord, MediaType, MediaData } from '@/lib/types';

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
}

const DataContext = createContext<DataContextType>({} as DataContextType);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const { token } = useAuth();
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [favorites, setFavorites] = useState<WatchlistItem[]>([]);
    const [progress, setProgress] = useState<ProgressRecord[]>([]);

    // Initial Sync
    useEffect(() => {
        if (!token) {
            setWatchlist([]);
            setFavorites([]);
            setProgress([]);
            return;
        }

        const sync = async () => {
            try {
                const data = await api.sync.getData(token);

                // Map DB format to Client Types
                const rawRecords: ProgressRecord[] = data.progress.map((p: any) => {
                    const prog = p.progress_data || {};
                    const rawType = p.media_type;
                    const normalizedType = rawType === 'series' ? 'tv' : rawType as MediaType;

                    return {
                        user_id: p.user_id,
                        media_id: String(p.media_id),
                        media_type: normalizedType,
                        watched_seconds: prog.watched_seconds || 0,
                        duration_seconds: prog.duration_seconds || 0,
                        last_watched_at: prog.last_watched_at || p.updated_at,
                        media_data: p.media_data || {},
                        episodes: prog.episodes || {}
                    };
                });

                // Deduplicate Records (Handle 'series' vs 'tv' collisions)
                // If we have duplicates, keep the one with the LATEST last_watched_at/updated_at.
                const uniqueRecords = new Map<string, ProgressRecord>();

                rawRecords.forEach(record => {
                    const key = `${record.media_id}-${record.media_type}`;
                    const existing = uniqueRecords.get(key);

                    if (!existing) {
                        uniqueRecords.set(key, record);
                    } else {
                        // Compare timestamps
                        const existingTime = new Date(existing.last_watched_at).getTime();
                        const newTime = new Date(record.last_watched_at).getTime();
                        if (newTime > existingTime) {
                            uniqueRecords.set(key, record);
                        }
                    }
                });

                const clientProgress = Array.from(uniqueRecords.values());

                // Lists
                const mapList = (list: any[]): WatchlistItem[] => list.map((i: any) => {
                    const info = i.media_data || {};
                    return {
                        mediaId: String(i.media_id),
                        mediaType: i.media_type as MediaType,
                        title: info.title || 'Unknown',
                        poster: info.posterPath || null,
                        addedAt: new Date(i.created_at).getTime()
                    };
                });

                // Sort progress by last_watched_at descending
                setProgress(clientProgress.sort((a, b) =>
                    new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime()
                ));
                setWatchlist(mapList(data.watchlist));
                setFavorites(mapList(data.favorites));

            } catch (e) {
                console.error('Initial sync failed', e);
            }
        };

        sync();
    }, [token]);

    // --- Actions ---

    const updateProgress = async (newItem: Partial<ProgressRecord> & { media_id: string, media_type: MediaType }) => {
        if (!token) return;

        // Normalize type
        const targetType = (newItem.media_type as string) === 'series' ? 'tv' : newItem.media_type;

        // Helper for strict matching
        const matchRecord = (p: ProgressRecord) => {
            const pType = (p.media_type as string) === 'series' ? 'tv' : p.media_type;
            return p.media_id === newItem.media_id && pType === targetType;
        };

        // 1. Find existing record with strict type matching
        const existingRecord = progress.find(matchRecord);

        // 2. Prepare new record data (Client Side logic for merging)
        // We need to merge episodes carefully
        const updatedEpisodes = {
            ...(existingRecord?.episodes || {}),
            ...(newItem.episodes || {})
        };

        const updatedRecord: ProgressRecord = {
            media_id: newItem.media_id,
            media_type: targetType, // Use normalized type
            user_id: existingRecord?.user_id, // Keep existing user_id if present
            watched_seconds: newItem.watched_seconds ?? existingRecord?.watched_seconds ?? 0,
            duration_seconds: newItem.duration_seconds ?? existingRecord?.duration_seconds ?? 0,
            last_watched_at: new Date().toISOString(),
            media_data: { ...(existingRecord?.media_data || {}), ...(newItem.media_data || {}) },
            episodes: updatedEpisodes,
            season: newItem.season ?? existingRecord?.season,
            episode: newItem.episode ?? existingRecord?.episode
        };

        // 3. Optimistic Update with strict matching
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

        // 4. API Call
        try {
            await api.progress.upsert(token, {
                mediaId: newItem.media_id,
                mediaType: targetType, // Use normalized type
                progressData: {
                    watched_seconds: updatedRecord.watched_seconds,
                    duration_seconds: updatedRecord.duration_seconds,
                    last_watched_at: updatedRecord.last_watched_at,
                    episodes: updatedRecord.episodes,
                    season: updatedRecord.season,
                    episode: updatedRecord.episode
                },
                mediaData: updatedRecord.media_data
            });
        } catch (e) {
            console.error("Failed to sync progress:", e);
            // Revert logic could go here
        }
    };

    const getProgress = useCallback((mediaId: string, mediaType?: MediaType) => {
        if (!mediaType) return progress.find(p => p.media_id === mediaId);

        const targetType = (mediaType as string) === 'series' ? 'tv' : mediaType;
        return progress.find(p => {
            const pType = (p.media_type as string) === 'series' ? 'tv' : p.media_type;
            return p.media_id === mediaId && pType === targetType;
        });
    }, [progress]);

    const isInWatchlist = (mediaId: string, mediaType: MediaType) => {
        return watchlist.some(i => i.mediaId === mediaId && i.mediaType === mediaType);
    };

    const isFavorite = (mediaId: string, mediaType: MediaType) => {
        return favorites.some(i => i.mediaId === mediaId && i.mediaType === mediaType);
    };

    const removeProgress = async (mediaId: string, mediaType: MediaType) => {
        if (!token) return;

        // Strict type check to avoid ID collisions
        const targetType = (mediaType as string) === 'series' ? 'tv' : mediaType;
        const recordToReset = progress.find(p => {
            const pType = (p.media_type as string) === 'series' ? 'tv' : p.media_type;
            return p.media_id === mediaId && pType === targetType;
        });

        if (!recordToReset) return;

        // 1. Soft Reset
        const updatedRecord: ProgressRecord = {
            ...recordToReset,
            watched_seconds: 0,
            episodes: {}, // Explicitly clear all episode progress
            season: undefined,
            episode: undefined,
            last_watched_at: new Date().toISOString()
        };

        // 2. Optimistic Update (Strict Match)
        // We iterate and match manually to handle potential legacy 'series' records in memory
        setProgress(prev => prev.map(p => {
            const pType = (p.media_type as string) === 'series' ? 'tv' : p.media_type;
            return (p.media_id === mediaId && pType === targetType) ? updatedRecord : p;
        }));

        try {
            await api.progress.upsert(token, {
                mediaId,
                mediaType: targetType,
                progressData: {
                    watched_seconds: 0,
                    last_watched_at: updatedRecord.last_watched_at,
                    episodes: {}, // Always clear episodes map
                    season: undefined,
                    episode: undefined
                },
                mediaData: recordToReset.media_data
            });
        } catch (e) {
            console.error("Failed to remove progress:", e);
            // Rollback with strict matching
            setProgress(prev => prev.map(p => {
                const pType = (p.media_type as string) === 'series' ? 'tv' : p.media_type;
                return (p.media_id === mediaId && pType === targetType) ? recordToReset : p;
            }));
        }
    };


    const addToWatchlist = async (item: Omit<WatchlistItem, 'addedAt'>) => {
        if (!token) return;
        setWatchlist(prev => [...prev.filter(i => !(i.mediaId === item.mediaId && i.mediaType === item.mediaType)), { ...item, addedAt: Date.now() }]);
        await api.list.add(token, { ...item, listType: 'watchlist', posterPath: item.poster });
    };

    const removeFromWatchlist = async (mediaId: string, mediaType: MediaType) => {
        if (!token) return;
        setWatchlist(prev => prev.filter(i => !(i.mediaId === mediaId && i.mediaType === mediaType)));
        await api.list.remove(token, { mediaId, mediaType, listType: 'watchlist' });
    };

    const addToFavorites = async (item: Omit<WatchlistItem, 'addedAt'>) => {
        if (!token) return;
        setFavorites(prev => [...prev.filter(i => !(i.mediaId === item.mediaId && i.mediaType === item.mediaType)), { ...item, addedAt: Date.now() }]);
        await api.list.add(token, { ...item, listType: 'favorites', posterPath: item.poster });
    };

    const removeFromFavorites = async (mediaId: string, mediaType: MediaType) => {
        if (!token) return;
        setFavorites(prev => prev.filter(i => !(i.mediaId === mediaId && i.mediaType === mediaType)));
        await api.list.remove(token, { mediaId, mediaType, listType: 'favorites' });
    };

    // --- Helpers ---

    // --- Helpers (moved up) ---


    return (
        <DataContext.Provider value={{
            watchlist, favorites, progress,
            updateProgress, addToWatchlist, removeFromWatchlist, addToFavorites, removeFromFavorites,
            getProgress, isInWatchlist, isFavorite, removeProgress
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
