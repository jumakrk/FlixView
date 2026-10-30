'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MediaType, isEpisodicType } from '@/lib/types';

interface PlayerContextType {
    openPlayer: (id: string | number, type?: MediaType, season?: number, episode?: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
    const router = useRouter();

    const openPlayer = (id: string | number, type: MediaType = 'movie', season: number = 1, episode: number = 1) => {
        const params = new URLSearchParams({ type, id: String(id) });
        if (isEpisodicType(type)) {
            params.set('season', String(season));
            params.set('episode', String(episode));
        }
        const targetPath = '/watch/';

        // Handle both trailing and non-trailing slash for comparison
        const isCurrentlyWatching = window.location.pathname.startsWith('/watch');

        if (isCurrentlyWatching) {
            router.replace(`${targetPath}?${params.toString()}`);
        } else {
            router.push(`${targetPath}?${params.toString()}`);
        }
    };

    return (
        <PlayerContext.Provider value={{ openPlayer }}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
}
