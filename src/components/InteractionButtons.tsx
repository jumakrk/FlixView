'use client';

import { useState } from 'react';
import { Plus, Heart, Check, Loader2 } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';

interface InteractionButtonsProps {
    contentId: number;
    mediaType: 'movie' | 'tv';
    title?: string; // Made optional to avoid immediate break, but should be passed
    poster?: string | null;
    className?: string;
    showFavorite?: boolean;
}

export default function InteractionButtons({ contentId, mediaType, title = 'Unknown', poster = null, className, showFavorite = true }: InteractionButtonsProps) {
    const { isInWatchlist, isFavorite, addToWatchlist, removeFromWatchlist, addToFavorites, removeFromFavorites } = useData();
    const { user, openAuthModal } = useAuth();

    // Local state to track loading state for better UX
    const [toggling, setToggling] = useState<'watchlist' | 'favorite' | null>(null);

    const idStr = String(contentId);
    const inWatchlist = isInWatchlist(idStr, mediaType);
    const isFav = isFavorite(idStr, mediaType);

    const handleInteraction = async (action: 'watchlist' | 'favorite') => {
        if (!user) {
            openAuthModal();
            return;
        }

        setToggling(action);

        try {
            if (action === 'watchlist') {
                if (inWatchlist) await removeFromWatchlist(idStr, mediaType);
                else await addToWatchlist({ mediaId: idStr, mediaType, title, poster });
            } else {
                if (isFav) await removeFromFavorites(idStr, mediaType);
                else await addToFavorites({ mediaId: idStr, mediaType, title, poster });
            }
        } finally {
            setToggling(null);
        }
    };

    return (
        <div className={`flex items-center gap-3 ${className || ''}`}>
            <button
                onClick={() => handleInteraction('watchlist')}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all transform active:scale-95 border ${inWatchlist ? 'bg-white text-black border-white hover:bg-gray-200' : 'bg-white/10 text-white border-white/10 hover:bg-white/20 hover:border-white/20 backdrop-blur-md'}`}
            >
                {toggling === 'watchlist' ? <Loader2 size={20} className="animate-spin" /> : (inWatchlist ? <Check size={20} /> : <Plus size={20} />)}
                <span className="hidden md:inline">{inWatchlist ? 'In Watchlist' : 'Watchlist'}</span>
            </button>

            {showFavorite && (
                <button
                    onClick={() => handleInteraction('favorite')}
                    className={`p-3.5 rounded-xl border transition-all transform active:scale-95 ${isFav ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-lg shadow-purple-900/40' : 'bg-white/10 text-white border-white/10 hover:bg-white/20 hover:border-white/20 backdrop-blur-md'}`}
                    title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                >
                    {toggling === 'favorite' ? <Loader2 size={20} className="animate-spin" /> : <Heart size={20} className={isFav ? 'fill-current' : ''} />}
                </button>
            )}
        </div>
    );
}
