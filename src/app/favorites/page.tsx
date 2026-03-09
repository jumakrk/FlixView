'use client';

import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { fetchDetails } from "@/lib/tmdb";
import MovieCard from "@/components/MovieCard";
import { Heart, Loader2 } from 'lucide-react';
import { useEffect, useState } from "react";
import Link from 'next/link';

export default function FavoritesPage() {
    const { favorites } = useData();
    const { user, openAuthModal, isLoading: isAuthLoading } = useAuth();
    const [contentItems, setContentItems] = useState<any[]>([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(true);

    useEffect(() => {
        async function loadDetails() {
            if (isAuthLoading) return;
            if (!user) {
                setIsLoadingDetails(false);
                return;
            }

            if (favorites.length === 0) {
                setContentItems([]);
                setIsLoadingDetails(false);
                return;
            }

            const promises = favorites.map(async (item) => {
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
    }, [favorites, user, isAuthLoading]);

    if (isAuthLoading || (user && isLoadingDetails)) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center bg-black">
                <Loader2 className="animate-spin text-rose-500" size={40} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen pt-32 px-[4%] flex flex-col items-center justify-center text-center bg-black">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Heart size={40} className="text-rose-500" />
                </div>
                <h1 className="text-3xl font-bold mb-4 text-white">Login Required</h1>
                <p className="text-gray-400 max-w-md mb-8">
                    You need to be logged in to save favorites.
                </p>
                <button
                    onClick={openAuthModal}
                    className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-violet-900/20 active:scale-95 flex items-center gap-2"
                >
                    Log In
                </button>
            </div>
        );
    }

    if (contentItems.length === 0) {
        return (
            <div className="min-h-screen pt-32 px-[4%] flex flex-col items-center justify-center text-center bg-black">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Heart size={40} className="text-rose-500" />
                </div>
                <h1 className="text-3xl font-bold mb-4 text-white">No Favorites Yet</h1>
                <p className="text-gray-400 max-w-md mb-8">
                    Mark movies and series as favorites to easily find them again.
                </p>
                <Link href="/" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors">
                    Start Exploring
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-20 px-[4%] bg-black">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Heart className="text-rose-500" fill="currentColor" />
                My Favorites
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {contentItems.map((item: any) => (
                    <MovieCard key={item.id} movie={item} />
                ))}
            </div>
        </div>
    );
}
