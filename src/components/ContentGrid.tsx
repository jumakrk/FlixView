'use client';

import { useState, useEffect } from 'react';
import { Movie, fetchDiscover } from '@/lib/tmdb';
import MovieCard from './MovieCard';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface ContentGridProps {
    initialItems: Movie[];
    type: 'movie' | 'tv';
}

export default function ContentGrid({ initialItems, type }: ContentGridProps) {
    const searchParams = useSearchParams();
    const [items, setItems] = useState<Movie[]>(initialItems);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const genre = searchParams.get('genre') || undefined;
    const year = searchParams.get('year') || undefined;
    const sortBy = searchParams.get('sortBy') || undefined;

    // Reset and fetch when filters change
    useEffect(() => {
        const fetchFiltered = async () => {
            setLoading(true);
            setPage(1);
            const initialFiltered = await fetchDiscover(type, 1, genre, year, sortBy);
            setItems(initialFiltered);
            setHasMore(initialFiltered.length > 0);
            setLoading(false);
        };

        if (genre || year || sortBy) {
            fetchFiltered();
        } else {
            setItems(initialItems);
            setPage(1);
            setHasMore(true);
        }
    }, [genre, year, sortBy, initialItems, type]);

    const loadMore = async () => {
        if (loading) return;
        setLoading(true);
        const nextPage = page + 1;

        try {
            const newItems = await fetchDiscover(type, nextPage, genre, year, sortBy);

            if (newItems.length === 0) {
                setHasMore(false);
            } else {
                setItems(prev => [...prev, ...newItems]);
                setPage(nextPage);
            }
        } catch (error) {
            console.error('Failed to load more content:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 w-full">
                {items.map((item) => (
                    <MovieCard key={`${item.id}-${Math.random()}`} movie={item} className="w-full" />
                ))}
            </div>

            {hasMore && (
                <button
                    onClick={loadMore}
                    disabled={loading}
                    className="mt-12 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Loading...
                        </>
                    ) : (
                        'Load More'
                    )}
                </button>
            )}
        </div>
    );
}
