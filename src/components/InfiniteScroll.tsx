'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfiniteScrollProps {
    /** Loads the next page; called when the user nears the end of the list. */
    onLoadMore: () => void;
    hasMore: boolean;
    loading: boolean;
    className?: string;
}

// Starts loading this far before the end of the list comes into view, so the
// next page is usually ready before the user reaches it.
const PRELOAD_MARGIN = '800px';

/**
 * Invisible marker placed after a grid that loads the next page as the user
 * scrolls towards it (replaces "Load More" buttons). While a page is loading
 * it shows a spinner; once there is nothing left it renders nothing.
 */
export default function InfiniteScroll({ onLoadMore, hasMore, loading, className }: InfiniteScrollProps) {
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Keep the latest callback without re-creating the observer every render.
    const onLoadMoreRef = useRef(onLoadMore);
    useEffect(() => {
        onLoadMoreRef.current = onLoadMore;
    }, [onLoadMore]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasMore || loading) return;

        // A fresh observer reports immediately if the marker is already in
        // view, so short pages keep loading until the screen is filled.
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some(entry => entry.isIntersecting)) {
                    observer.disconnect();
                    onLoadMoreRef.current();
                }
            },
            { rootMargin: `0px 0px ${PRELOAD_MARGIN} 0px` }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loading]);

    if (!hasMore) return null;

    return (
        <div ref={sentinelRef} className={cn('flex justify-center py-10', className)} aria-live="polite">
            {loading && (
                <span className="flex items-center gap-2 text-sm font-semibold text-white/60">
                    <Loader2 size={20} className="animate-spin text-violet-400" />
                    Loading more...
                </span>
            )}
        </div>
    );
}
