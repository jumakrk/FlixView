'use client';

import { useSearchParams } from 'next/navigation';
import DetailsClient from './[type]/[id]/DetailsClient';
import AnimeDetailsClient from './AnimeDetailsClient';
import { Suspense } from 'react';

function DetailsContent() {
    const searchParams = useSearchParams();
    const type = searchParams.get('type') || 'movie';
    const id = searchParams.get('id');

    if (!id) return <div className="p-10 text-center">Invalid ID</div>;

    // Anime is a completely separate data source: every anime detail page is
    // powered by AniList, never TMDB.
    if (type === 'anime') {
        return <AnimeDetailsClient id={id} />;
    }

    return <DetailsClient id={id} type={type} />;
}

export default function DetailsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen" />}>
            <DetailsContent />
        </Suspense>
    );
}
