'use client';

import { useData } from "@/context/DataContext";
import { fetchDetails, MovieDetails } from "@/lib/tmdb";
import MovieCard from "@/components/MovieCard";
import { Bookmark, Loader2 } from 'lucide-react';
import { useEffect, useState } from "react";
import Link from 'next/link';

export default function WatchlistPage() {
    const { watchlist } = useData();
    const [contentItems, setContentItems] = useState<any[]>([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(true);

    useEffect(() => {
        async function loadDetails() {
            if (watchlist.length === 0) {
                setContentItems([]);
                setIsLoadingDetails(false);
                return;
            }

            const promises = watchlist.map(async (item) => {
                try {
                    const detail = await fetchDetails(item.mediaId, item.mediaType);
                    return detail ? { ...detail, media_type: item.mediaType } : null;
                } catch (e) {
                    return null;
                }
            });

            const results = (await Promise.all(promises)).filter(Boolean);
            setContentItems(results.reverse());
            setIsLoadingDetails(false);
        }

        loadDetails();
    }, [watchlist]);

    if (isLoadingDetails) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center bg-black">
                <Loader2 className="animate-spin text-[#7c3aed]" size={40} />
            </div>
        );
    }

    // Empty State
    if (contentItems.length === 0) {
        return (
            <div className="min-h-screen pt-32 px-[4%] flex flex-col items-center justify-center text-center bg-black">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Bookmark size={40} className="text-violet-500" />
                </div>
                <h1 className="text-3xl font-bold mb-4 text-white">Your Watchlist is Empty</h1>
                <p className="text-gray-400 max-w-md mb-8">
                    Save shows and movies to track what you want to watch. They will appear here.
                </p>
                <Link href="/" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors">
                    Browse Content
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-20 px-[4%] bg-black">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Bookmark className="text-[#7c3aed]" />
                My Watchlist
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {contentItems.map((item: any) => (
                    <MovieCard key={item.id} movie={item} fullWidth />
                ))}
            </div>
        </div>
    );
}
