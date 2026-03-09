'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface PlayerContextType {
    openPlayer: (id: string | number, type?: 'movie' | 'tv', season?: number, episode?: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
    const router = useRouter();

    const openPlayer = (id: string | number, type: 'movie' | 'tv' = 'movie', season: number = 1, episode: number = 1) => {
        const query = `?type=${type}&id=${id}${type === 'tv' ? `&season=${season}&episode=${episode}` : ''}`;
        const targetPath = '/watch/';

        // Handle both trailing and non-trailing slash for comparison
        const isCurrentlyWatching = window.location.pathname.startsWith('/watch');

        if (isCurrentlyWatching) {
            router.replace(`${targetPath}${query}`);
        } else {
            router.push(`${targetPath}${query}`);
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
