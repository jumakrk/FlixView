import { Suspense } from 'react';
import WatchPageClient from './WatchPageClient';
import AnimeWatchPageClient from '../../AnimeWatchPageClient';

interface PageProps {
    params: Promise<{
        type: string;
        id: string;
    }>;
}

export function generateStaticParams() {
    return [{ type: 'movie', id: '1' }];
}

export default async function WatchPage({ params }: PageProps) {
    const { type, id } = await params;

    if (type === 'anime') {
        return (
            <Suspense fallback={<div className="min-h-screen bg-black" />}>
                <AnimeWatchPageClient id={id} />
            </Suspense>
        );
    }

    return <WatchPageClient id={id} type={type} />;
}
