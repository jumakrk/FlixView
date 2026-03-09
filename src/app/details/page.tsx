'use client';

import { useSearchParams } from 'next/navigation';
import DetailsClient from './[type]/[id]/DetailsClient';
import { Suspense } from 'react';

function DetailsContent() {
    const searchParams = useSearchParams();
    const type = searchParams.get('type') || 'movie';
    const id = searchParams.get('id');

    if (!id) return <div className="p-10 text-center">Invalid ID</div>;

    return <DetailsClient id={id} type={type} />;
}

export default function DetailsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <DetailsContent />
        </Suspense>
    );
}
