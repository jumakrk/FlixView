'use client';

import { useSearchParams } from 'next/navigation';
import WatchPageClient from './[type]/[id]/WatchPageClient';
import { Suspense } from 'react';

function WatchContent() {
    const searchParams = useSearchParams();
    const type = searchParams.get('type') || 'movie';
    const id = searchParams.get('id');

    if (!id) return <div className="p-10 text-center">Invalid playback ID</div>;

    return <WatchPageClient id={id} type={type} />;
}

export default function WatchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <WatchContent />
        </Suspense>
    );
}
